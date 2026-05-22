import { describe, it, expect } from "vitest";
import { generateSalt, hmacSha256, hmacSha512, timingSafeEqual } from "../../src/utils/crypto";
import {
  decryptPaste as decryptClientPayload,
  encryptComment,
  generateKey as generateClientKey,
} from "../../frontend/src/lib/crypto";

describe("generateSalt", () => {
  it("produces 512-char hex string", async () => {
    const salt = await generateSalt();
    expect(salt).toHaveLength(512);
    expect(salt).toMatch(/^[0-9a-f]{512}$/);
  });

  it("produces different values each call", async () => {
    const a = await generateSalt();
    const b = await generateSalt();
    expect(a).not.toBe(b);
  });
});

describe("hmacSha256", () => {
  it("produces 64-char hex string", async () => {
    const result = await hmacSha256("data", "key");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    const a = await hmacSha256("paste123", "salt456");
    const b = await hmacSha256("paste123", "salt456");
    expect(a).toBe(b);
  });

  it("different data produces different output", async () => {
    const a = await hmacSha256("data1", "key");
    const b = await hmacSha256("data2", "key");
    expect(a).not.toBe(b);
  });

  it("different keys produce different output", async () => {
    const a = await hmacSha256("data", "key1");
    const b = await hmacSha256("data", "key2");
    expect(a).not.toBe(b);
  });
});

describe("hmacSha512", () => {
  it("produces 128-char hex string", async () => {
    const result = await hmacSha512("data", "key");
    expect(result).toHaveLength(128);
    expect(result).toMatch(/^[0-9a-f]{128}$/);
  });
});

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeEqual("short", "longer")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("client comment encryption", () => {
  it("encrypts comments with the paste key and password", async () => {
    const key = generateClientKey();
    const password = "discussion-password";
    const payload = JSON.stringify({ comment: "private reply", nickname: "Tester" });

    const encrypted = await encryptComment(payload, key, password, "none");

    expect(encrypted.ct).not.toContain("private reply");
    await expect(decryptClientPayload(encrypted.ct, encrypted.adata, key, "wrong-password")).rejects.toThrow();
    await expect(decryptClientPayload(encrypted.ct, encrypted.adata, generateClientKey(), password)).rejects.toThrow();
    await expect(decryptClientPayload(encrypted.ct, encrypted.adata, key, password)).resolves.toBe(payload);
  });
});
