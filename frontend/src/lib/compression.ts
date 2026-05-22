import { deflate, inflate } from "fflate";

export async function compress(data: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    deflate(data, { level: 6 }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export async function decompress(data: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    inflate(data, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
