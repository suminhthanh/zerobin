export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  RATE_LIMITER: DurableObjectNamespace;
  ASSETS: Fetcher;

  // Config vars
  SITE_NAME: string;
  DISCUSSION: string;
  OPEN_DISCUSSION: string;
  PASSWORD: string;
  FILE_UPLOAD: string;
  BURN_AFTER_READING_SELECTED: string;
  DEFAULT_FORMATTER: string;
  SYNTAX_THEME: string;
  PASTE_SIZE_LIMIT: string;
  TEMPLATE: string;
  INFO_TEXT: string;
  NOTICE_TEXT: string;
  LANGUAGE_SELECTION: string;
  LANGUAGE_DEFAULT: string;
  URL_SHORTENER: string;
  SHORTEN_BY_DEFAULT: string;
  QR_CODE: string;
  EMAIL_SHARING: string;
  ICON_TYPE: string;
  HTTP_WARNING: string;
  COMPRESSION: string;
  CSP_HEADER: string;
  EXPIRE_DEFAULT: string;
  TRAFFIC_LIMIT: string;
  TRAFFIC_EXEMPTED: string;
  TRAFFIC_CREATORS: string;
  TRAFFIC_HEADER: string;
  PURGE_LIMIT: string;
  PURGE_BATCH_SIZE: string;

  // Secrets (set via wrangler secret put)
  YOURLS_SIGNATURE?: string;
  YOURLS_API_URL?: string;
  SHLINK_API_KEY?: string;
  SHLINK_API_URL?: string;
}

export interface PasteRow {
  id: string;
  v: number;
  adata: string;
  ct: string | null;
  r2_key: string | null;
  meta_salt: string;
  expire_date: number | null;
  burn_after_reading: number;
  open_discussion: number;
  formatter: string;
  created_at: number;
}

export interface CommentRow {
  id: string;
  paste_id: string;
  parent_id: string;
  v: number;
  adata: string;
  ct: string;
  nickname: string | null;
  vizhash: string | null;
  created_at: number;
}

export interface PasteData {
  v: number;
  adata: unknown[];
  ct: string;
  meta?: { expire?: string };
  pasteid?: string;
  parentid?: string;
}

export interface ApiResponse {
  status: number;
  id?: string;
  url?: string;
  message?: string;
  deletetoken?: string;
  [key: string]: unknown;
}
