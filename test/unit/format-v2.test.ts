import { describe, it, expect } from "vitest";
import { isValidPaste, isValidComment } from "../../src/utils/format-v2";

const validPaste = {
  v: 2,
  adata: [
    ["YWJjZGVmZ2hpamtsbW4=", "YWJjZGVmZw==", 100000, 256, 128, "aes", "gcm", "zlib"],
    "plaintext",
    0,
    0,
  ],
  ct: "dGVzdGNpcGhlcnRleHQ=",
  meta: { expire: "1week" },
};

const validComment = {
  v: 2,
  adata: ["YWJjZGVmZ2hpamtsbW4=", "YWJjZGVmZw==", 100000, 256, 128, "aes", "gcm", "zlib"],
  ct: "dGVzdGNpcGhlcnRleHQ=",
  pasteid: "a1b2c3d4e5f6a7b8",
  parentid: "a1b2c3d4e5f6a7b8",
};

describe("isValidPaste", () => {
  it("accepts valid paste", () => {
    expect(isValidPaste(validPaste)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidPaste(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidPaste("string")).toBe(false);
  });

  it("rejects extra keys", () => {
    expect(isValidPaste({ ...validPaste, extra: "key" })).toBe(false);
  });

  it("rejects missing keys", () => {
    const { meta, ...rest } = validPaste;
    expect(isValidPaste(rest)).toBe(false);
  });

  it("rejects v < 2", () => {
    expect(isValidPaste({ ...validPaste, v: 1 })).toBe(false);
  });

  it("rejects empty ct", () => {
    expect(isValidPaste({ ...validPaste, ct: "" })).toBe(false);
  });

  it("rejects adata with wrong length", () => {
    expect(isValidPaste({ ...validPaste, adata: [validPaste.adata[0], "plaintext", 0] })).toBe(false);
  });

  it("rejects invalid cipher spec - bad algorithm", () => {
    const badAdata = [
      ["YWJjZGVmZ2hpamtsbW4=", "YWJjZGVmZw==", 100000, 256, 128, "des", "gcm", "zlib"],
      "plaintext",
      0,
      0,
    ];
    expect(isValidPaste({ ...validPaste, adata: badAdata })).toBe(false);
  });

  it("rejects invalid cipher spec - bad mode", () => {
    const badAdata = [
      ["YWJjZGVmZ2hpamtsbW4=", "YWJjZGVmZw==", 100000, 256, 128, "aes", "ecb", "zlib"],
      "plaintext",
      0,
      0,
    ];
    expect(isValidPaste({ ...validPaste, adata: badAdata })).toBe(false);
  });

  it("rejects iterations below minimum", () => {
    const badAdata = [
      ["YWJjZGVmZ2hpamtsbW4=", "YWJjZGVmZw==", 5000, 256, 128, "aes", "gcm", "zlib"],
      "plaintext",
      0,
      0,
    ];
    expect(isValidPaste({ ...validPaste, adata: badAdata })).toBe(false);
  });

  it("rejects IV too long", () => {
    const badAdata = [
      ["A".repeat(25), "YWJjZGVmZw==", 100000, 256, 128, "aes", "gcm", "zlib"],
      "plaintext",
      0,
      0,
    ];
    expect(isValidPaste({ ...validPaste, adata: badAdata })).toBe(false);
  });

  it("rejects salt too long", () => {
    const badAdata = [
      ["YWJjZGVmZ2hpamtsbW4=", "A".repeat(15), 100000, 256, 128, "aes", "gcm", "zlib"],
      "plaintext",
      0,
      0,
    ];
    expect(isValidPaste({ ...validPaste, adata: badAdata })).toBe(false);
  });

  it("rejects meta with extra keys", () => {
    expect(isValidPaste({ ...validPaste, meta: { expire: "1week", extra: "bad" } })).toBe(false);
  });

  it("rejects burn value other than 0 or 1", () => {
    const badAdata = [validPaste.adata[0], "plaintext", 0, 2];
    expect(isValidPaste({ ...validPaste, adata: badAdata })).toBe(false);
  });
});

describe("isValidComment", () => {
  it("accepts valid comment", () => {
    expect(isValidComment(validComment)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidComment(null)).toBe(false);
  });

  it("rejects extra keys", () => {
    expect(isValidComment({ ...validComment, extra: "key" })).toBe(false);
  });

  it("rejects invalid pasteid format", () => {
    expect(isValidComment({ ...validComment, pasteid: "short" })).toBe(false);
  });

  it("rejects invalid parentid format", () => {
    expect(isValidComment({ ...validComment, parentid: "ZZZZZZZZZZZZZZZZ" })).toBe(false);
  });

  it("rejects nested adata (paste format)", () => {
    expect(
      isValidComment({
        ...validComment,
        adata: [validComment.adata, "plaintext", 0, 0],
      })
    ).toBe(false);
  });
});
