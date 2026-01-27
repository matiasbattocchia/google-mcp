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
}

export async function consumeOAuthState(db: D1Database, state: string): Promise<ConsumedOAuthState | null> {
  const result = await db.prepare(`
    SELECT scopes, expiration, callback FROM oauth_states WHERE state = ?
  `).bind(state).first<{ scopes: string; expiration: string; callback: string | null }>();

  if (!result) return null;

  await db.prepare(`
    DELETE FROM oauth_states WHERE state = ?
  `).bind(state).run();

  return {
    scopes: JSON.parse(result.scopes),
    expiration: result.expiration,
    callback: result.callback,
  };
}
