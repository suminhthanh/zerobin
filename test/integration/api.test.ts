import { describe, it, expect, beforeAll } from "vitest";
import { env, SELF } from "cloudflare:test";

describe("API Integration", () => {
  const jsonHeaders = {
    "X-Requested-With": "JSONHttpRequest",
    "Content-Type": "application/json",
  };

  beforeAll(async () => {
    // Apply migration - D1 exec requires statements separated properly
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS pastes (id TEXT PRIMARY KEY, v INTEGER NOT NULL DEFAULT 2, adata TEXT NOT NULL, ct TEXT, r2_key TEXT, meta_salt TEXT NOT NULL, expire_date INTEGER, burn_after_reading INTEGER NOT NULL DEFAULT 0, open_discussion INTEGER NOT NULL DEFAULT 0, formatter TEXT NOT NULL DEFAULT 'plaintext', created_at INTEGER NOT NULL);"
    );
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS comments (id TEXT NOT NULL, paste_id TEXT NOT NULL, parent_id TEXT NOT NULL, v INTEGER NOT NULL DEFAULT 2, adata TEXT NOT NULL, ct TEXT NOT NULL, nickname TEXT, vizhash TEXT, created_at INTEGER NOT NULL, PRIMARY KEY (paste_id, id));"
    );
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS kv_store (namespace TEXT NOT NULL, key TEXT NOT NULL DEFAULT '', value TEXT NOT NULL, PRIMARY KEY (namespace, key));"
    );
  });

  const validPasteBody = {
    v: 2,
    adata: [
      ["YWJjZGVmZ2hpamts", "YWJjZGVmZw==", 100000, 256, 128, "aes", "gcm", "zlib"],
      "plaintext",
      0,
      0,
    ],
    ct: "dGVzdGNpcGhlcnRleHRkYXRh",
    meta: { expire: "1week" },
  };

  describe("Create paste", () => {
    it("creates a paste and returns id + deletetoken", async () => {
      const resp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(validPasteBody),
      });

      expect(resp.status).toBe(200);
      const data = (await resp.json()) as Record<string, unknown>;
      expect(data.status).toBe(0);
      expect(data.id).toMatch(/^[0-9a-f]{16}$/);
      expect(data.url).toBe(`/?${data.id}`);
      expect(data.deletetoken).toMatch(/^[0-9a-f]{64}$/);
    });

    it("rejects invalid data", async () => {
      const resp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ invalid: true }),
      });

      const data = (await resp.json()) as Record<string, unknown>;
      expect(data.status).toBe(1);
      expect(data.message).toBe("Invalid data.");
    });

    it("rejects oversized paste", async () => {
      const bigPaste = {
        ...validPasteBody,
        ct: "A".repeat(10_000_001),
      };
      const resp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(bigPaste),
      });

      const data = (await resp.json()) as Record<string, unknown>;
      expect(data.status).toBe(1);
      expect(data.message).toContain("limited to");
    });
  });

  describe("Read paste", () => {
    it("reads a created paste", async () => {
      // Create first
      const createResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          ...validPasteBody,
          ct: "cmVhZHRlc3RjaXBoZXJ0ZXh0",
        }),
      });
      const created = (await createResp.json()) as Record<string, unknown>;
      expect(created.status).toBe(0);
      expect(created.id).toMatch(/^[0-9a-f]{16}$/);
      const pasteId = created.id as string;

      // Read
      const readResp = await SELF.fetch(`http://localhost/?${pasteId}`, {
        headers: jsonHeaders,
      });

      expect(readResp.status).toBe(200);
      const data = (await readResp.json()) as Record<string, unknown>;
      expect(data.status).toBe(0);
      expect(data.id).toBe(pasteId);
      expect(data.ct).toBe("cmVhZHRlc3RjaXBoZXJ0ZXh0");
      expect(data.v).toBe(2);
      expect(data["@context"]).toBe("?jsonld=paste");
    });

    it("returns error for non-existent paste", async () => {
      const resp = await SELF.fetch("http://localhost/?0000000000000000", {
        headers: jsonHeaders,
      });

      const data = (await resp.json()) as Record<string, unknown>;
      expect(data.status).toBe(1);
      expect(data.message).toContain("does not exist");
    });
  });

  describe("Delete paste", () => {
    it("deletes with correct token", async () => {
      // Create
      const createResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          ...validPasteBody,
          ct: "ZGVsZXRldGVzdGNpcGhlcg==",
        }),
      });
      const created = (await createResp.json()) as Record<string, unknown>;
      expect(created.status).toBe(0);
      expect(created.id).toMatch(/^[0-9a-f]{16}$/);
      const pasteId = created.id as string;
      const deleteToken = created.deletetoken as string;

      // Delete
      const delResp = await SELF.fetch(
        `http://localhost/?pasteid=${pasteId}&deletetoken=${deleteToken}`,
        { headers: jsonHeaders }
      );

      const data = (await delResp.json()) as Record<string, unknown>;
      expect(data.status).toBe(0);
      expect(data.id).toBe(pasteId);

      // Verify deleted
      const readResp = await SELF.fetch(`http://localhost/?${pasteId}`, {
        headers: jsonHeaders,
      });
      const readData = (await readResp.json()) as Record<string, unknown>;
      expect(readData.status).toBe(1);
    });

    it("rejects wrong token", async () => {
      // Create
      const createResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          ...validPasteBody,
          ct: "d3Jvbmd0b2tlbnRlc3Q=",
        }),
      });
      const created = (await createResp.json()) as Record<string, unknown>;
      const pasteId = created.id as string;

      // Delete with wrong token
      const delResp = await SELF.fetch(
        `http://localhost/?pasteid=${pasteId}&deletetoken=${"0".repeat(64)}`,
        { headers: jsonHeaders }
      );

      const data = (await delResp.json()) as Record<string, unknown>;
      expect(data.status).toBe(1);
      expect(data.message).toContain("Wrong deletion token");
    });
  });

  describe("Burn after reading", () => {
    it("deletes paste on first read", async () => {
      const burnPaste = {
        v: 2,
        adata: [
          ["YWJjZGVmZ2hpamts", "YWJjZGVmZw==", 100000, 256, 128, "aes", "gcm", "zlib"],
          "plaintext",
          0,
          1, // burn after reading
        ],
        ct: "YnVybnRlc3RjaXBoZXI=",
        meta: { expire: "1week" },
      };

      // Create
      const createResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(burnPaste),
      });
      const created = (await createResp.json()) as Record<string, unknown>;
      const pasteId = created.id as string;

      // First read — should succeed
      const read1 = await SELF.fetch(`http://localhost/?${pasteId}`, {
        headers: jsonHeaders,
      });
      const data1 = (await read1.json()) as Record<string, unknown>;
      expect(data1.status).toBe(0);
      expect(data1.ct).toBe("YnVybnRlc3RjaXBoZXI=");

      // Second read — should fail
      const read2 = await SELF.fetch(`http://localhost/?${pasteId}`, {
        headers: jsonHeaders,
      });
      const data2 = (await read2.json()) as Record<string, unknown>;
      expect(data2.status).toBe(1);
      expect(data2.message).toContain("does not exist");
    });
  });

  describe("Discussion", () => {
    it("creates and reads comments for discussion-enabled pastes", async () => {
      const createResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: { ...jsonHeaders, "CF-Connecting-IP": "203.0.113.10" },
        body: JSON.stringify({
          ...validPasteBody,
          adata: [validPasteBody.adata[0], "plaintext", 1, 0],
          ct: "ZGlzY3Vzc2lvbmVuYWJsZWRwYXN0ZQ==",
        }),
      });
      const created = (await createResp.json()) as Record<string, unknown>;
      expect(created.status).toBe(0);
      expect(created.id).toMatch(/^[0-9a-f]{16}$/);
      const pasteId = created.id as string;

      const commentResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: { ...jsonHeaders, "CF-Connecting-IP": "203.0.113.11" },
        body: JSON.stringify({
          v: 2,
          adata: ["YWJjZGVmZ2hpamts", "YWJjZGVmZw==", 100000, 256, 128, "aes", "gcm", "zlib"],
          ct: "Y29tbWVudGNpcGhlcg==",
          pasteid: pasteId,
          parentid: pasteId,
        }),
      });
      const comment = (await commentResp.json()) as Record<string, unknown>;
      expect(comment.status).toBe(0);
      expect(comment.id).toMatch(/^[0-9a-f]{16}$/);

      const readResp = await SELF.fetch(`http://localhost/?${pasteId}`, {
        headers: jsonHeaders,
      });
      const data = (await readResp.json()) as Record<string, unknown>;
      const comments = data.comments as Record<string, unknown>[];

      expect(data.status).toBe(0);
      expect(data.comment_count).toBe(1);
      expect(comments).toHaveLength(1);
      expect(comments[0].parentid).toBe(pasteId);
      expect(comments[0].ct).toBe("Y29tbWVudGNpcGhlcg==");
    });

    it("rejects comments when discussion is disabled", async () => {
      const createResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: { ...jsonHeaders, "CF-Connecting-IP": "203.0.113.50" },
        body: JSON.stringify({
          ...validPasteBody,
          ct: "ZGlzY3Vzc2lvbmRpc2FibGVkcGFzdGU=",
        }),
      });
      const created = (await createResp.json()) as Record<string, unknown>;
      expect(created.status).toBe(0);
      expect(created.id).toMatch(/^[0-9a-f]{16}$/);
      const pasteId = created.id as string;

      const commentResp = await SELF.fetch("http://localhost/", {
        method: "POST",
        headers: { ...jsonHeaders, "CF-Connecting-IP": "203.0.113.51" },
        body: JSON.stringify({
          v: 2,
          adata: ["YWJjZGVmZ2hpamts", "YWJjZGVmZw==", 100000, 256, 128, "aes", "gcm", "zlib"],
          ct: "cmVqZWN0ZWRjb21tZW50Y2lwaGVy",
          pasteid: pasteId,
          parentid: pasteId,
        }),
      });
      const data = (await commentResp.json()) as Record<string, unknown>;

      expect(data.status).toBe(1);
      expect(data.message).toBe("Invalid data.");
    });
  });

  describe("CORS", () => {
    it("responds to OPTIONS preflight", async () => {
      const resp = await SELF.fetch("http://localhost/", {
        method: "OPTIONS",
        headers: { "Origin": "http://localhost" },
      });

      expect(resp.status).toBe(200);
      expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost");
      expect(resp.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });

    it("includes CORS headers on JSON responses", async () => {
      const resp = await SELF.fetch("http://localhost/?0000000000000000", {
        headers: jsonHeaders,
      });

      expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost");
    });
  });

  describe("HTML response", () => {
    it("serves HTML for non-JSON requests", async () => {
      const resp = await SELF.fetch("http://localhost/");

      expect(resp.status).toBe(200);
      expect(resp.headers.get("Content-Type")).toContain("text/html");
      expect(resp.headers.get("X-Frame-Options")).toBe("deny");
      expect(resp.headers.get("Referrer-Policy")).toBe("no-referrer");

      const html = await resp.text();
      expect(html).toContain("ZeroBin");
      expect(html).toContain("/assets/index-");
    });
  });
});
