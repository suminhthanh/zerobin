import { describe, it, expect } from "vitest";
import { fnv1a64 } from "../../src/utils/fnv1a64";

describe("fnv1a64", () => {
  it("produces 16-char hex output", () => {
    const result = fnv1a64("hello");
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[0-9a-f]{16}$/);
  });

  it("empty string produces correct hash", () => {
    // PHP: hash('fnv1a64', '') = 'cbf29ce484222325'
    const result = fnv1a64("");
    expect(result).toBe("cbf29ce484222325");
  });

  it("hello produces correct hash", () => {
    // PHP: hash('fnv1a64', 'hello') = 'a430d84680aabd0b'
    const result = fnv1a64("hello");
    expect(result).toBe("a430d84680aabd0b");
  });

  it("test produces correct hash", () => {
    // PHP: hash('fnv1a64', 'test') = 'f9e6e6ef197c2b25'
    const result = fnv1a64("test");
    expect(result).toBe("f9e6e6ef197c2b25");
  });

  it("different inputs produce different hashes", () => {
    const a = fnv1a64("paste1");
    const b = fnv1a64("paste2");
    expect(a).not.toBe(b);
  });

  it("handles long base64 strings", () => {
    const longStr = "A".repeat(10000);
    const result = fnv1a64(longStr);
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic", () => {
    const input = "some ciphertext data here base64==";
    expect(fnv1a64(input)).toBe(fnv1a64(input));
  });
});
