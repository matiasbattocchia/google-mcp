# Self-Hosting Guide

Deploy your own instance of Google MCP Server on Cloudflare Workers.

## Prerequisites

- Node.js 18+
- Cloudflare account
- Google Cloud project

## 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable APIs:
   - Google Calendar API
   - Google Sheets API
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Add authorized redirect URI: `https://your-worker.workers.dev/auth/callback`
5. Note your **Client ID** and **Client Secret**

## 2. Cloudflare Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/google-mcp.git
cd google-mcp

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create google-mcp-db
```

Update `wrangler.toml` with the database ID from the output above.

## 3. Run Migrations

```bash
# Local
npm run db:migrate

# Production
npm run db:migrate:prod
```

## 4. Set Secrets

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put BASE_URL  # e.g., https://google-mcp.your-subdomain.workers.dev
npx wrangler secret put ENCRYPTION_KEY  # See below for generating
```

### Generate Encryption Key

The `ENCRYPTION_KEY` is used to encrypt OAuth tokens at rest. Generate a secure 256-bit key:

```bash
# Generate a random 32-byte key, base64 encoded
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it when prompted for `ENCRYPTION_KEY`.

## 5. Deploy

```bash
npm run deploy
```

## 6. Update Google OAuth

Add your production URL to Google Cloud Console:
- Authorized redirect URI: `https://your-worker.workers.dev/auth/callback`

## Local Development

```bash
# Create .dev.vars file
cat > .dev.vars << EOF
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
BASE_URL=http://localhost:8787
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
EOF

# Run locally
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud | Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret from Google Cloud | Yes |
| `BASE_URL` | Your deployment URL (for OAuth redirect) | Yes |
| `ENCRYPTION_KEY` | AES-256 key for encrypting OAuth tokens (base64) | Recommended |

## Updating

```bash
git pull
npm install
npm run db:migrate:prod  # if schema changed
npm run deploy
```
