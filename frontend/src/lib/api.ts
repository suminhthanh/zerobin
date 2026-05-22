const API_BASE = window.location.origin;

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

export async function createPaste(data: {
  v: number;
  ct: string;
  adata: unknown[];
  meta: { expire: string };
}): Promise<CreateResponse> {
  const resp = await fetch(API_BASE + "/", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(data),
  });
  return resp.json();
}

export async function readPaste(pasteId: string): Promise<ReadResponse> {
  const resp = await fetch(`${API_BASE}/?pasteid=${pasteId}`, {
    headers: API_HEADERS,
  });
  return resp.json();
}

export async function deletePaste(pasteId: string, deleteToken: string): Promise<CreateResponse> {
  const resp = await fetch(`${API_BASE}/?pasteid=${pasteId}&deletetoken=${deleteToken}`, {
    headers: API_HEADERS,
  });
  return resp.json();
}

export async function createComment(data: {
  v: number;
  ct: string;
  adata: unknown[];
  pasteid: string;
  parentid: string;
}): Promise<CreateResponse> {
  const resp = await fetch(API_BASE + "/", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify(data),
  });
  return resp.json();
}
