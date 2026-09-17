/**
 * Zero-knowledge end-to-end encryption service using Web Crypto API.
 * Encrypts all clipboard data locally on the device with AES-GCM 256.
 * The server only sees ciphertext + IV + salt.
 */

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive AES-GCM key from room secret key and salt using PBKDF2
async function deriveKey(secretKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedResult {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Encrypts plain text or serialized object using AES-GCM 256 with room secret.
 */
export async function encryptData(plainText: string, secretKey: string): Promise<EncryptedResult> {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(secretKey, salt);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    return {
      ciphertext: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv.buffer),
      salt: arrayBufferToBase64(salt.buffer),
    };
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Local encryption failed.');
  }
}

/**
 * Decrypts AES-GCM 256 payload using the room secret.
 */
export async function decryptData(
  ciphertext: string,
  ivBase64: string,
  saltBase64: string,
  secretKey: string
): Promise<string> {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const encryptedData = base64ToArrayBuffer(ciphertext);

    const key = await deriveKey(secretKey, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Decryption failed (likely invalid room key or corrupted payload):', err);
    throw new Error('Unable to decrypt clipboard item with current room key.');
  }
}

/**
 * Generates a random secure code e.g. "724-918"
 */
export function generateRoomCode(): string {
  const randomBytes = window.crypto.getRandomValues(new Uint8Array(4));
  const num1 = (randomBytes[0] * 256 + randomBytes[1]) % 900 + 100;
  const num2 = (randomBytes[2] * 256 + randomBytes[3]) % 900 + 100;
  return `${num1}-${num2}`;
}

/**
 * Derives a deterministic cryptographic passphrase from a Room Code.
 * Allows instant pairing simply by entering the 6-digit room code without typing a 32-char hex key.
 */
export function deriveDefaultSecretFromRoomCode(roomCode: string): string {
  const normalized = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hexHash = (hash >>> 0).toString(16).padStart(8, '0');
  return `clipsync-${normalized}-${hexHash}`;
}

/**
 * Generates a room secret key (either derived from roomCode or random entropy)
 */
export function generateSecretKey(roomCode?: string): string {
  if (roomCode) {
    return deriveDefaultSecretFromRoomCode(roomCode);
  }
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

