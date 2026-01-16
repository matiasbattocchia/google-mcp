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

export function renderHomePage(scopes: typeof GOOGLE_SCOPES): string {
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
  <title>Google MCP Server</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <h1>Google MCP Server</h1>
    <p class="subtitle">Connect your Google products to MCP clients</p>

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
      <a href="https://github.com/matiasbattocchia/google-mcp" target="_blank">View source code</a>
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
  <title>Success - Google MCP Server</title>
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
  <title>Privacy Policy - Google MCP Server</title>
  <style>${legalStyles}</style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: January 2026</p>

    <h2>What we collect</h2>
    <p>When you use Google MCP Server, we store:</p>
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

    <h2>How to delete your data</h2>
    <p>You can delete all your stored data at any time:</p>
    <ul>
      <li>Delete your API key: <code>curl -X DELETE https://google-mcp.openbsp.dev/key/YOUR_API_KEY</code></li>
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
  <title>Terms of Service - Google MCP Server</title>
  <style>${legalStyles}</style>
</head>
<body>
  <div class="container">
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: January 2026</p>

    <h2>Service description</h2>
    <p>Google MCP Server is a free, open-source service that connects MCP-compatible AI clients to Google Calendar and Google Sheets APIs.</p>

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
  <title>Error - Google MCP Server</title>
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
