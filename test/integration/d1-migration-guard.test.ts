import { describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:test";
import worker from "../../src/index";
import { Env } from "../../src/types";

const jsonHeaders = {
  "X-Requested-With": "JSONHttpRequest",
  "Content-Type": "application/json",
};

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

function missingTableDb(table: string): D1Database {
  const error = new Error(`D1_ERROR: no such table: ${table}: SQLITE_ERROR`);
  const statement = {
    bind: () => statement,
    first: async () => {
      throw error;
    },
    all: async () => {
      throw error;
    },
  };
  return {
    prepare: () => statement,
  } as unknown as D1Database;
}

function testEnv(db: D1Database): Env {
  return { ...env, DB: db } as Env;
}

const executionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

describe("D1 migration guard", () => {
  it("returns setup guidance when the API runs before D1 migrations", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(validPasteBody),
      }),
      testEnv(missingTableDb("kv_store")),
      executionContext
    );

    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(503);
    expect(body.status).toBe(1);
    expect(body.message).toContain("npm run db:migrate:prod");
  });

  it("returns setup guidance when reads run before D1 migrations", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/?0000000000000000", {
        headers: jsonHeaders,
      }),
      testEnv(missingTableDb("pastes")),
      executionContext
    );

    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status).toBe(503);
    expect(body.status).toBe(1);
    expect(body.message).toContain("npm run db:migrate:prod");
  });

  it("does not fail scheduled purges before D1 migrations are applied", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(
      worker.scheduled({} as ScheduledEvent, testEnv(missingTableDb("pastes")), executionContext)
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("npm run db:migrate:prod"));
    warn.mockRestore();
  });
});
