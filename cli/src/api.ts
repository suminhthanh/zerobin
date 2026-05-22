const API_HEADERS = {
  "X-Requested-With": "JSONHttpRequest",
  "Content-Type": "application/json",
};

export interface CreateResponse {
  status: number;
  id?: string;
  url?: string;
  deletetoken?: string;
  message?: string;
}

export interface ReadResponse {
  status: number;
  id?: string;
  url?: string;
  v?: number;
  adata?: unknown[];
  ct?: string;
  meta?: { time_to_live?: number };
  comments?: unknown[];
  comment_count?: number;
  message?: string;
}

export async function createPaste(
  server: string,
  payload: { v: number; ct: string; adata: unknown[]; meta: { expire: string } }
): Promise<CreateResponse> {
  const resp = await fetch(`${server}/`, {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(payload),
  });
  return resp.json() as Promise<CreateResponse>;
}

export async function readPaste(server: string, pasteId: string): Promise<ReadResponse> {
  const resp = await fetch(`${server}/?pasteid=${pasteId}`, {
    headers: API_HEADERS,
  });
  return resp.json() as Promise<ReadResponse>;
}

export async function deletePaste(
  server: string,
  pasteId: string,
  deleteToken: string
): Promise<CreateResponse> {
  const resp = await fetch(`${server}/?pasteid=${pasteId}&deletetoken=${deleteToken}`, {
    headers: API_HEADERS,
  });
  return resp.json() as Promise<CreateResponse>;
}
