import { Env } from "../types";
import { readPaste, readComments, deletePaste } from "../storage/d1";
import { getBlob, deleteBlob } from "../storage/r2";
import { hmacSha256 } from "../utils/crypto";

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

const GENERIC_ERROR = "Document does not exist, has expired or has been deleted.";

export async function handleRead(pasteId: string, env: Env, origin: string): Promise<Response> {
  const paste = await readPaste(env.DB, pasteId);
  if (!paste) {
    return jsonResponse({ status: 1, message: GENERIC_ERROR }, 200, origin);
  }

  // Load ciphertext from R2 if needed
  let ct = paste.ct;
  if (paste.r2_key) {
    ct = await getBlob(env.BUCKET, paste.r2_key);
    if (!ct) {
      return jsonResponse({ status: 1, message: GENERIC_ERROR }, 200, origin);
    }
  }

  // Burn after reading: delete immediately
  if (paste.burn_after_reading) {
    if (paste.r2_key) {
      await deleteBlob(env.BUCKET, paste.r2_key);
    }
    await deletePaste(env.DB, pasteId);
  }

  // Load comments
  const commentRows = await readComments(env.DB, pasteId);
  const comments: Record<string, unknown>[] = commentRows.map((c) => ({
    id: c.id,
    parentid: c.parent_id,
    v: c.v,
    adata: JSON.parse(c.adata),
    ct: c.ct,
    meta: {
      created: c.created_at,
      ...(c.vizhash ? { vizhash: c.vizhash } : {}),
      ...(c.nickname ? { nickname: c.nickname } : {}),
    },
  }));

  // Build response
  const now = Math.floor(Date.now() / 1000);
  const meta: Record<string, unknown> = {};
  if (paste.expire_date) {
    meta.time_to_live = paste.expire_date - now;
  }

  const response: Record<string, unknown> = {
    status: 0,
    id: pasteId,
    url: `/?${pasteId}`,
    v: paste.v,
    adata: JSON.parse(paste.adata),
    ct,
    meta,
    comment_count: comments.length,
    comment_offset: 0,
    "@context": "?jsonld=paste",
  };

  if (comments.length > 0) {
    response.comments = comments;
  } else if (paste.open_discussion) {
    response.comments = [];
  }

  return jsonResponse(response, 200, origin);
}
