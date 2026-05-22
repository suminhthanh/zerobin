import { Env } from "../types";
import { readPaste, deletePaste } from "../storage/d1";
import { deleteBlob } from "../storage/r2";
import { hmacSha256, timingSafeEqual } from "../utils/crypto";

function isJsonApiRequest(request: Request): boolean {
  const xRequestedWith = request.headers.get("X-Requested-With");
  if (xRequestedWith === "JSONHttpRequest") return true;
  const accept = request.headers.get("Accept") || "";
  if (accept.includes("application/json") && !accept.includes("text/html")) return true;
  return false;
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

const GENERIC_ERROR = "Document does not exist, has expired or has been deleted.";

export async function handleDelete(request: Request, env: Env, origin: string): Promise<Response> {
  const url = new URL(request.url);
  const pasteId = url.searchParams.get("pasteid");
  const deleteToken = url.searchParams.get("deletetoken");
  const isJson = isJsonApiRequest(request);

  if (!pasteId || !deleteToken) {
    if (isJson) return jsonResponse({ status: 1, message: "Invalid request." }, 200, origin);
    return redirect(url, "error", "Invalid request.");
  }

  const paste = await readPaste(env.DB, pasteId);
  if (!paste) {
    if (isJson) return jsonResponse({ status: 1, message: GENERIC_ERROR }, 200, origin);
    return redirect(url, "error", GENERIC_ERROR);
  }

  const expectedToken = await hmacSha256(pasteId, paste.meta_salt);
  if (!timingSafeEqual(expectedToken, deleteToken)) {
    const msg = "Wrong deletion token. Document was not deleted.";
    if (isJson) return jsonResponse({ status: 1, message: msg }, 200, origin);
    return redirect(url, "error", msg);
  }

  if (paste.r2_key) {
    await deleteBlob(env.BUCKET, paste.r2_key);
  }

  await deletePaste(env.DB, pasteId);

  if (isJson) {
    return jsonResponse({ status: 0, id: pasteId, url: `/?${pasteId}` }, 200, origin);
  }

  return redirect(url, "deleted", "Document was properly deleted.");
}

function redirect(url: URL, status: string, message: string): Response {
  const target = `${url.origin}/?status=${status}&msg=${encodeURIComponent(message)}`;
  return Response.redirect(target, 302);
}
