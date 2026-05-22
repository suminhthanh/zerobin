import { describe, expect, it } from "vitest";
import { base58encode, base58decode } from "../src/base58.js";

describe("base58", () => {
  it("roundtrips arbitrary bytes", () => {
    const cases = [
      new Uint8Array([1, 2, 3]),
      new Uint8Array([255, 254, 253, 252]),
      crypto.getRandomValues(new Uint8Array(32)),
      crypto.getRandomValues(new Uint8Array(64)),
    ];
    for (const input of cases) {
      const encoded = base58encode(input);
      const decoded = base58decode(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(input));
    }
  });

  it("returns empty string for empty input", () => {
    expect(base58encode(new Uint8Array(0))).toBe("");
    expect(base58decode("").length).toBe(0);
  });

  it("preserves leading zero bytes for non-zero payload", () => {
    const input = new Uint8Array([0, 0, 1, 2, 3]);
    const encoded = base58encode(input);
    expect(encoded.startsWith("11")).toBe(true);
    const decoded = base58decode(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(input));
  });

  it("rejects invalid characters", () => {
    expect(() => base58decode("0OIl")).toThrow();
  });
});
