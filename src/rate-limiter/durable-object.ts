import { Env } from "../types";

export class RateLimiter implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const lastRequest = (await this.state.storage.get<number>("lastRequest")) || 0;
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - lastRequest;

    if (elapsed < limit) {
      const wait = limit - elapsed;
      return new Response(
        JSON.stringify({
          status: 1,
          message: `Please wait ${wait} second${wait !== 1 ? "s" : ""} before creating another paste.`,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    await this.state.storage.put("lastRequest", now);

    return new Response(JSON.stringify({ status: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
