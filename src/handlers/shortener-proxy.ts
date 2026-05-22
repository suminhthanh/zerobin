import { Env } from "../types";

interface ShortenerResult {
  url?: string;
  error?: string;
}

async function yourlsProxy(link: string, apiUrl: string, signature: string): Promise<ShortenerResult> {
  try {
    const params = new URLSearchParams({
      action: "shorturl",
      format: "json",
      signature,
      url: link,
    });
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await resp.json()) as Record<string, unknown>;
    if (data.shorturl) {
      return { url: data.shorturl as string };
    }
    return { error: (data.message as string) || "URL shortening failed." };
  } catch {
    return { error: "URL shortening service is not available." };
  }
}

async function shlinkProxy(link: string, apiUrl: string, apiKey: string): Promise<ShortenerResult> {
  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ longUrl: link }),
    });
    const data = (await resp.json()) as Record<string, unknown>;
    if (data.shortUrl) {
      return { url: data.shortUrl as string };
    }
    return { error: (data.detail as string) || "URL shortening failed." };
  } catch {
    return { error: "URL shortening service is not available." };
  }
}

export async function handleShortenerProxy(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const link = url.searchParams.get("link");

  if (!link) {
    return new Response("No link provided.", { status: 400 });
  }

  let result: ShortenerResult;

  if (url.searchParams.has("shortenviayourls")) {
    const apiUrl = env.YOURLS_API_URL;
    const signature = env.YOURLS_SIGNATURE;
    if (!apiUrl || !signature) {
      return new Response("YOURLS not configured.", { status: 500 });
    }
    result = await yourlsProxy(link, apiUrl, signature);
  } else {
    const apiUrl = env.SHLINK_API_URL;
    const apiKey = env.SHLINK_API_KEY;
    if (!apiUrl || !apiKey) {
      return new Response("Shlink not configured.", { status: 500 });
    }
    result = await shlinkProxy(link, apiUrl, apiKey);
  }

  if (result.error) {
    return new Response(result.error, { status: 200 });
  }

  return new Response(result.url, { status: 200 });
}
