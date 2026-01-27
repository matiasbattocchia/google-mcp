// Google OAuth 2.0 scopes for supported products
export const GOOGLE_SCOPES = {
  calendar: {
    label: 'Google Calendar',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
    ],
  },
  sheets: {
    label: 'Google Sheets',
    scopes: [
      'https://www.googleapis.com/auth/drive.file', // Only files opened/created by the app
    ],
  },
} as const;

export type GoogleProduct = keyof typeof GOOGLE_SCOPES;

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export function getAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  scopes: string[]
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
    method: 'POST',
  });
}

export function expandScopes(products: GoogleProduct[]): string[] {
  const scopes = new Set<string>();
  for (const product of products) {
    for (const scope of GOOGLE_SCOPES[product].scopes) {
      scopes.add(scope);
    }
  }
  return Array.from(scopes);
}

export function getScopesFromProducts(products: GoogleProduct[]): string[] {
  return expandScopes(products);
}
