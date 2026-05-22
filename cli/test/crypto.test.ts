import { describe, expect, it } from "vitest";
import {
  encryptPaste,
  decryptPaste,
  generateKey,
  encodeKey,
  decodeKey,
} from "../src/crypto.js";

describe("crypto", () => {
  it("roundtrips a simple paste", async () => {
    const key = generateKey();
    const payload = JSON.stringify({ paste: "hello world" });
    const { ct, adata } = await encryptPaste(payload, key, "");
    const decrypted = await decryptPaste(ct, adata, key, "");
    expect(JSON.parse(decrypted).paste).toBe("hello world");
  });

  it("roundtrips with password", async () => {
    const key = generateKey();
    const { ct, adata } = await encryptPaste("with password", key, "secret");
    const plaintext = await decryptPaste(ct, adata, key, "secret");
    expect(plaintext).toBe("with password");
  });

  it("fails decryption with wrong password", async () => {
    const key = generateKey();
    const { ct, adata } = await encryptPaste("locked", key, "right");
    await expect(decryptPaste(ct, adata, key, "wrong")).rejects.toThrow();
  });

  it("fails decryption with wrong key", async () => {
    const key1 = generateKey();
    const key2 = generateKey();
    const { ct, adata } = await encryptPaste("data", key1, "");
    await expect(decryptPaste(ct, adata, key2, "")).rejects.toThrow();
  });

  it("preserves formatter, discussion, burn flags in adata", async () => {
    const key = generateKey();
    const { adata } = await encryptPaste("x", key, "", {
      formatter: "markdown",
      openDiscussion: true,
      burnAfterReading: true,
    });
    expect(adata[1]).toBe("markdown");
    expect(adata[2]).toBe(1);
    expect(adata[3]).toBe(1);
  });

  it("encodes and decodes 32-byte keys via base58", () => {
    const key = generateKey();
    const encoded = encodeKey(key);
    const decoded = decodeKey(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(key));
  });

  it("roundtrips large payloads", async () => {
    const key = generateKey();
    const large = "x".repeat(50_000);
    const { ct, adata } = await encryptPaste(large, key, "");
    const plaintext = await decryptPaste(ct, adata, key, "");
    expect(plaintext).toBe(large);
    expect(plaintext.length).toBe(50_000);
  });

  it("supports compression mode 'none'", async () => {
    const key = generateKey();
    const { ct, adata } = await encryptPaste("uncompressed", key, "", {
      compression: "none",
    });
    const plaintext = await decryptPaste(ct, adata, key, "");
    expect(plaintext).toBe("uncompressed");
  });
});
