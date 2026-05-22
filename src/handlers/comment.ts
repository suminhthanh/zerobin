import { Env, CommentRow, PasteData } from "../types";
import { isValidComment } from "../utils/format-v2";
import { readPaste, createComment, existsComment, getServerSalt } from "../storage/d1";
import { hmacSha256, hmacSha512 } from "../utils/crypto";
import { loadConfig } from "../utils/config";

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

function generateCommentId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
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

export async function handleComment(request: Request, env: Env, data: PasteData, origin: string): Promise<Response> {
  if (!isValidComment(data)) {
    return jsonResponse({ status: 1, message: "Invalid data." }, 200, origin);
  }

  const config = loadConfig(env);
  const serverSalt = await getServerSalt(env.DB);

  // Rate limiting for comments
  const clientIp = getClientIp(request, config.trafficHeader || undefined);
  if (!config.trafficExempted.includes(clientIp) && config.trafficLimit > 0) {
    const rateCheck = await checkRateLimit(env, clientIp, serverSalt, config.trafficLimit);
    if (!rateCheck.pass) {
      return jsonResponse({ status: 1, message: rateCheck.message! }, 200, origin);
    }
  }

  const pasteId = data.pasteid!;
  const parentId = data.parentid!;

  // Verify paste exists
  const paste = await readPaste(env.DB, pasteId);
  if (!paste) {
    return jsonResponse({ status: 1, message: "Invalid data." }, 200, origin);
  }

  // Verify discussion is enabled on this paste
  if (!paste.open_discussion) {
    return jsonResponse({ status: 1, message: "Invalid data." }, 200, origin);
  }

  // If parentId != pasteId, verify parent comment exists
  if (parentId !== pasteId) {
    const parentExists = await existsComment(env.DB, pasteId, pasteId, parentId);
    if (!parentExists) {
      return jsonResponse({ status: 1, message: "Invalid data." }, 200, origin);
    }
  }

  // Generate random comment ID
  const commentId = generateCommentId();

  // Generate vizhash from IP
  const ipHash = await hmacSha512(clientIp, serverSalt);
  const vizhash = ipHash.substring(0, 16);

  // Store comment
  const now = Math.floor(Date.now() / 1000);
  const commentRow: CommentRow = {
    id: commentId,
    paste_id: pasteId,
    parent_id: parentId,
    v: data.v,
    adata: JSON.stringify(data.adata),
    ct: data.ct,
    nickname: null,
    vizhash,
    created_at: now,
  };

  await createComment(env.DB, commentRow);

  return jsonResponse({
    status: 0,
    id: commentId,
    url: `/?${pasteId}`,
  }, 200, origin);
}
