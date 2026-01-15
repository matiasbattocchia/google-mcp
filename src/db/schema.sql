-- API Keys table: maps permanent API keys to Google OAuth credentials
CREATE TABLE IF NOT EXISTS api_keys (
  api_key TEXT PRIMARY KEY,
  google_access_token TEXT NOT NULL,
  google_refresh_token TEXT NOT NULL,
  scopes TEXT NOT NULL,  -- JSON array of enabled scopes
  expires_at INTEGER,    -- Unix timestamp, NULL = never expires
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for cleanup of expired keys
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Pending OAuth states (temporary, for OAuth flow)
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  scopes TEXT NOT NULL,  -- JSON array of requested scopes
  expiration TEXT NOT NULL DEFAULT 'never',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
