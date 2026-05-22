import { readPaste as apiReadPaste } from "../lib/api";
import { decryptPaste, decodeKey } from "../lib/crypto";
import { writable, derived } from "svelte/store";

export type AppView = "editor" | "created" | "viewing" | "error" | "deleted";

export interface PasteOptions {
  expire: string;
  formatter: string;
  burnAfterReading: boolean;
  openDiscussion: boolean;
  password: string;
}

export interface CreatedPaste {
  id: string;
  url: string;
  deleteToken: string;
  fullUrl: string;
}

export interface ViewingPaste {
  id: string;
  content: string;
  formatter: string;
  openDiscussion: boolean;
  burnAfterReading: boolean;
  timeToLive: number | null;
  comments: ParsedComment[];
  attachments: { data: string; name: string }[];
}

export interface ParsedComment {
  id: string;
  parentId: string;
  content: string;
  nickname: string;
  createdAt: number;
}

interface AppStateData {
  view: AppView;
  loading: boolean;
  error: string;
  statusMessage: string;
  showPasswordModal: boolean;
  showBurnModal: boolean;
  options: PasteOptions;
  created: CreatedPaste | null;
  viewing: ViewingPaste | null;
  pasteId: string | null;
  encryptionKey: string | null;
  decryptionPassword: string;
}

const initialState: AppStateData = {
  view: "editor",
  loading: false,
  error: "",
  statusMessage: "",
  showPasswordModal: false,
  showBurnModal: false,
  options: {
    expire: "1week",
    formatter: "plaintext",
    burnAfterReading: false,
    openDiscussion: false,
    password: "",
  },
  created: null,
  viewing: null,
  pasteId: null,
  encryptionKey: null,
  decryptionPassword: "",
};

export const appState = writable<AppStateData>({ ...initialState });

export function initFromUrl() {
  const search = window.location.search;
  const hash = window.location.hash;

  if (!search || search === "?") return;

  const params = new URLSearchParams(search);

  // Check for delete/status redirect
  const status = params.get("status");
  if (status) {
    const statusMessages: Record<string, string> = {
      deleted: "Document was properly deleted.",
      error: "An error occurred.",
    };
    const message = statusMessages[status] || "Unknown status.";
    if (status === "deleted") {
      appState.update((s) => ({ ...s, view: "deleted", statusMessage: message }));
    } else {
      appState.update((s) => ({ ...s, view: "error", error: message }));
    }
    window.history.replaceState(null, "", "/");
    return;
  }

  // Check for paste ID in query
  let pasteId: string | null = null;

  // ?pasteId format (key with no value)
  for (const [key, value] of params.entries()) {
    if (value === "" && /^[a-f0-9]{16}$/.test(key)) {
      pasteId = key;
      break;
    }
  }

  if (!pasteId) return;

  // Extract encryption key from hash
  let encryptionKey = hash ? hash.substring(1) : null;
  if (encryptionKey && encryptionKey.startsWith("!")) {
    encryptionKey = encryptionKey.substring(1);
  }

  const isBurn = hash.startsWith("#!");

  appState.update((s) => ({
    ...s,
    pasteId,
    encryptionKey,
    showBurnModal: isBurn,
    view: isBurn ? "editor" : "viewing",
  }));

  if (!isBurn) {
    loadPaste(pasteId, encryptionKey || "");
  }
}

export async function loadPaste(pasteId: string, keyEncoded: string, password: string = "") {
  appState.update((s) => ({ ...s, loading: true, error: "" }));

  try {
    const resp = await apiReadPaste(pasteId);

    if (resp.status !== 0 || !resp.ct || !resp.adata) {
      appState.update((s) => ({
        ...s,
        view: "error",
        error: resp.message || "Document does not exist, has expired or has been deleted.",
        loading: false,
      }));
      return;
    }

    const key = decodeKey(keyEncoded);
    let plaintext: string;

    try {
      plaintext = await decryptPaste(resp.ct, resp.adata as any, key, password);
    } catch {
      appState.update((s) => ({ ...s, showPasswordModal: true, loading: false }));
      return;
    }

    const parsed = JSON.parse(plaintext);
    const adata = resp.adata as [unknown[], string, number, number];
    const formatter = (adata[1] as string) || "plaintext";
    const openDiscussion = adata[2] === 1;
    const burnAfterReading = adata[3] === 1;

    // Parse comments
    const comments: ParsedComment[] = [];
    if (resp.comments && Array.isArray(resp.comments)) {
      for (const c of resp.comments) {
        const comment = c as any;
        try {
          const commentPlain = await decryptPaste(comment.ct, comment.adata, key, password);
          const commentParsed = JSON.parse(commentPlain);
          comments.push({
            id: comment.id,
            parentId: comment.parentid,
            content: commentParsed.comment || "",
            nickname: commentParsed.nickname || "Anonymous",
            createdAt: comment.meta?.created || 0,
          });
        } catch {
          comments.push({
            id: comment.id,
            parentId: comment.parentid,
            content: "[decryption failed]",
            nickname: "Unknown",
            createdAt: 0,
          });
        }
      }
    }

    // Parse attachments
    const attachments: { data: string; name: string }[] = [];
    if (parsed.attachment) {
      if (Array.isArray(parsed.attachment)) {
        parsed.attachment.forEach((att: string, i: number) => {
          attachments.push({ data: att, name: parsed.attachment_name?.[i] || `file-${i}` });
        });
      } else {
        attachments.push({ data: parsed.attachment, name: parsed.attachment_name || "attachment" });
      }
    }

    appState.update((s) => ({
      ...s,
      view: "viewing",
      loading: false,
      showPasswordModal: false,
      decryptionPassword: password,
      viewing: {
        id: pasteId,
        content: parsed.paste || "",
        formatter,
        openDiscussion,
        burnAfterReading,
        timeToLive: resp.meta?.time_to_live ?? null,
        comments,
        attachments,
      },
    }));
  } catch (err) {
    appState.update((s) => ({
      ...s,
      view: "error",
      error: "Failed to load document.",
      loading: false,
    }));
  }
}

export function resetToEditor() {
  window.history.pushState(null, "", "/");
  appState.set({ ...initialState });
}
