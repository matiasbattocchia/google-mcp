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

    <a href="https://github.com/matiasbattocchia/google-mcp" target="_blank" class="footer-link">
      ❤️ View source on GitHub
      <svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
    </a>
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
