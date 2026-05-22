import { Env } from "./types";
import { RateLimiter } from "./rate-limiter/durable-object";
import { handleCreate } from "./handlers/create";
import { handleRead } from "./handlers/read";
import { handleDelete } from "./handlers/delete";
import { handleJsonLd } from "./handlers/jsonld";
import { handleShortenerProxy } from "./handlers/shortener-proxy";
import { DATABASE_NOT_INITIALIZED_MESSAGE, isMissingD1TableError, purgeExpired } from "./storage/d1";

export { RateLimiter };

function isJsonApiRequest(request: Request): boolean {
  const xRequestedWith = request.headers.get("X-Requested-With");
  if (xRequestedWith === "JSONHttpRequest") return true;

  const accept = request.headers.get("Accept") || "";
  if (accept.includes("application/json") && !accept.includes("text/html")) return true;

  return false;
}

function getPasteIdFromQuery(url: URL): string | null {
  const search = url.search;
  if (!search || search === "?") return null;

  const params = url.searchParams;

  // Frontend uses ?pasteid=<id> format for API reads
  const pasteidParam = params.get("pasteid");
  if (pasteidParam && /^[a-f0-9]{16}$/.test(pasteidParam)) {
    return pasteidParam;
  }

  // Also support ?<id> format (key with no value)
  for (const [key, value] of params.entries()) {
    if (value === "" && /^[a-f0-9]{16}$/.test(key)) {
      return key;
    }
  }
  return null;
}

function jsonResponse(body: object, status = 200, origin?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "null",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "X-Requested-With, Content-Type",
      "Cache-Control": "no-store, no-cache, no-transform, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const isJson = isJsonApiRequest(request);

      const selfOrigin = new URL(request.url).origin;
      const incomingOrigin = request.headers.get("Origin");
      const requestOrigin = !incomingOrigin || incomingOrigin === selfOrigin ? selfOrigin : "null";

      // CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": selfOrigin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
            "Access-Control-Allow-Headers": "X-Requested-With, Content-Type",
          },
        });
      }

      // POST — create paste or comment
      if (request.method === "POST" && isJson) {
        return await handleCreate(request, env, ctx, requestOrigin);
      }

      // Delete paste
      if (url.searchParams.has("pasteid") && url.searchParams.has("deletetoken")) {
        return await handleDelete(request, env, requestOrigin);
      }

      // JSON-LD context
      if (url.searchParams.has("jsonld")) {
        return await handleJsonLd(request, env);
      }

      // URL shortener proxy
      if (url.searchParams.has("shortenviayourls") || url.searchParams.has("shortenviashlink")) {
        return await handleShortenerProxy(request, env);
      }

      // Read paste (JSON API)
      const pasteId = getPasteIdFromQuery(url);
      if (pasteId && isJson) {
        return await handleRead(pasteId, env, requestOrigin);
      }

      // Non-JSON: serve index.html from assets for SPA routing
      const indexReq = new Request(new URL("/index.html", request.url), request);
      const assetResp = await env.ASSETS.fetch(indexReq);
      const response = new Response(assetResp.body, assetResp);
      response.headers.set("X-Frame-Options", "deny");
      response.headers.set("Referrer-Policy", "no-referrer");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
      response.headers.set("Permissions-Policy", "browsing-topics=()");
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
      );
      return response;
    } catch (error) {
      if (isMissingD1TableError(error)) {
        const origin = request.headers.get("Origin") || new URL(request.url).origin;
        return jsonResponse({ status: 1, message: DATABASE_NOT_INITIALIZED_MESSAGE }, 503, origin);
      }
      throw error;
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const batchSize = parseInt(env.PURGE_BATCH_SIZE || "10");
    try {
      await purgeExpired(env.DB, env.BUCKET, batchSize);
    } catch (error) {
      if (isMissingD1TableError(error)) {
        console.warn(DATABASE_NOT_INITIALIZED_MESSAGE);
        return;
      }
      throw error;
    }
  },
};
