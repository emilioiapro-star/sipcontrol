const encoder = new TextEncoder();

const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

export const createSalt = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(bytes.buffer);
};

export const derivePinHash = async (pin: string, saltB64: string): Promise<string> => {
  const salt = fromBase64(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 120000,
      salt: salt as BufferSource,
    },
    keyMaterial,
    256
  );

  return toBase64(bits);
};

export const verifyPin = async (
  pin: string,
  pinHash: string | null,
  pinSalt: string | null
): Promise<boolean> => {
  if (!pinHash || !pinSalt) return false;
  const candidate = await derivePinHash(pin, pinSalt);
  return candidate === pinHash;
};
