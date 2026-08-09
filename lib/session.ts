export interface SessionData {
  uid: string;
  email: string | null;
  role: string;
  memberType: string;
  exp: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'playpay-production-secret-key-2026';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export async function createSessionToken(data: Omit<SessionData, 'exp'>): Promise<string> {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload: SessionData = { ...data, exp };
  const jsonStr = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const base64Payload = base64UrlEncode(encoder.encode(jsonStr));

  const keyData = encoder.encode(SESSION_SECRET);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(base64Payload));
  const base64Sig = base64UrlEncode(new Uint8Array(signature));

  return `${base64Payload}.${base64Sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionData | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [base64Payload, base64Sig] = parts;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlDecode(base64Sig);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      encoder.encode(base64Payload)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(base64Payload);
    const jsonStr = new TextDecoder().decode(payloadBytes);
    const data = JSON.parse(jsonStr) as SessionData;

    if (Date.now() > data.exp) return null;

    return data;
  } catch {
    return null;
  }
}
