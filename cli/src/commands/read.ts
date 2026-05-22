import { decodeKey, decryptPaste, type PasteAdata } from "../crypto.js";
import { readPaste } from "../api.js";

export interface ReadOptions {
  url: string;
  password: string;
  json: boolean;
}

interface ParsedPasteUrl {
  server: string;
  pasteId: string;
  key: string;
}

export function parsePasteUrl(input: string): ParsedPasteUrl {
  const url = new URL(input);
  const server = `${url.protocol}//${url.host}`;
  const fragment = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (!fragment) {
    throw new Error(`URL is missing decryption key fragment (#...): ${input}`);
  }

  let pasteId: string | null = null;
  const params = url.searchParams;
  const pasteidParam = params.get("pasteid");
  if (pasteidParam && /^[a-f0-9]{16}$/.test(pasteidParam)) {
    pasteId = pasteidParam;
  } else {
    for (const [key, value] of params.entries()) {
      if (value === "" && /^[a-f0-9]{16}$/.test(key)) {
        pasteId = key;
        break;
      }
    }
  }

  if (!pasteId) {
    throw new Error(`Could not find paste ID in URL: ${input}`);
  }

  return { server, pasteId, key: fragment };
}

export async function runRead(opts: ReadOptions): Promise<void> {
  const { server, pasteId, key } = parsePasteUrl(opts.url);

  const response = await readPaste(server, pasteId);
  if (response.status !== 0 || !response.ct || !response.adata) {
    throw new Error(response.message || "Paste not found or expired");
  }

  const keyBytes = decodeKey(key);
  const decrypted = await decryptPaste(
    response.ct,
    response.adata as PasteAdata,
    keyBytes,
    opts.password
  );

  let plaintext = decrypted;
  let attachments: { data: string; name: string }[] = [];
  try {
    const parsed = JSON.parse(decrypted);
    if (typeof parsed === "object" && parsed !== null && "paste" in parsed) {
      plaintext = parsed.paste ?? "";
      if (parsed.attachment) {
        if (Array.isArray(parsed.attachment)) {
          parsed.attachment.forEach((att: string, i: number) => {
            attachments.push({ data: att, name: parsed.attachment_name?.[i] || `file-${i}` });
          });
        } else {
          attachments.push({
            data: parsed.attachment,
            name: parsed.attachment_name || "attachment",
          });
        }
      }
    }
  } catch {
    // Plaintext was not a JSON envelope (e.g. created by an older client). Use raw value.
  }

  if (opts.json) {
    console.log(JSON.stringify({
      id: response.id,
      content: plaintext,
      attachments,
      meta: response.meta,
      comment_count: response.comment_count ?? 0,
    }, null, 2));
  } else {
    process.stdout.write(plaintext);
    if (!plaintext.endsWith("\n")) process.stdout.write("\n");
  }
}
