# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

ZeroBin is a zero-knowledge encrypted pastebin built on Cloudflare Workers. Wire-compatible with the PrivateBin v2 API format. The server never sees plaintext — all encryption/decryption happens client-side using AES-256-GCM + PBKDF2.

## Commands

```bash
# Dev server (serves Worker + static assets on localhost:8787)
npm run dev

# Build frontend (must run before dev/deploy — outputs to public/)
cd frontend && npm run build

# Type-check backend
npm run lint

# Run all tests (uses real Workers runtime via @cloudflare/vitest-pool-workers)
npm test

# Watch mode
npm run test:watch

# Database migrations
npm run db:migrate:local    # local D1
npm run db:migrate:prod     # production D1

# Deploy
npm run deploy              # production
npm run deploy:preview      # preview environment
```

Frontend has its own package.json — run `cd frontend && npm install` separately.

## Architecture

**Two distinct TypeScript projects in one repo:**

1. **Root (`/`)** — Cloudflare Worker backend. Zero runtime npm deps. Uses D1 (SQLite), R2 (blobs), Durable Objects (rate limiting), and cron triggers.
2. **`/frontend`** — Svelte 5 SPA (runes syntax). Tailwind CSS 4 with custom cyberpunk theme tokens. Vite builds to `../public/` which the Worker serves via ASSETS binding.

**Request flow:**
- Browser hits Worker → Worker serves SPA from ASSETS for HTML requests, or handles JSON API for `?pasteid=` queries
- SPA parses paste ID from `?<id>` and decryption key from URL fragment `#<base58key>`
- Key never leaves the browser; server only stores ciphertext

**Backend modules (`src/`):**
- `index.ts` — router + Durable Object class export
- `types.ts` — Env bindings, DB row interfaces, API response types
- `handlers/` — create, read, delete, comment, jsonld, shortener-proxy
- `storage/d1.ts` — all D1 queries + kv_store + purge logic
- `storage/r2.ts` — large ciphertext storage (>100KB threshold)
- `rate-limiter/durable-object.ts` — per-IP rate limiting via DO
- `utils/config.ts` — typed config from wrangler.toml vars
- `utils/format-v2.ts` — v2 paste/comment payload validation
- `utils/crypto.ts` — server-side crypto helpers
- `utils/fnv1a64.ts` — FNV-1a 64-bit hash for paste ID generation

**Frontend state (`frontend/src/stores/app.ts`):**
- Single writable store drives all views: `editor` → `created` → `viewing` → `deleted` | `error`
- Modals overlay via boolean flags (`showPasswordModal`, `showBurnModal`)

**Encryption protocol (client-side):**
1. 32 random bytes → Base58 → URL fragment
2. Compress plaintext (zlib via fflate)
3. PBKDF2-SHA256 (100k iterations) derives AES key
4. AES-256-GCM encrypt with `adata` array as AAD
5. Paste ID = FNV-1a 64-bit hash of ciphertext (server-side, deterministic)

**Database schema (D1):** `pastes`, `comments`, `kv_store` — see `migrations/0001_initial.sql`

## Testing

Tests use `@cloudflare/vitest-pool-workers` which runs inside a real Workers environment with actual D1/R2 bindings (local). Integration tests in `test/integration/api.test.ts` cover the full request lifecycle. Unit tests in `test/unit/` cover crypto utilities and format validation.

## Key Bindings & Config

- `wrangler.toml` — all Cloudflare bindings, env vars, cron schedule, environments
- `frontend/src/app.css` — Tailwind 4 `@theme` block defines all design tokens (cyber-bg, cyber-cyan, cyber-purple, etc.) and utility classes (glass, btn-primary, input-field, modal-*)
- Config is loaded via `src/utils/config.ts` which maps env vars to a typed `AppConfig` with defaults
