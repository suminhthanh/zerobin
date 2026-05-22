import { Env } from "../types";

const SPOOFABLE_HEADERS = ["x-forwarded-for", "x-real-ip", "forwarded", "x-client-ip", "x-cluster-client-ip"];

function validateTrafficHeader(header: string): string {
  if (!header) return "";
  const lower = header.toLowerCase().trim();
  if (SPOOFABLE_HEADERS.includes(lower)) {
    console.warn(`TRAFFIC_HEADER "${header}" is client-spoofable. Falling back to CF-Connecting-IP.`);
    return "";
  }
  return header.trim();
}

export interface AppConfig {
  siteName: string;
  basePath: string;
  discussion: boolean;
  openDiscussion: boolean;
  password: boolean;
  fileUpload: boolean;
  burnAfterReadingSelected: boolean;
  defaultFormatter: string;
  syntaxTheme: string;
  pasteSizeLimit: number;
  template: string;
  infoText: string;
  noticeText: string;
  languageSelection: boolean;
  languageDefault: string;
  urlShortener: string;
  shortenByDefault: boolean;
  qrCode: boolean;
  emailSharing: boolean;
  iconType: string;
  httpWarning: boolean;
  compression: string;
  cspHeader: string;
  expireDefault: string;
  expireOptions: Record<string, number>;
  trafficLimit: number;
  trafficExempted: string[];
  trafficCreators: string[];
  trafficHeader: string;
  purgeLimit: number;
  purgeBatchSize: number;
}

export function loadConfig(env: Env): AppConfig {
  return {
    siteName: env.SITE_NAME || "ZeroBin",
    basePath: "/",
    discussion: env.DISCUSSION !== "false",
    openDiscussion: env.OPEN_DISCUSSION === "true",
    password: env.PASSWORD !== "false",
    fileUpload: env.FILE_UPLOAD === "true",
    burnAfterReadingSelected: env.BURN_AFTER_READING_SELECTED === "true",
    defaultFormatter: env.DEFAULT_FORMATTER || "plaintext",
    syntaxTheme: env.SYNTAX_THEME || "",
    pasteSizeLimit: (() => { const v = parseInt(env.PASTE_SIZE_LIMIT || "10000000"); return Number.isFinite(v) ? v : 10_000_000; })(),
    template: env.TEMPLATE || "bootstrap5",
    infoText: env.INFO_TEXT || "",
    noticeText: env.NOTICE_TEXT || "",
    languageSelection: env.LANGUAGE_SELECTION === "true",
    languageDefault: env.LANGUAGE_DEFAULT || "en",
    urlShortener: env.URL_SHORTENER || "",
    shortenByDefault: env.SHORTEN_BY_DEFAULT === "true",
    qrCode: env.QR_CODE === "true",
    emailSharing: env.EMAIL_SHARING === "true",
    iconType: env.ICON_TYPE || "jdenticon",
    httpWarning: env.HTTP_WARNING !== "false",
    compression: env.COMPRESSION || "zlib",
    cspHeader: env.CSP_HEADER || "",
    expireDefault: env.EXPIRE_DEFAULT || "1week",
    expireOptions: {
      "5min": 300,
      "10min": 600,
      "1hour": 3600,
      "1day": 86400,
      "1week": 604800,
      "1month": 2592000,
      "1year": 31536000,
      "never": 0,
    },
    trafficLimit: parseInt(env.TRAFFIC_LIMIT || "10"),
    trafficExempted: (env.TRAFFIC_EXEMPTED || "").split(",").map(s => s.trim()).filter(Boolean),
    trafficCreators: (env.TRAFFIC_CREATORS || "").split(",").map(s => s.trim()).filter(Boolean),
    trafficHeader: validateTrafficHeader(env.TRAFFIC_HEADER || ""),
    purgeLimit: parseInt(env.PURGE_LIMIT || "300"),
    purgeBatchSize: (() => { const v = parseInt(env.PURGE_BATCH_SIZE || "10"); return Number.isFinite(v) ? Math.max(1, Math.min(v, 1000)) : 10; })(),
  };
}
