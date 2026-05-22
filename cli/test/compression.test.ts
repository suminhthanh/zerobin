import { describe, expect, it } from "vitest";
import { compress, decompress } from "../src/compression.js";

describe("compression", () => {
  it("roundtrips text", () => {
    const original = new TextEncoder().encode("hello world".repeat(100));
    const compressed = compress(original);
    expect(compressed.length).toBeLessThan(original.length);
    const restored = decompress(compressed);
    expect(new TextDecoder().decode(restored)).toBe("hello world".repeat(100));
  });

  it("roundtrips binary data", () => {
    const original = crypto.getRandomValues(new Uint8Array(1024));
    const restored = decompress(compress(original));
    expect(Array.from(restored)).toEqual(Array.from(original));
  });

  it("handles empty input", () => {
    const restored = decompress(compress(new Uint8Array(0)));
    expect(restored.length).toBe(0);
  });
});
