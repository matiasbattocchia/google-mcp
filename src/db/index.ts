import { encrypt, decrypt } from '../lib/crypto.ts';

export interface ApiKeyRecord {
  api_key: string;
  google_access_token: string;
  google_refresh_token: string;
  scopes: string;
  expires_at: number | null;
  created_at: number;
}

export interface OAuthState {
  state: string;
  scopes: string;
  created_at: number;
}

export function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'gmc_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createApiKey(
  db: D1Database,
  tokens: { access_token: string; refresh_token: string },
  scopes: string[],
  expiresAt: number | null = null,
  encryptionKey: string
): Promise<string> {
  const apiKey = generateApiKey();

  // Encrypt tokens before storing
  const accessToken = await encrypt(tokens.access_token, encryptionKey);
  const refreshToken = await encrypt(tokens.refresh_token, encryptionKey);

  await db.prepare(`
    INSERT INTO api_keys (api_key, google_access_token, google_refresh_token, scopes, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    apiKey,
    accessToken,
    refreshToken,
    JSON.stringify(scopes),
    expiresAt
  ).run();

  return apiKey;
}

export async function getApiKeyRecord(
  db: D1Database,
  apiKey: string,
  encryptionKey: string
): Promise<ApiKeyRecord | null> {
  const result = await db.prepare(`
    SELECT * FROM api_keys WHERE api_key = ?
  `).bind(apiKey).first<ApiKeyRecord>();

  if (!result) return null;

  // Check if expired
  if (result.expires_at && result.expires_at < Math.floor(Date.now() / 1000)) {
    await deleteApiKey(db, apiKey);
    return null;
  }

  // Decrypt tokens
  result.google_access_token = await decrypt(result.google_access_token, encryptionKey);
  result.google_refresh_token = await decrypt(result.google_refresh_token, encryptionKey);

  return result;
}

export async function updateTokens(
  db: D1Database,
  apiKey: string,
  tokens: { access_token: string; refresh_token?: string },
  encryptionKey: string
): Promise<void> {
  // Encrypt tokens before storing
  const accessToken = await encrypt(tokens.access_token, encryptionKey);

  if (tokens.refresh_token) {
    const refreshToken = await encrypt(tokens.refresh_token, encryptionKey);
    await db.prepare(`
      UPDATE api_keys SET google_access_token = ?, google_refresh_token = ? WHERE api_key = ?
    `).bind(accessToken, refreshToken, apiKey).run();
  } else {
    await db.prepare(`
      UPDATE api_keys SET google_access_token = ? WHERE api_key = ?
    `).bind(accessToken, apiKey).run();
  }
}

export async function deleteApiKey(db: D1Database, apiKey: string): Promise<boolean> {
  const result = await db.prepare(`
    DELETE FROM api_keys WHERE api_key = ?
  `).bind(apiKey).run();

  return result.meta.changes > 0;
}

// Expiration string to timestamp
export function expirationToTimestamp(expiration: string): number | null {
  const now = Math.floor(Date.now() / 1000);
  switch (expiration) {
    case '1hour': return now + 3600;
    case '1day': return now + 86400;
    case '7days': return now + 604800;
    case '30days': return now + 2592000;
    case '1year': return now + 31536000;
    case 'never':
    default: return null;
  }
}

// OAuth state management
export async function createOAuthState(
  db: D1Database,
  scopes: string[],
  expiration: string,
  callback?: string
): Promise<string> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const state = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  await db.prepare(`
    INSERT INTO oauth_states (state, scopes, expiration, callback) VALUES (?, ?, ?, ?)
  `).bind(state, JSON.stringify(scopes), expiration, callback ?? null).run();

  // Clean up old states (older than 10 minutes)
  await db.prepare(`
    DELETE FROM oauth_states WHERE created_at < ?
  `).bind(Math.floor(Date.now() / 1000) - 600).run();

  return state;
}

export interface ConsumedOAuthState {
  scopes: string[];
  expiration: string;
  callback: string | null;
  apiKey: string | null;
}

// Get OAuth state without consuming it (for multi-step flows)
export async function getOAuthState(db: D1Database, state: string): Promise<ConsumedOAuthState | null> {
  const result = await db.prepare(`
    SELECT scopes, expiration, callback, api_key FROM oauth_states WHERE state = ?
  `).bind(state).first<{ scopes: string; expiration: string; callback: string | null; api_key: string | null }>();

  if (!result) return null;

  // Check if expired (10 minutes)
  return {
    scopes: JSON.parse(result.scopes),
    expiration: result.expiration,
    callback: result.callback,
    apiKey: result.api_key,
  };
}

// Update OAuth state with API key (after token exchange, before file selection)
export async function updateOAuthStateApiKey(db: D1Database, state: string, apiKey: string): Promise<void> {
  await db.prepare(`
    UPDATE oauth_states SET api_key = ? WHERE state = ?
  `).bind(apiKey, state).run();
}

// Consume OAuth state (delete it and return data)
export async function consumeOAuthState(db: D1Database, state: string): Promise<ConsumedOAuthState | null> {
  const result = await getOAuthState(db, state);
  if (!result) return null;

  await db.prepare(`
    DELETE FROM oauth_states WHERE state = ?
  `).bind(state).run();

  return result;
}

// Authorized files management
export interface AuthorizedFile {
  fileId: string;
  fileName: string | null;
  mimeType: string | null;
  addedAt: number;
}

export async function saveAuthorizedFiles(
  db: D1Database,
  apiKey: string,
  files: { id: string; name: string; mimeType: string }[]
): Promise<void> {
  if (files.length === 0) return;

  // Insert files (ignore duplicates)
  for (const file of files) {
    await db.prepare(`
      INSERT OR IGNORE INTO authorized_files (api_key, file_id, file_name, mime_type)
      VALUES (?, ?, ?, ?)
    `).bind(apiKey, file.id, file.name, file.mimeType).run();
  }
}

export async function getAuthorizedFiles(
  db: D1Database,
  apiKey: string,
  mimeType?: string
): Promise<AuthorizedFile[]> {
  let query = `SELECT file_id, file_name, mime_type, added_at FROM authorized_files WHERE api_key = ?`;
  const params: string[] = [apiKey];

  if (mimeType) {
    query += ` AND mime_type = ?`;
    params.push(mimeType);
  }

  const result = await db.prepare(query).bind(...params).all<{
    file_id: string;
    file_name: string | null;
    mime_type: string | null;
    added_at: number;
  }>();

  return (result.results ?? []).map(row => ({
    fileId: row.file_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    addedAt: row.added_at,
  }));
}

export async function hasAuthorizedFileType(
  db: D1Database,
  apiKey: string,
  mimeType: string
): Promise<boolean> {
  const result = await db.prepare(`
    SELECT 1 FROM authorized_files WHERE api_key = ? AND mime_type = ? LIMIT 1
  `).bind(apiKey, mimeType).first();

  return result !== null;
}

export async function isFileAuthorized(
  db: D1Database,
  apiKey: string,
  fileId: string
): Promise<boolean> {
  const result = await db.prepare(`
    SELECT 1 FROM authorized_files WHERE api_key = ? AND file_id = ? LIMIT 1
  `).bind(apiKey, fileId).first();

  return result !== null;
}
