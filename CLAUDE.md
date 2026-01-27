# Claude Code Project Notes

## Local Development

- **Dev server port**: Must run on `http://localhost:8787` - this is the only port configured in Google OAuth redirect URIs
- **Only one dev server** should run at a time to avoid port conflicts
- Start with: `npm run dev`
- OAuth flow: `http://localhost:8787/auth`

## Stack

- Cloudflare Workers + D1 (SQLite) + Hono
- TypeScript with Zod for validation
- AES-256-GCM encryption for OAuth tokens

## Key Files

- `src/auth/google.ts` - OAuth scopes and token handling
- `src/db/index.ts` - Database operations with encryption
- `src/mcp/tools/*.ts` - MCP tool implementations
- `src/lib/crypto.ts` - Encryption utilities

## Secrets (required)

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BASE_URL`
- `ENCRYPTION_KEY` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
