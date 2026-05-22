import { PasteRow, CommentRow } from "../types";

export const DATABASE_NOT_INITIALIZED_MESSAGE =
  "ZeroBin database is not initialized. Run `npm run db:migrate:prod` or `npx wrangler d1 migrations apply DB --remote`, then retry.";

export function isMissingD1TableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("D1_ERROR") && message.includes("no such table:");
}

export async function createPaste(db: D1Database, paste: PasteRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO pastes (id, v, adata, ct, r2_key, meta_salt, expire_date, burn_after_reading, open_discussion, formatter, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      paste.id,
      paste.v,
      paste.adata,
      paste.ct,
      paste.r2_key,
      paste.meta_salt,
      paste.expire_date,
      paste.burn_after_reading,
      paste.open_discussion,
      paste.formatter,
      paste.created_at
    )
    .run();
}

export async function readPaste(db: D1Database, id: string): Promise<PasteRow | null> {
  const row = await db.prepare("SELECT * FROM pastes WHERE id = ?").bind(id).first<PasteRow>();
  if (!row) return null;

  // Check expiry
  if (row.expire_date && row.expire_date < Math.floor(Date.now() / 1000)) {
    await deletePaste(db, id);
    return null;
  }

  return row;
}

export async function deletePaste(db: D1Database, id: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM comments WHERE paste_id = ?").bind(id),
    db.prepare("DELETE FROM pastes WHERE id = ?").bind(id),
  ]);
}

export async function existsPaste(db: D1Database, id: string): Promise<boolean> {
  const row = await db.prepare("SELECT 1 FROM pastes WHERE id = ?").bind(id).first();
  return row !== null;
}

export async function createComment(db: D1Database, comment: CommentRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO comments (id, paste_id, parent_id, v, adata, ct, nickname, vizhash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      comment.id,
      comment.paste_id,
      comment.parent_id,
      comment.v,
      comment.adata,
      comment.ct,
      comment.nickname,
      comment.vizhash,
      comment.created_at
    )
    .run();
}

export async function readComments(db: D1Database, pasteId: string): Promise<CommentRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM comments WHERE paste_id = ? ORDER BY created_at ASC")
    .bind(pasteId)
    .all<CommentRow>();
  return results || [];
}

export async function existsComment(
  db: D1Database,
  pasteId: string,
  _parentId: string,
  commentId: string
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 FROM comments WHERE paste_id = ? AND id = ?")
    .bind(pasteId, commentId)
    .first();
  return row !== null;
}

export async function getExpiredPasteIds(db: D1Database, batchSize: number): Promise<string[]> {
  const now = Math.floor(Date.now() / 1000);
  const { results } = await db
    .prepare("SELECT id FROM pastes WHERE expire_date IS NOT NULL AND expire_date < ? LIMIT ?")
    .bind(now, batchSize)
    .all<{ id: string }>();
  return (results || []).map((r) => r.id);
}

export async function purgeExpired(db: D1Database, bucket: R2Bucket, batchSize: number): Promise<void> {
  const ids = await getExpiredPasteIds(db, batchSize);
  for (const id of ids) {
    const paste = await db.prepare("SELECT r2_key FROM pastes WHERE id = ?").bind(id).first<{ r2_key: string | null }>();
    if (paste?.r2_key) {
      await bucket.delete(paste.r2_key);
    }
    await deletePaste(db, id);
  }
}

export async function getValue(db: D1Database, namespace: string, key: string = ""): Promise<string | null> {
  const row = await db
    .prepare("SELECT value FROM kv_store WHERE namespace = ? AND key = ?")
    .bind(namespace, key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

export async function setValue(db: D1Database, namespace: string, key: string, value: string): Promise<void> {
  await db
    .prepare(
      "INSERT INTO kv_store (namespace, key, value) VALUES (?, ?, ?) ON CONFLICT(namespace, key) DO UPDATE SET value = excluded.value"
    )
    .bind(namespace, key, value)
    .run();
}

export async function getServerSalt(db: D1Database): Promise<string> {
  let salt = await getValue(db, "salt", "");
  if (!salt) {
    const bytes = crypto.getRandomValues(new Uint8Array(256));
    salt = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await setValue(db, "salt", "", salt);
  }
  return salt;
}
