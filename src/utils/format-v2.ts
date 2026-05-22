import { PasteData } from "../types";

const VALID_ALGORITHMS = ["aes"];
const VALID_MODES = ["ctr", "cbc", "gcm"];
const VALID_COMPRESSIONS = ["zlib", "none"];
const VALID_KEY_SIZES = [128, 192, 256];
const VALID_TAG_SIZES = [64, 96, 128];
const MIN_ITERATIONS = 10000;
const MAX_IV_LENGTH = 24;
const MAX_SALT_LENGTH = 14;

function isValidCipherSpec(spec: unknown): boolean {
  if (!Array.isArray(spec) || spec.length !== 8) return false;

  const [iv, salt, iterations, keySize, tagSize, algo, mode, compression] = spec;

  if (typeof iv !== "string" || iv.length > MAX_IV_LENGTH) return false;
  if (typeof salt !== "string" || salt.length > MAX_SALT_LENGTH) return false;
  if (typeof iterations !== "number" || iterations < MIN_ITERATIONS) return false;
  if (!VALID_KEY_SIZES.includes(keySize)) return false;
  if (!VALID_TAG_SIZES.includes(tagSize)) return false;
  if (!VALID_ALGORITHMS.includes(algo)) return false;
  if (!VALID_MODES.includes(mode)) return false;
  if (!VALID_COMPRESSIONS.includes(compression)) return false;

  return true;
}

export function isValidPaste(data: unknown): data is PasteData {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj).sort();

  if (keys.length !== 4) return false;
  if (keys.join(",") !== "adata,ct,meta,v") return false;

  if (typeof obj.v !== "number" || obj.v < 2) return false;
  if (typeof obj.ct !== "string" || obj.ct.length === 0) return false;

  // adata must be array of 4 elements
  if (!Array.isArray(obj.adata) || obj.adata.length !== 4) return false;

  // adata[0] is cipher spec (8-element array)
  if (!isValidCipherSpec(obj.adata[0])) return false;

  // adata[1] is formatter string
  if (typeof obj.adata[1] !== "string") return false;

  // adata[2] is open discussion (0 or 1)
  if (obj.adata[2] !== 0 && obj.adata[2] !== 1) return false;

  // adata[3] is burn after reading (0 or 1)
  if (obj.adata[3] !== 0 && obj.adata[3] !== 1) return false;

  // meta must have exactly one key: expire
  if (!obj.meta || typeof obj.meta !== "object") return false;
  const metaKeys = Object.keys(obj.meta as object);
  if (metaKeys.length !== 1 || metaKeys[0] !== "expire") return false;

  return true;
}

export function isValidComment(data: unknown): data is PasteData {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj).sort();

  if (keys.length !== 5) return false;
  if (keys.join(",") !== "adata,ct,parentid,pasteid,v") return false;

  if (typeof obj.v !== "number" || obj.v < 2) return false;
  if (typeof obj.ct !== "string" || obj.ct.length === 0) return false;
  if (typeof obj.pasteid !== "string" || !/^[a-f0-9]{16}$/.test(obj.pasteid)) return false;
  if (typeof obj.parentid !== "string" || !/^[a-f0-9]{16}$/.test(obj.parentid)) return false;

  // adata for comments is a flat 8-element cipher spec
  if (!isValidCipherSpec(obj.adata)) return false;

  return true;
}
