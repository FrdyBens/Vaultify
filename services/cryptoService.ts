
import { PBKDF2_ITERATIONS, ENCRYPTION_ALGORITHM, KEY_DERIVATION_ALGORITHM, HASH_ALGORITHM, KEY_LENGTH_BITS, SALT_LENGTH_BYTES, IV_LENGTH_BYTES } from '../constants';

// Helper: ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
}

export function generateIv(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
}

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: KEY_DERIVATION_ALGORITHM },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGORITHM,
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH_BITS },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(key: CryptoKey, data: string): Promise<{ iv: Uint8Array, ciphertext: ArrayBuffer }> {
  const iv = generateIv();
  const enc = new TextEncoder();
  const encodedData = enc.encode(data);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    key,
    encodedData
  );
  return { iv, ciphertext };
}

export async function decryptData(key: CryptoKey, iv: Uint8Array, ciphertext: ArrayBuffer): Promise<string> {
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    key,
    ciphertext
  );
  const dec = new TextDecoder();
  return dec.decode(decryptedData);
}
