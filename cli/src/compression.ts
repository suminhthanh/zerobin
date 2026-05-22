import { deflateRawSync, inflateRawSync } from "node:zlib";

export function compress(data: Uint8Array): Uint8Array {
  return new Uint8Array(deflateRawSync(data, { level: 6 }));
}

export function decompress(data: Uint8Array): Uint8Array {
  return new Uint8Array(inflateRawSync(data));
}
