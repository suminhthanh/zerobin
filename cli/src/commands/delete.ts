import { deletePaste } from "../api.js";
import { parsePasteUrl } from "./read.js";

export interface DeleteOptions {
  url: string;
  token: string;
  json: boolean;
}

export async function runDelete(opts: DeleteOptions): Promise<void> {
  const { server, pasteId } = parsePasteUrl(opts.url);
  const response = await deletePaste(server, pasteId, opts.token);

  if (response.status !== 0) {
    throw new Error(response.message || "Failed to delete paste");
  }

  if (opts.json) {
    console.log(JSON.stringify({ status: "deleted", id: pasteId }, null, 2));
  } else {
    console.log(`Deleted: ${pasteId}`);
  }
}
