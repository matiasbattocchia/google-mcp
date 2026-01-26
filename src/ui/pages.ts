import type { GOOGLE_SCOPES } from '../auth/google.ts';

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #e5e5e5;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .container {
    max-width: 480px;
    width: 100%;
    background: #171717;
    border-radius: 12px;
    padding: 32px;
    border: 1px solid #262626;
  }
  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .subtitle {
    color: #a3a3a3;
    margin-bottom: 24px;
  }
  .products {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  .product {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #262626;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .product:hover {
    background: #333;
  }
  .product input {
    width: 20px;
    height: 20px;
    accent-color: #3b82f6;
  }
  .product-info {
    flex: 1;
  }
  .product-name {
    font-weight: 500;
  }
  .product-desc {
    font-size: 13px;
    color: #a3a3a3;
  }
  .btn {
    width: 100%;
    padding: 14px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn:hover {
    background: #2563eb;
  }
  .btn:disabled {
    background: #404040;
    cursor: not-allowed;
  }
  .expiration {
    margin-bottom: 24px;
  }
  .expiration label {
    display: block;
    margin-bottom: 8px;
    color: #a3a3a3;
    font-size: 14px;
  }
  .expiration select {
    width: 100%;
    padding: 12px;
    background: #262626;
    border: 1px solid #404040;
    border-radius: 8px;
    color: #e5e5e5;
    font-size: 14px;
    cursor: pointer;
  }
  .expiration select:hover {
    border-color: #525252;
  }
  .api-key {
    background: #262626;
    padding: 16px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 14px;
    word-break: break-all;
    margin-top: 16px;
  }
  .copy-btn {
    background: #404040;
    margin-top: 16px;
  }
  .config-example {
    background: #1e1e1e;
    padding: 16px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    margin-top: 16px;
    text-align: left;
  }
  .config-example pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
  .success-icon {
    width: 64px;
    height: 64px;
    background: #22c55e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }
  .error-icon {
    width: 64px;
    height: 64px;
    background: #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }
  .icon-svg {
    width: 32px;
    height: 32px;
    fill: white;
  }
  .text-center { text-align: center; }
  .footer-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 24px;
    color: #a3a3a3;
    font-size: 13px;
    text-decoration: none;
  }
  .footer-link:hover {
    color: #e5e5e5;
  }
  .footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 24px;
    font-size: 13px;
    color: #a3a3a3;
  }
  .footer-links a {
    color: inherit;
    text-decoration: none;
  }
  .footer-links a:hover {
    color: #e5e5e5;
  }
  .footer-links span {
    margin: 0 8px;
  }
  .footer-links svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    vertical-align: -2px;
  }
  .footer-link svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
  .error-message {
    color: #fca5a5;
    background: #450a0a;
    padding: 16px;
    border-radius: 8px;
    margin-top: 16px;
  }
`;

const homepageStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #e5e5e5;
    min-height: 100vh;
    padding: 40px 20px;
    line-height: 1.6;
  }
  .container {
    max-width: 720px;
    margin: 0 auto;
  }
  .hero {
    text-align: center;
    padding: 60px 0;
  }
  .hero h1 {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 16px;
  }
  .hero .subtitle {
    font-size: 18px;
    color: #a3a3a3;
    margin-bottom: 32px;
  }
  .btn {
    display: inline-block;
    padding: 14px 32px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s;
  }
  .btn:hover {
    background: #2563eb;
  }
  .section {
    background: #171717;
    border-radius: 12px;
    padding: 32px;
    border: 1px solid #262626;
    margin-bottom: 24px;
  }
  .section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  .section p {
    color: #a3a3a3;
    margin-bottom: 16px;
  }
  .section ul {
    color: #d4d4d4;
    padding-left: 24px;
  }
  .section li {
    margin-bottom: 8px;
  }
  .section a {
    color: #3b82f6;
    text-decoration: none;
  }
  .section a:hover {
    color: #60a5fa;
  }
  .diagram {
    background: #262626;
    border-radius: 8px;
    padding: 24px;
    font-family: monospace;
    font-size: 14px;
    text-align: center;
    margin: 16px 0;
    overflow-x: auto;
  }
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  .feature {
    background: #262626;
    border-radius: 8px;
    padding: 20px;
  }
  .feature h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .feature p {
    font-size: 14px;
    color: #a3a3a3;
    margin: 0 0 6px 0;
  }
  .feature p:last-child {
    margin-bottom: 0;
  }
  .feature code {
    color: #e5e5e5;
    font-size: 13px;
  }
  .footer-links {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 40px;
    font-size: 13px;
    color: #a3a3a3;
  }
  .footer-links a {
    color: inherit;
    text-decoration: none;
  }
  .footer-links a:hover {
    color: #e5e5e5;
  }
  .footer-links span {
    margin: 0 8px;
  }
  .footer-links svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    vertical-align: -2px;
  }
`;

export function renderHomePage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenBSP MCP for Google Workspace</title>
  <style>${homepageStyles}</style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>OpenBSP MCP for Google Workspace</h1>
      <p class="subtitle">Let AI assistants access your Google Calendar and Sheets</p>
      <a href="/auth" class="btn">Get Started</a>
    </div>

    <div class="section">
      <h2>What is this?</h2>
      <p>This is a hosted MCP server that connects AI assistants (like Claude) to your Google Calendar and Google Sheets. Once connected, you can ask your AI to check your schedule, create events, read spreadsheets, and more.</p>
    </div>

    <div class="section">
      <h2>How it works</h2>
      <p>1. You authenticate with Google and grant permissions for Calendar and/or Sheets</p>
      <p>2. You receive an API key to configure your MCP client</p>
      <p>3. Your AI assistant can now access your Google data through our server</p>
    </div>

    <div class="section">
      <h2>Available tools</h2>
      <div class="features">
        <div class="feature">
          <h3>Calendar</h3>
          <p><code>list_calendars</code> - List all calendars</p>
          <p><code>list_events</code> - Get events with date filters</p>
          <p><code>check_availability</code> - Check busy/free times</p>
          <p><code>create_event</code> - Create new events</p>
          <p><code>update_event</code> - Modify existing events</p>
          <p><code>delete_event</code> - Remove events</p>
        </div>
        <div class="feature">
          <h3>Sheets</h3>
          <p><code>get_spreadsheet</code> - Get spreadsheet metadata</p>
          <p><code>get_sheet_schema</code> - Get column names and types</p>
          <p><code>search_rows</code> - Search rows with filters</p>
          <p><code>read_sheet</code> - Read data from ranges</p>
          <p><code>write_sheet</code> - Write data to ranges</p>
          <p><code>append_rows</code> - Append rows to tables</p>
          <p><code>create_spreadsheet</code> - Create new spreadsheets</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Privacy</h2>
      <p>We take privacy seriously:</p>
      <ul>
        <li>We only store your API key and OAuth tokens</li>
        <li>We don't log, store, or inspect your calendar events or spreadsheet data</li>
        <li>You can <a href="/privacy-policy#delete">revoke access</a> at any time</li>
        <li>The project is <a href="https://github.com/matiasbattocchia/google-mcp" target="_blank">open source</a> for full transparency</li>
      </ul>
    </div>

    <div class="footer-links">
      <a href="https://github.com/matiasbattocchia/google-mcp" target="_blank"><svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> Source</a>
      <span>•</span>
      <a href="/privacy-policy">Privacy</a>
      <span>•</span>
      <a href="/terms-of-service">Terms</a>
    </div>
  </div>
</body>
</html>`;
}

export function renderAuthPage(scopes: typeof GOOGLE_SCOPES): string {
  const products = Object.entries(scopes).map(([key, value]) => ({
    id: key,
    label: value.label,
    description: `Access your ${value.label} data`,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect - OpenBSP MCP</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <h1>Connect Google Workspace</h1>
    <p class="subtitle">Select which products to connect</p>

    <form id="authForm" action="/auth/google" method="get">
      <div class="products">
        ${products
          .map(
            (p) => `
          <label class="product">
            <input type="checkbox" name="product" value="${p.id}">
            <div class="product-info">
              <div class="product-name">${p.label}</div>
              <div class="product-desc">${p.description}</div>
            </div>
          </label>
        `
          )
          .join('')}
      </div>

      <div class="expiration">
        <label for="expiration">API Key Expiration</label>
        <select name="expiration" id="expiration">
          <option value="never" selected>Never</option>
          <option value="1hour">1 hour</option>
          <option value="1day">1 day</option>
          <option value="7days">7 days</option>
          <option value="30days">30 days</option>
          <option value="1year">1 year</option>
        </select>
      </div>

      <button type="submit" class="btn" id="submitBtn" disabled>
        Login with Google
      </button>
    </form>

    <div class="footer-links">
      <a href="https://github.com/matiasbattocchia/google-mcp" target="_blank"><svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> Source</a>
      <span>•</span>
      <a href="/privacy-policy">Privacy</a>
      <span>•</span>
      <a href="/terms-of-service">Terms</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('authForm');
    const checkboxes = document.querySelectorAll('input[name="product"]');
    const submitBtn = document.getElementById('submitBtn');

    function updateSubmitBtn() {
      const checked = Array.from(checkboxes).some(cb => cb.checked);
      submitBtn.disabled = !checked;
    }

    checkboxes.forEach(cb => cb.addEventListener('change', updateSubmitBtn));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const selected = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      const expiration = document.getElementById('expiration').value;
      window.location.href = '/auth/google?products=' + selected.join(',') + '&expiration=' + expiration;
    });
  </script>
</body>
</html>`;
}

export function renderSuccessPage(apiKey: string, baseUrl: string): string {
  const mcpConfig = {
    mcpServers: {
      'google-mcp': {
        url: `${baseUrl}/mcp`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Success - OpenBSP MCP</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container text-center">
    <div class="success-icon">
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </div>

    <h1>Connected!</h1>
    <p class="subtitle">Your API key has been generated</p>

    <div class="api-key" id="apiKey">${apiKey}</div>

    <button class="btn copy-btn" onclick="copyKey()">Copy API Key</button>

    <div class="config-example">
      <p style="color: #a3a3a3; margin-bottom: 8px; font-family: sans-serif;">MCP Client Config:</p>
      <pre id="config">${JSON.stringify(mcpConfig, null, 2)}</pre>
    </div>

    <button class="btn copy-btn" onclick="copyConfig()">Copy Config</button>

    <p style="color: #a3a3a3; margin-top: 24px; font-size: 13px;">
      Save this key securely. It won't be shown again.
    </p>
  </div>

  <script>
    function copyKey() {
      navigator.clipboard.writeText('${apiKey}');
      event.target.textContent = 'Copied!';
      setTimeout(() => event.target.textContent = 'Copy API Key', 2000);
    }

    function copyConfig() {
      navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(mcpConfig)}, null, 2));
      event.target.textContent = 'Copied!';
      setTimeout(() => event.target.textContent = 'Copy Config', 2000);
    }
  </script>
</body>
</html>`;
}

const legalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #e5e5e5;
    min-height: 100vh;
    padding: 40px 20px;
    line-height: 1.6;
  }
  .container {
    max-width: 720px;
    margin: 0 auto;
    background: #171717;
    border-radius: 12px;
    padding: 40px;
    border: 1px solid #262626;
  }
  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-top: 32px;
    margin-bottom: 12px;
    color: #fff;
  }
  .updated {
    color: #a3a3a3;
    font-size: 14px;
    margin-bottom: 32px;
  }
  p, ul {
    color: #d4d4d4;
    margin-bottom: 16px;
  }
  ul {
    padding-left: 24px;
  }
  li {
    margin-bottom: 8px;
  }
  a {
    color: #3b82f6;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .back {
    display: inline-block;
    margin-top: 32px;
    color: #a3a3a3;
  }
`;

export function renderPrivacyPolicy(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - OpenBSP MCP</title>
  <style>${legalStyles}</style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: January 2026</p>

    <h2>What we collect</h2>
    <p>When you use OpenBSP MCP, we store:</p>
    <ul>
      <li><strong>API Key</strong> - A randomly generated key to authenticate your MCP client</li>
      <li><strong>OAuth Tokens</strong> - Access and refresh tokens from Google to make API calls on your behalf</li>
      <li><strong>Scopes</strong> - Which Google products you authorized (Calendar, Sheets)</li>
    </ul>

    <h2>What we don't collect</h2>
    <ul>
      <li>Your Google password</li>
      <li>Your email address or personal information</li>
      <li>Your calendar events or spreadsheet data</li>
      <li>Usage logs or analytics</li>
    </ul>

    <h2>How your data flows</h2>
    <p>When your AI assistant makes a request:</p>
    <ul>
      <li>Your MCP client sends the request to our server with your API key</li>
      <li>We use your stored OAuth token to call Google's API</li>
      <li>Google's response passes through our server to your client</li>
      <li>We do not log, store, or inspect the content of these requests</li>
    </ul>

    <h2>Data retention</h2>
    <ul>
      <li><strong>API keys and tokens</strong> - Stored until you revoke them or they expire</li>
      <li><strong>OAuth states</strong> - Temporary data deleted after 10 minutes</li>
    </ul>

    <h2 id="delete">How to delete your data</h2>
    <p>You can delete all your stored data at any time:</p>
    <ul>
      <li>Delete your API key: <code>curl -X DELETE https://g.mcp.openbsp.dev/key/YOUR_API_KEY</code></li>
      <li>Revoke from Google: <a href="https://myaccount.google.com/permissions">Google Account Permissions</a></li>
    </ul>

    <h2>Third parties</h2>
    <p>We use:</p>
    <ul>
      <li><strong>Cloudflare</strong> - Hosting and infrastructure</li>
      <li><strong>Google APIs</strong> - Calendar and Sheets access</li>
    </ul>
    <p>We do not sell or share your data with any other third parties.</p>

    <h2>Contact</h2>
    <p>For questions about this policy, open an issue on <a href="https://github.com/matiasbattocchia/google-mcp">GitHub</a>.</p>

    <a href="/" class="back">&larr; Back to home</a>
  </div>
</body>
</html>`;
}

export function renderTermsOfService(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - OpenBSP MCP</title>
  <style>${legalStyles}</style>
</head>
<body>
  <div class="container">
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: January 2026</p>

    <h2>Service description</h2>
    <p>OpenBSP MCP is a free, open-source service that connects MCP-compatible AI clients to Google Calendar and Google Sheets APIs.</p>

    <h2>Acceptance</h2>
    <p>By using this service, you agree to these terms. If you don't agree, please don't use the service.</p>

    <h2>Your responsibilities</h2>
    <ul>
      <li>Keep your API key secure and don't share it publicly</li>
      <li>Use the service in compliance with Google's Terms of Service</li>
      <li>Don't use the service for any illegal or harmful purposes</li>
      <li>Don't attempt to abuse, overload, or exploit the service</li>
    </ul>

    <h2>Service availability</h2>
    <p>This service is provided "as is" without guarantees. We may:</p>
    <ul>
      <li>Modify or discontinue the service at any time</li>
      <li>Implement rate limits or usage restrictions</li>
      <li>Revoke API keys that violate these terms</li>
    </ul>

    <h2>Limitations</h2>
    <ul>
      <li>We are not responsible for any data loss or damages</li>
      <li>We don't guarantee uptime or availability</li>
      <li>We are not affiliated with Google or Anthropic</li>
    </ul>

    <h2>Open source</h2>
    <p>This project is open source under The Unlicense (public domain). You can review the code, self-host your own instance, or contribute improvements on <a href="https://github.com/matiasbattocchia/google-mcp">GitHub</a>.</p>

    <h2>Changes</h2>
    <p>We may update these terms. Continued use of the service constitutes acceptance of any changes.</p>

    <a href="/" class="back">&larr; Back to home</a>
  </div>
</body>
</html>`;
}

export function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - OpenBSP MCP</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container text-center">
    <div class="error-icon">
      <svg class="icon-svg" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </div>

    <h1>Something went wrong</h1>

    <div class="error-message">${message}</div>

    <a href="/" class="btn" style="display: block; text-decoration: none; margin-top: 24px;">
      Try Again
    </a>
  </div>
</body>
</html>`;
}
