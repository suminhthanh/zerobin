CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  v INTEGER NOT NULL DEFAULT 2,
  adata TEXT NOT NULL,
  ct TEXT,
  r2_key TEXT,
  meta_salt TEXT NOT NULL,
  expire_date INTEGER,
  burn_after_reading INTEGER NOT NULL DEFAULT 0,
  open_discussion INTEGER NOT NULL DEFAULT 0,
  formatter TEXT NOT NULL DEFAULT 'plaintext',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pastes_expire ON pastes(expire_date)
  WHERE expire_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS comments (
  id TEXT NOT NULL,
  paste_id TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  v INTEGER NOT NULL DEFAULT 2,
  adata TEXT NOT NULL,
  ct TEXT NOT NULL,
  nickname TEXT,
  vizhash TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (paste_id, id),
  FOREIGN KEY (paste_id) REFERENCES pastes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_paste ON comments(paste_id);

CREATE TABLE IF NOT EXISTS kv_store (
  namespace TEXT NOT NULL,
  key TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL,
  PRIMARY KEY (namespace, key)
);
