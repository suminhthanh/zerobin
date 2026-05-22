import { readFileSync } from "node:fs";
import { encryptPaste, generateKey, encodeKey } from "../crypto.js";
import { createPaste } from "../api.js";

export interface CreateOptions {
  server: string;
  expire: string;
  burn: boolean;
  discussion: boolean;
  password: string;
  format: string;
  file?: string;
  json: boolean;
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new Error(
      "No input provided. Pipe content via stdin or use --file <path>.\n" +
      "Example: echo \"hello\" | zerobin create"
    );
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export async function runCreate(opts: CreateOptions): Promise<void> {
  const plaintext = opts.file
    ? readFileSync(opts.file, "utf-8")
    : await readStdin();

  if (plaintext.length === 0) {
    throw new Error("Empty content. Nothing to encrypt.");
  }

  const key = generateKey();
  const payload = JSON.stringify({ paste: plaintext });
  const { ct, adata } = await encryptPaste(payload, key, opts.password, {
    formatter: opts.format,
    openDiscussion: opts.discussion,
    burnAfterReading: opts.burn,
  });

  const response = await createPaste(opts.server, {
    v: 2,
    ct,
    adata,
    meta: { expire: opts.expire },
  });

  if (response.status !== 0 || !response.id) {
    throw new Error(response.message || "Failed to create paste");
  }

  const encodedKey = encodeKey(key);
  const url = `${opts.server}/?${response.id}#${encodedKey}`;

  if (opts.json) {
    console.log(JSON.stringify({
      url,
      id: response.id,
      deletetoken: response.deletetoken,
      server: opts.server,
      key: encodedKey,
    }, null, 2));
  } else {
    console.log(url);
    if (response.deletetoken) {
      console.error(`Delete token: ${response.deletetoken}`);
    }
  }
}
