import { Env } from "../types";

const VALID_TYPES = ["comment", "commentmeta", "paste", "pastemeta", "types"];

export async function handleJsonLd(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const type = url.searchParams.get("jsonld") || "";

  if (!VALID_TYPES.includes(type)) {
    return new Response("{}", {
      headers: {
        "Content-Type": "application/ld+json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  }

  // Fetch the jsonld file from static assets
  const assetUrl = new URL(`/js/${type}.jsonld`, url.origin);
  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl));

  if (!assetResponse.ok) {
    return new Response("{}", {
      headers: {
        "Content-Type": "application/ld+json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  }

  let content = await assetResponse.text();

  // Replace relative jsonld references with full base URL
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
  content = content.replace(/\?jsonld=/g, `${baseUrl}?jsonld=`);

  return new Response(content, {
    headers: {
      "Content-Type": "application/ld+json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
