import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  getApiKeyRecord,
  createApiKey,
  deleteApiKey,
  updateTokens,
  createOAuthState,
  consumeOAuthState,
  expirationToTimestamp,
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
import { handleMcpRequest, type McpHttpRequest } from './mcp/server.ts';
import { renderHomePage, renderSuccessPage, renderErrorPage } from './ui/pages.ts';

type Bindings = Env & {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS for MCP clients
app.use('/mcp/*', cors());

// Home page - product selection UI
app.get('/', (c) => {
  return c.html(renderHomePage(GOOGLE_SCOPES));
});

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
  const scopes = expandScopes(validProducts);
  const state = await createOAuthState(c.env.DB, scopes, expiration);
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

  const oauthState = await consumeOAuthState(c.env.DB, state);
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
      expiresAt
    );

    return c.html(renderSuccessPage(apiKey, c.env.BASE_URL));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.html(renderErrorPage(`Token exchange failed: ${message}`), 500);
  }
});

// Revoke API key
app.delete('/key/:apiKey', async (c) => {
  const apiKey = c.req.param('apiKey');

  const record = await getApiKeyRecord(c.env.DB, apiKey);
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
  const record = await getApiKeyRecord(c.env.DB, apiKey);

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

  // Try to refresh token if needed (we'll detect this on API error)
  const refreshTokenIfNeeded = async () => {
    try {
      const newTokens = await refreshAccessToken(
        record.google_refresh_token,
        c.env.GOOGLE_CLIENT_ID,
        c.env.GOOGLE_CLIENT_SECRET
      );
      await updateTokens(c.env.DB, apiKey, { access_token: newTokens.access_token });
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
  let response = await handleMcpRequest(request, accessToken);

  // If we got a Google API error that might be auth-related, try refreshing
  if (response.error?.message?.includes('401') || response.error?.message?.includes('403')) {
    const newToken = await refreshTokenIfNeeded();
    if (newToken) {
      accessToken = newToken;
      response = await handleMcpRequest(request, accessToken);
    }
  }

  return c.json(response);
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
