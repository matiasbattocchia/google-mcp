# OpenBSP MCP for Google Workspace

A public [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that lets AI assistants access your Google Calendar and Sheets.

**Live at: https://g.mcp.openbsp.dev**

## Why this exists

Most Google MCP servers require you to create your own Google Cloud project, set up OAuth credentials, and run a local server. This is tedious and error-prone.

**This project is different.** It's a hosted public server with proxy OAuth. You just:

1. Click "Login with Google"
2. Get an API key
3. Add it to your MCP client

No Google Cloud setup. No local servers. No environment variables. Just connect and go.

## What you can do

Once connected, ask your AI assistant to:

- List and search your calendar events
- Create, update, or delete events
- Read and write to Google Sheets
- Create new spreadsheets

## How it works

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  AI Client   │────▶│  OpenBSP MCP     │────▶│  Google APIs │
│  (Claude)    │◀────│  Server          │◀────│              │
└──────────────┘     └──────────────────┘     └──────────────┘
```

1. You select which Google products to connect (Calendar, Sheets)
2. You authenticate with Google and grant permissions
3. You receive an API key to configure your MCP client
4. Your AI assistant can now access your Google data

## Privacy & Security

### What we store

| Data | Purpose | Encrypted |
|------|---------|-----------|
| API Key | Authenticate your MCP client | Hashed |
| OAuth Tokens | Access Google APIs on your behalf | Yes |
| Scopes | Remember which products you authorized | No |

### What we DON'T store

- Your Google password
- Your email content
- Your calendar events or spreadsheet data
- Any personal information

### Data retention

- **API keys**: Stored until you revoke them (or until expiration if set)
- **OAuth tokens**: Stored alongside your API key
- **Temporary auth states**: Deleted after 10 minutes

### How to revoke access

**Option 1: Delete your API key**
```bash
curl -X DELETE https://g.mcp.openbsp.dev/key/YOUR_API_KEY
```

**Option 2: Revoke from Google**
1. Go to [Google Account Security](https://myaccount.google.com/permissions)
2. Find "OpenBSP MCP" in the list
3. Click "Remove Access"

Both options will immediately invalidate your API key.

## Setup for MCP Clients

After authenticating, add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "google-mcp": {
      "url": "https://g.mcp.openbsp.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### Programmatic integration

MCP clients can automate the setup by redirecting users to:

```
https://g.mcp.openbsp.dev/auth/google?products=calendar,sheets&callback=YOUR_CALLBACK_URL
```

After authentication, the user is redirected to your callback with credentials in the URL fragment:

```
YOUR_CALLBACK_URL#api_key=gmc_xxx&url=https://g.mcp.openbsp.dev/mcp
```

## Available Tools

### Calendar

| Tool | Description |
|------|-------------|
| `list_calendars` | List all your calendars |
| `list_events` | Get events with optional date filters |
| `check_availability` | Check busy/free times (no event details exposed) |
| `create_event` | Create a new calendar event |
| `update_event` | Update an existing event |
| `delete_event` | Delete an event |

### Sheets

| Tool | Description |
|------|-------------|
| `get_spreadsheet` | Get spreadsheet metadata by ID |
| `get_sheet_schema` | Get column names and inferred types |
| `read_sheet` | Read data from a range (e.g., "A1:D10") |
| `write_sheet` | Write data to a range |
| `append_rows` | Append rows to a table |
| `create_spreadsheet` | Create a new spreadsheet |

**Note**: Sheets tools require the spreadsheet ID, which you can find in the share URL:
`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

## Self-Hosting

Want to run your own instance? See [DEPLOY.md](DEPLOY.md) for instructions.

## FAQ

**Is this official?**
No, this is an independent open-source project. It is not affiliated with Google or Anthropic.

**Is it safe?**
We only request the minimum permissions needed. Your data flows directly between Google and your AI client through our server - we don't store or log it.

**Can I see the code?**
Yes! This project is open source. Review the code, run your own instance, or contribute improvements.

**What if I lose my API key?**
Generate a new one by authenticating again. Old keys remain valid unless you revoke them.

**Does it cost anything?**
This public instance is free. If you self-host, you'll pay for Cloudflare Workers (generous free tier available).
