import { describe, expect, it } from "vitest";
import { parsePasteUrl } from "../src/commands/read.js";

describe("parsePasteUrl", () => {
  it("parses ?<id> format", () => {
    const result = parsePasteUrl(
      "https://zerobin.cc/?abcdef0123456789#3F4xK"
    );
    expect(result.server).toBe("https://zerobin.cc");
    expect(result.pasteId).toBe("abcdef0123456789");
    expect(result.key).toBe("3F4xK");
  });

  it("parses ?pasteid=<id> format", () => {
    const result = parsePasteUrl(
      "https://zerobin.cc/?pasteid=abcdef0123456789#3F4xK"
    );
    expect(result.pasteId).toBe("abcdef0123456789");
  });

  it("rejects URL without fragment", () => {
    expect(() =>
      parsePasteUrl("https://zerobin.cc/?abcdef0123456789")
    ).toThrow(/missing decryption key/);
  });

  it("rejects URL without paste id", () => {
    expect(() =>
      parsePasteUrl("https://zerobin.cc/?notvalid#key")
    ).toThrow(/paste ID/);
  });

  it("preserves custom server hosts and ports", () => {
    const result = parsePasteUrl(
      "http://localhost:8787/?abcdef0123456789#k"
    );
    expect(result.server).toBe("http://localhost:8787");
    expect(result.pasteId).toBe("abcdef0123456789");
  });
});
