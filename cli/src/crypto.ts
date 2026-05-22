import { base58encode, base58decode } from "./base58.js";
import { compress, decompress } from "./compression.js";

export type CipherSpec = [string, string, number, number, number, string, string, string];
export type PasteAdata = [CipherSpec, string, number, number];
export type CommentAdata = CipherSpec;

export function generateKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function encodeKey(key: Uint8Array): string {
  return base58encode(key);
}

export function decodeKey(encoded: string): Uint8Array {
  const decoded = base58decode(encoded);
  if (decoded.length >= 32) return decoded.slice(0, 32);
  const padded = new Uint8Array(32);
  padded.set(decoded, 32 - decoded.length);
  return padded;
}

function uint8ToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function base64ToUint8(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function deriveKey(
  key: Uint8Array,
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  let keyMaterial: Uint8Array;
  if (password.length > 0) {
    const passwordBytes = new TextEncoder().encode(password);
    keyMaterial = new Uint8Array(key.length + passwordBytes.length);
    keyMaterial.set(key);
    keyMaterial.set(passwordBytes, key.length);
  } else {
    keyMaterial = key;
  }

  const importedKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial as unknown as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    importedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface EncryptResult {
  ct: string;
  adata: PasteAdata;
}

export interface EncryptOptions {
  formatter?: string;
  openDiscussion?: boolean;
  burnAfterReading?: boolean;
  compression?: string;
}

export async function encryptPaste(
  plaintext: string,
  key: Uint8Array,
  password: string,
  options: EncryptOptions = {}
): Promise<EncryptResult> {
  const {
    formatter = "plaintext",
    openDiscussion = false,
    burnAfterReading = false,
    compression = "zlib",
  } = options;

  const iv = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(8));

  const spec: CipherSpec = [
    uint8ToBase64(iv),
    uint8ToBase64(salt),
    100000,
    256,
    128,
    "aes",
    "gcm",
    compression,
  ];

  const adata: PasteAdata = [spec, formatter, openDiscussion ? 1 : 0, burnAfterReading ? 1 : 0];
  const adataString = JSON.stringify(adata);

  const textBytes = new TextEncoder().encode(plaintext);
  const compressed = compression === "zlib" ? compress(textBytes) : textBytes;

  const derivedKey = await deriveKey(key, password, salt, 100000);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
      additionalData: new TextEncoder().encode(adataString) as unknown as BufferSource,
      tagLength: 128,
    },
    derivedKey,
    compressed as unknown as BufferSource
  );

  return {
    ct: uint8ToBase64(new Uint8Array(encrypted)),
    adata,
  };
}

export async function decryptPaste(
  ct: string,
  adata: PasteAdata | CommentAdata,
  key: Uint8Array,
  password: string
): Promise<string> {
  const adataString = JSON.stringify(adata);

  const spec: CipherSpec = Array.isArray(adata[0]) ? (adata[0] as CipherSpec) : (adata as CipherSpec);

  const iv = base64ToUint8(spec[0]);
  const salt = base64ToUint8(spec[1]);
  const iterations = spec[2];
  const compressionMode = spec[7];

  const derivedKey = await deriveKey(key, password, salt, iterations);
  const cipherBytes = base64ToUint8(ct);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
      additionalData: new TextEncoder().encode(adataString) as unknown as BufferSource,
      tagLength: 128,
    },
    derivedKey,
    cipherBytes as unknown as BufferSource
  );

  const decompressed =
    compressionMode === "zlib"
      ? decompress(new Uint8Array(decrypted))
      : new Uint8Array(decrypted);

  return new TextDecoder().decode(decompressed);
}
