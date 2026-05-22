import { Env, PasteRow } from "../types";
import { generateSalt, hmacSha256 } from "../utils/crypto";
import { isValidPaste, isValidComment } from "../utils/format-v2";
import { loadConfig } from "../utils/config";
import { createPaste, existsPaste, getServerSalt, getValue, setValue } from "../storage/d1";
import { putBlob, shouldUseR2 } from "../storage/r2";
import { handleComment } from "./comment";

function generatePasteId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(body: object, status = 200, origin?: string): Response {
  const json = JSON.stringify(body);
  return new Response(json, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "null",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "X-Requested-With, Content-Type",
      "X-Uncompressed-Content-Length": String(json.length),
      "Access-Control-Expose-Headers": "X-Uncompressed-Content-Length",
      "Cache-Control": "no-store, no-cache, no-transform, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}

function getClientIp(request: Request, headerName?: string): string {
  if (headerName && headerName.trim()) {
    try {
      return request.headers.get(headerName) || "unknown";
    } catch {
      return request.headers.get("CF-Connecting-IP") || "unknown";
    }
  }
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function checkRateLimit(env: Env, clientIp: string, serverSalt: string, limit: number): Promise<{ pass: boolean; message?: string }> {
  const ipHash = await hmacSha256(clientIp, serverSalt);
  const id = env.RATE_LIMITER.idFromName(ipHash);
  const stub = env.RATE_LIMITER.get(id);
  const resp = await stub.fetch(`http://internal/check?limit=${limit}`);
  if (resp.status === 429) {
    const body = (await resp.json()) as { message: string };
    return { pass: false, message: body.message };
  }
  return { pass: true };
}

export async function handleCreate(request: Request, env: Env, ctx: ExecutionContext, origin: string): Promise<Response> {
  const config = loadConfig(env);
  const serverSalt = await getServerSalt(env.DB);

  // Parse body first to determine if comment or paste
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ status: 1, message: "Invalid data." }, 200, origin);
  }

  // Route comments to their own handler (with its own rate limiting)
  const obj = data as Record<string, unknown>;
  const isComment = Boolean(obj.pasteid && obj.parentid);

  if (isComment) {
    return handleComment(request, env, data as import("../types").PasteData, origin);
  }

  // Rate limiting for paste creation
  const clientIp = getClientIp(request, config.trafficHeader || undefined);

  if (config.trafficCreators.length > 0 && !config.trafficCreators.includes(clientIp)) {
    return jsonResponse({ status: 1, message: "You are not authorized to create pastes." }, 200, origin);
  }

  if (!config.trafficExempted.includes(clientIp) && config.trafficLimit > 0) {
    const rateCheck = await checkRateLimit(env, clientIp, serverSalt, config.trafficLimit);
    if (!rateCheck.pass) {
      return jsonResponse({ status: 1, message: rateCheck.message! }, 200, origin);
    }
  }

  // Validate paste
  if (!isValidPaste(data)) {
    return jsonResponse({ status: 1, message: "Invalid data." }, 200, origin);
  }

  // Size check
  if (data.ct.length > config.pasteSizeLimit) {
    const sizeMB = (config.pasteSizeLimit / 1_000_000).toFixed(1);
    return jsonResponse({ status: 1, message: `Document is limited to ${sizeMB} MB of encrypted data.` }, 200, origin);
  }

  // Generate paste ID
  const pasteId = generatePasteId();

  // Check collision
  if (await existsPaste(env.DB, pasteId)) {
    return jsonResponse({ status: 1, message: "You are unlucky. Try again." }, 200, origin);
  }

  // Generate per-paste salt and delete token
  const pasteSalt = await generateSalt();
  const deleteToken = await hmacSha256(pasteId, pasteSalt);

  // Compute expiry
  const expireKey = data.meta?.expire || config.expireDefault;
  const expireSeconds = config.expireOptions[expireKey] ?? config.expireOptions[config.expireDefault];
  const now = Math.floor(Date.now() / 1000);
  const expireDate = expireSeconds === 0 ? null : now + expireSeconds;

  // Store ciphertext
  const useR2 = shouldUseR2(data.ct);
  const r2Key = useR2 ? pasteId : null;

  if (useR2) {
    await putBlob(env.BUCKET, pasteId, data.ct);
  }

  // Store paste metadata in D1
  const pasteRow: PasteRow = {
    id: pasteId,
    v: data.v,
    adata: JSON.stringify(data.adata),
    ct: useR2 ? null : data.ct,
    r2_key: r2Key,
    meta_salt: pasteSalt,
    expire_date: expireDate,
    burn_after_reading: (data.adata as unknown[])[3] === 1 ? 1 : 0,
    open_discussion: (data.adata as unknown[])[2] === 1 ? 1 : 0,
    formatter: ((data.adata as unknown[])[1] as string) || "plaintext",
    created_at: now,
  };

  await createPaste(env.DB, pasteRow);

  // Trigger purge in background
  ctx.waitUntil(maybePurge(env, config));

  return jsonResponse({
    status: 0,
    id: pasteId,
    url: `/?${pasteId}`,
    deletetoken: deleteToken,
  }, 200, origin);
}

async function maybePurge(env: Env, config: { purgeLimit: number; purgeBatchSize: number }): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const lastPurge = await getValue(env.DB, "purge_limiter", "");
  const lastPurgeTime = lastPurge ? parseInt(lastPurge) : 0;

  if (now - lastPurgeTime < config.purgeLimit) return;

  await setValue(env.DB, "purge_limiter", "", String(now));

  const { purgeExpired } = await import("../storage/d1");
  await purgeExpired(env.DB, env.BUCKET, config.purgeBatchSize);
}
