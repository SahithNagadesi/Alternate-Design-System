import axios from 'axios';

const PEGA_SERVER = import.meta.env.VITE_PEGA_SERVER_URL || 'https://areteans-i25-plf.pegatsdemo.com/';
const TOKEN_URL = `${PEGA_SERVER}/prweb/PRRestService/oauth2/v1/token`;

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return { Authorization: `Bearer ${cachedToken}` };
  }

  const clientId = import.meta.env.VITE_PEGA_CLIENT_ID || '';
  const clientSecret = import.meta.env.VITE_PEGA_CLIENT_SECRET || '';

  const res = await axios.post(
    TOKEN_URL,
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      auth: { username: clientId, password: clientSecret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return { Authorization: `Bearer ${cachedToken}` };
}
