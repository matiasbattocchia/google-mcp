import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  getApiKeyRecord,
  createApiKey,
  deleteApiKey,
  updateTokens,
  createOAuthState,
  getOAuthState,
  updateOAuthStateApiKey,
  consumeOAuthState,
  expirationToTimestamp,
  saveAuthorizedFiles,
  getAuthorizedFiles,
} from './db/index.ts';
import {
  GOOGLE_SCOPES,
  type GoogleProduct,
  getAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  expandScopes,
} from './auth/google.ts';
import { getUserEmail } from './lib/google.ts';
import { handleMcpRequest, type McpHttpRequest } from './mcp/server.ts';
import { renderHomePage, renderAuthPage, renderSuccessPage, renderSuccessPageFromFragment, renderErrorPage, renderPrivacyPolicy, renderTermsOfService, renderFilePickerPage } from './ui/pages.ts';

type Bindings = Env & {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BASE_URL: string;
  ENCRYPTION_KEY: string; // AES-256 key for encrypting OAuth tokens (required)
};

// Extract project number from Client ID (format: {project_number}-{random}.apps.googleusercontent.com)
function getAppIdFromClientId(clientId: string): string {
  const match = clientId.match(/^(\d+)-/);
  if (!match) {
    throw new Error('Invalid GOOGLE_CLIENT_ID format: expected {project_number}-{random}.apps.googleusercontent.com');
  }
  return match[1];
}

const app = new Hono<{ Bindings: Bindings }>();

// CORS for MCP clients
app.use('/mcp', cors());
app.use('/mcp/*', cors());

// Home page - informational
app.get('/', (c) => {
  return c.html(renderHomePage());
});

// Auth page - product selection UI
app.get('/auth', (c) => {
  return c.html(renderAuthPage(GOOGLE_SCOPES));
});

// Legal pages
app.get('/privacy-policy', (c) => c.html(renderPrivacyPolicy()));
app.get('/terms-of-service', (c) => c.html(renderTermsOfService()));

// Start OAuth flow
app.get('/auth/google', async (c) => {
  const productsParam = c.req.query('products');
  if (!productsParam) {
    return c.html(renderErrorPage('No products selected'), 400);
  }

  const products = productsParam.split(',') as GoogleProduct[];
  const validProducts = products.filter((p) => p in GOOGLE_SCOPES);

  if (validProducts.length === 0) {
    return c.html(renderErrorPage('No valid products selected'), 400);
  }

  const expiration = c.req.query('expiration') ?? 'never';
  const callback = c.req.query('callback'); // Optional callback URL for programmatic flows
  const scopes = expandScopes(validProducts);
  const state = await createOAuthState(c.env.DB, scopes, expiration, callback);
  const redirectUri = `${c.env.BASE_URL}/auth/callback`;

  const authUrl = getAuthUrl(c.env.GOOGLE_CLIENT_ID, redirectUri, state, scopes);

  return c.redirect(authUrl);
});

// OAuth callback
app.get('/auth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    return c.html(renderErrorPage(`OAuth error: ${error}`), 400);
  }

  if (!code || !state) {
    return c.html(renderErrorPage('Missing code or state'), 400);
  }

  // Get state without consuming (we need it for file selection step)
  const oauthState = await getOAuthState(c.env.DB, state);
  if (!oauthState) {
    return c.html(renderErrorPage('Invalid or expired state'), 400);
  }

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      c.env.GOOGLE_CLIENT_ID,
      c.env.GOOGLE_CLIENT_SECRET,
      `${c.env.BASE_URL}/auth/callback`
    );

    const expiresAt = expirationToTimestamp(oauthState.expiration);
    const apiKey = await createApiKey(
      c.env.DB,
      { access_token: tokens.access_token, refresh_token: tokens.refresh_token },
      oauthState.scopes,
      expiresAt,
      c.env.ENCRYPTION_KEY
    );

    // Check if sheets (drive.file) scope is included - need file selection
    const hasDriveFileScope = oauthState.scopes.includes('https://www.googleapis.com/auth/drive.file');

    if (hasDriveFileScope) {
      // Store API key in state and redirect to file picker
      await updateOAuthStateApiKey(c.env.DB, state, apiKey);
      return c.redirect(`/auth/files?state=${state}`);
    }

    // No file selection needed - consume state and finish
    await consumeOAuthState(c.env.DB, state);

    // If callback URL provided, redirect with API key in fragment
    if (oauthState.callback) {
      const email = await getUserEmail(tokens.access_token);
      const callbackUrl = new URL(oauthState.callback);
      const fragment = new URLSearchParams({
        api_key: apiKey,
        url: `${c.env.BASE_URL}/mcp`,
        email,
      });
      return c.redirect(`${callbackUrl.toString()}#${fragment.toString()}`);
    }

    return c.html(renderSuccessPage(apiKey, c.env.BASE_URL));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // If callback URL provided, redirect with error in fragment
    if (oauthState.callback) {
      const callbackUrl = new URL(oauthState.callback);
      const fragment = new URLSearchParams({ error: message });
      return c.redirect(`${callbackUrl.toString()}#${fragment.toString()}`);
    }

    return c.html(renderErrorPage(`Token exchange failed: ${message}`), 500);
  }
});

// File picker page (for drive.file scope)
app.get('/auth/files', async (c) => {
  const state = c.req.query('state');
  if (!state) {
    return c.html(renderErrorPage('Missing state parameter'), 400);
  }

  const oauthState = await getOAuthState(c.env.DB, state);
  if (!oauthState || !oauthState.apiKey) {
    return c.html(renderErrorPage('Invalid or expired state'), 400);
  }

  // Get the API key record to access the OAuth token for the picker
  const record = await getApiKeyRecord(c.env.DB, oauthState.apiKey, c.env.ENCRYPTION_KEY);
  if (!record) {
    return c.html(renderErrorPage('API key not found'), 400);
  }

  return c.html(renderFilePickerPage({
    state,
    oauthToken: record.google_access_token,
    clientId: c.env.GOOGLE_CLIENT_ID,
    appId: getAppIdFromClientId(c.env.GOOGLE_CLIENT_ID),
  }));
});

// File picker submission
app.post('/auth/files', async (c) => {
  let body: { state: string; files: { id: string; name: string; mimeType: string }[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { state, files } = body;
  if (!state) {
    return c.json({ error: 'Missing state' }, 400);
  }

  const oauthState = await consumeOAuthState(c.env.DB, state);
  if (!oauthState || !oauthState.apiKey) {
    return c.json({ error: 'Invalid or expired state' }, 400);
  }

  // Save authorized files (if any selected)
  if (files && files.length > 0) {
    await saveAuthorizedFiles(c.env.DB, oauthState.apiKey, files);
  }

  // Return success with redirect info
  if (oauthState.callback) {
    // Get access token to fetch user email
    const record = await getApiKeyRecord(c.env.DB, oauthState.apiKey, c.env.ENCRYPTION_KEY);
    const email = record ? await getUserEmail(record.google_access_token) : '';

    const callbackUrl = new URL(oauthState.callback);
    const fragment = new URLSearchParams({
      api_key: oauthState.apiKey,
      url: `${c.env.BASE_URL}/mcp`,
      email,
    });
    // Include selected file names (comma-separated)
    if (files && files.length > 0) {
      fragment.set('files', files.map(f => f.name).join(','));
    }
    return c.json({ redirect: `${callbackUrl.toString()}#${fragment.toString()}` });
  }

  return c.json({ apiKey: oauthState.apiKey, baseUrl: c.env.BASE_URL });
});

// Success page (reads API key from fragment)
app.get('/auth/success', (c) => {
  return c.html(renderSuccessPageFromFragment());
});

// Revoke API key
app.delete('/key/:apiKey', async (c) => {
  const apiKey = c.req.param('apiKey');

  const record = await getApiKeyRecord(c.env.DB, apiKey, c.env.ENCRYPTION_KEY);
  if (!record) {
    return c.json({ error: 'API key not found' }, 404);
  }

  // Revoke Google tokens
  try {
    await revokeToken(record.google_access_token);
  } catch {
    // Ignore revocation errors
  }

  await deleteApiKey(c.env.DB, apiKey);

  return c.json({ success: true });
});

// MCP endpoint - HTTP transport
app.post('/mcp', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32001, message: 'Missing or invalid Authorization header' },
      },
      401
    );
  }

  const apiKey = authHeader.slice(7);
  const record = await getApiKeyRecord(c.env.DB, apiKey, c.env.ENCRYPTION_KEY);

  if (!record) {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32001, message: 'Invalid API key' },
      },
      401
    );
  }

  let accessToken = record.google_access_token;
  const scopes: string[] = JSON.parse(record.scopes);

  // Try to refresh token if needed (we'll detect this on API error)
  const refreshTokenIfNeeded = async () => {
    try {
      const newTokens = await refreshAccessToken(
        record.google_refresh_token,
        c.env.GOOGLE_CLIENT_ID,
        c.env.GOOGLE_CLIENT_SECRET
      );
      await updateTokens(c.env.DB, apiKey, { access_token: newTokens.access_token }, c.env.ENCRYPTION_KEY);
      return newTokens.access_token;
    } catch {
      return null;
    }
  };

  let request: McpHttpRequest;
  try {
    request = await c.req.json();
  } catch {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      },
      400
    );
  }

  // Handle the MCP request
  let response = await handleMcpRequest(request, accessToken, scopes, c.env.DB, apiKey);

  // If we got a Google API error that might be auth-related, try refreshing
  if (response.error?.message?.includes('401') || response.error?.message?.includes('403')) {
    const newToken = await refreshTokenIfNeeded();
    if (newToken) {
      accessToken = newToken;
      response = await handleMcpRequest(request, accessToken, scopes, c.env.DB, apiKey);
    }
  }

  return c.json(response);
});

// Catch-all for /mcp - return 401 for missing auth instead of 404
app.all('/mcp', (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32001, message: 'Missing or invalid Authorization header' },
      },
      401
    );
  }
  // Auth present but method not supported
  return c.json(
    {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32601, message: 'Method not allowed. Use POST.' },
    },
    405
  );
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
