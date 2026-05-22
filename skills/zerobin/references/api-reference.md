# ZeroBin / PrivateBin v2 API Reference

For agents that need to call the API directly without the `zerobin-cli`. The wire format is wire-compatible with [PrivateBin v2](https://github.com/PrivateBin/PrivateBin/wiki/API).

## Required headers

All requests must include:

```
X-Requested-With: JSONHttpRequest
Content-Type: application/json
```

The first header doubles as a CSRF token — without it, the server returns the SPA HTML instead of JSON.

## Endpoints

The API uses a single root endpoint with the operation determined by HTTP method and query string.

### Create paste

```
POST /
Body: { v: 2, ct: "<base64>", adata: [...], meta: { expire: "1week" } }
```

**Response:**
```json
{
  "status": 0,
  "id": "abc123def4567890",
  "url": "/?abc123def4567890",
  "deletetoken": "ab12cd34..."
}
```

On error: `{ "status": 1, "message": "..." }`

### Read paste

```
GET /?pasteid=<id>
```

**Response:**
```json
{
  "status": 0,
  "id": "abc123...",
  "v": 2,
  "adata": [...],
  "ct": "<base64 ciphertext>",
  "meta": { "time_to_live": 604800 },
  "comments": [],
  "comment_count": 0
}
```

If the paste was created with burn-after-reading, the server deletes it after the read succeeds.

### Delete paste

```
GET /?pasteid=<id>&deletetoken=<token>
```

**Response:** `{ "status": 0 }` on success, otherwise `{ "status": 1, "message": "..." }`.

### Comment on paste (optional)

```
POST /
Body: { v: 2, ct: "<base64>", adata: [...], pasteid: "<paste-id>", parentid: "<paste-id-or-comment-id>" }
```

## Encryption protocol

The `ct` field is the base64 encoding of:

1. AES-256-GCM ciphertext + 128-bit auth tag
2. Encrypted with a key derived via PBKDF2-SHA256(100000 iterations) from a 256-bit random key (Base58 encoded into the URL fragment), optionally concatenated with a user password
3. The `adata` array, JSON-stringified, is bound as additional authenticated data (AAD)
4. Plaintext is optionally compressed with raw deflate (zlib without header) before encryption

### `adata` for pastes

```json
[
  [
    "<base64 IV (16 bytes)>",
    "<base64 salt (8 bytes)>",
    100000,
    256,
    128,
    "aes",
    "gcm",
    "zlib"
  ],
  "plaintext",
  0,
  0
]
```

Position-wise:
- `[0]` cipher spec tuple (above)
- `[1]` formatter: `"plaintext"`, `"syntaxhighlighting"`, or `"markdown"`
- `[2]` open discussion: `0` or `1`
- `[3]` burn after reading: `0` or `1`

### `adata` for comments

Just the cipher spec tuple — no extra fields.

## Expiration values

`meta.expire` accepts:

| Value | Meaning |
|-------|---------|
| `5min` | 5 minutes |
| `10min` | 10 minutes |
| `1hour` | 1 hour |
| `1day` | 24 hours |
| `1week` | 7 days (default) |
| `1month` | 30 days |
| `1year` | 365 days |
| `never` | No expiration |

## Rate limits

Servers typically enforce per-IP rate limits on paste creation (default: one paste per 10 seconds per IP). Reads and deletes are not rate-limited.

## Status codes

| `status` | Meaning |
|----------|---------|
| `0` | Success |
| `1` | Error (see `message` for details) |

HTTP-level codes:
- `200` — request reached the application (always check JSON `status` field)
- `429` — rate-limited
- `503` — database not initialized (rare, deployment issue)
