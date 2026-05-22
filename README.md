# ZeroBin

**Zero-knowledge encrypted pastebin running entirely on Cloudflare.**

Your data, your keys, your privacy. ZeroBin encrypts everything in your browser before it reaches the server. The server never sees your content — by design, not by promise.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/runs%20on-Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/suminhthanh/zerobin)

## Features

- **Zero-knowledge encryption** — AES-256-GCM, keys never leave your browser
- **Burn after reading** — self-destructing messages, deleted on first view
- **Password protection** — optional additional password layer via PBKDF2
- **Discussion threads** — encrypted comments on pastes
- **File attachments** — drag & drop, encrypted alongside your text
- **Expiration control** — 5 min to forever
- **Rate limiting** — per-IP via Durable Objects
- **Serverless** — runs on Cloudflare's global edge network
- **No database server** — D1 (SQLite) + R2 object storage
- **Dark cyberpunk UI** — built with Svelte 5 + Tailwind CSS

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Svelte Frontend)                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Generate 256-bit key → PBKDF2 → AES-256-GCM      │  │
│  │ Encrypt plaintext → POST encrypted blob to API    │  │
│  │ Key stored in URL fragment (never sent to server) │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Workers (TypeScript API)                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │    D1    │  │    R2    │  │   Durable Objects     │ │
│  │ metadata │  │  blobs   │  │   rate limiting       │ │
│  └──────────┘  └──────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

The server stores only encrypted blobs. It cannot decrypt your data — it doesn't have the key.

## One-Click Deploy

Click the deploy button above to launch your own ZeroBin instance. The deploy system will:

1. Fork this repo to your GitHub account
2. Create a Cloudflare D1 database and R2 bucket
3. Build the frontend
4. Apply D1 migrations
5. Deploy the Worker

If an older deployment shows `D1_ERROR: no such table`, run the migration against the D1 binding once:

```bash
npm run db:migrate:prod
```

## Quick Start

### Prerequisites

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/suminhthanh/zerobin.git
cd zerobin
npm install
```

### 2. Automated Setup

Run the setup script to create all Cloudflare resources and deploy:

```bash
./setup.sh
```

Or do it manually:

### 2b. Manual Setup

```bash
# Authenticate
wrangler login

# Create D1 database
wrangler d1 create zerobin
# → Copy the database_id into wrangler.toml

# Create R2 bucket
wrangler r2 bucket create zerobin-pastes
```

### 3. Configure

Edit `wrangler.toml` and replace the empty `database_id` with your actual D1 database ID.

### 4. Run Locally

```bash
npm run db:migrate:local
npm run build
npm run dev
```

Visit `http://localhost:8787`

### 5. Deploy to Production

```bash
npm run deploy
```

`npm run deploy` builds the frontend, applies any pending remote D1 migrations through the `DB` binding, and deploys the Worker.

## Configuration

All settings are environment variables in `wrangler.toml` under `[vars]`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_NAME` | ZeroBin | Site title |
| `DISCUSSION` | true | Enable comment threads |
| `PASSWORD` | true | Enable password protection |
| `FILE_UPLOAD` | false | Enable file attachments |
| `PASTE_SIZE_LIMIT` | 10000000 | Max paste size in bytes (10 MB) |
| `TRAFFIC_LIMIT` | 10 | Seconds between creates per IP |
| `EXPIRE_DEFAULT` | 1week | Default expiration |
| `BURN_AFTER_READING_SELECTED` | false | Pre-select burn option |
| `COMPRESSION` | zlib | Compression mode (zlib/none) |

See `wrangler.toml` for the full list.

## Cost

ZeroBin is designed to be extremely cheap to run:

| Scale | Estimated Cost |
|-------|---------------|
| Personal use (< 1K pastes/month) | **$0** (free tier) |
| Small community (10K users/month) | **~$5/month** |
| 1M users/month (5M pastes) | **~$16/month** |

The main cost driver is Worker request invocations ($0.30/M after 10M free). D1 and R2 stay within free tier for most deployments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Svelte 5, Tailwind CSS 4, Vite |
| Backend | TypeScript, Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Blob Storage | Cloudflare R2 |
| Rate Limiting | Cloudflare Durable Objects |
| Scheduled Jobs | Cron Triggers |
| Encryption | Web Crypto API (AES-256-GCM, PBKDF2-SHA256) |

## Encryption Protocol

ZeroBin implements a zero-knowledge encryption protocol:

1. **Key generation**: 256-bit random key via `crypto.getRandomValues()`
2. **Key derivation**: PBKDF2-SHA256 with 100,000 iterations, 8-byte random salt
3. **Encryption**: AES-256-GCM with 16-byte IV, 128-bit auth tag
4. **Compression**: zlib deflate before encryption (optional)
5. **Key transport**: Base58-encoded in URL fragment (`#key`) — never sent to server
6. **Authenticated data**: `JSON.stringify(adata)` bound to ciphertext via GCM

The protocol is compatible with [PrivateBin](https://privatebin.info/) v2 format.

## Project Structure

```
├── src/                    # Worker backend (TypeScript)
│   ├── index.ts           # Router + fetch/scheduled handlers
│   ├── types.ts           # Env bindings, DB row types, API interfaces
│   ├── handlers/          # API route handlers
│   ├── storage/           # D1 + R2 data access
│   ├── rate-limiter/      # Durable Object for rate limiting
│   └── utils/             # Crypto, config, validation, hashing
├── frontend/              # Svelte frontend
│   ├── src/
│   │   ├── lib/           # Crypto, API client, compression
│   │   ├── stores/        # Svelte stores (app state)
│   │   └── components/    # UI components
│   └── public/            # Static assets
├── migrations/            # D1 SQL migrations
├── test/                  # Vitest test suite
└── wrangler.toml          # Cloudflare configuration
```

## API

The API is JSON-based. All requests require `X-Requested-With: JSONHttpRequest` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create paste or comment |
| GET | `/?pasteid=<id>` | Read paste |
| GET | `/?pasteid=<id>&deletetoken=<token>` | Delete paste |
| GET | `/?jsonld=<type>` | JSON-LD context |

See [API Documentation](docs/API.md) for full details.

## CLI

The `zerobin-cli` package lets you create, read, and delete encrypted pastes from the terminal:

```bash
echo "secret" | npx zerobin-cli create
npx zerobin-cli read "<url>"
npx zerobin-cli delete "<url>" <token>
```

Default server is `https://zerobin.cc`. Override with `--server` or `ZEROBIN_SERVER`. See [`cli/README.md`](cli/README.md) for full docs.

## Agent Skill

[`skills/zerobin/`](skills/zerobin/) is an agent skill that teaches AI agents how to use the CLI for end-to-end encrypted paste operations. Drop it into any skill-aware agent runtime.

## Testing

```bash
npm test
```

Tests use Vitest with `@cloudflare/vitest-pool-workers` for realistic Worker environment testing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Disclaimer

ZeroBin is provided "as is" without warranty of any kind. While the zero-knowledge architecture means the server cannot access your data, security depends on:

- Your browser's Web Crypto API implementation
- The secrecy of your URL (anyone with the link can decrypt)
- Your password strength (if password-protected)
- The integrity of the JavaScript served to your browser

ZeroBin is not a substitute for professional secure communication tools in high-risk scenarios. For life-or-death situations, use established tools like Signal or GPG.

**Do not use ZeroBin to store your only copy of important data.** Pastes expire and can be deleted.

## Credits

- Inspired by [PrivateBin](https://privatebin.info/) — the original zero-knowledge pastebin
- Encryption protocol based on the [PrivateBin v2 specification](https://github.com/PrivateBin/PrivateBin/wiki/API)
- Built on [Cloudflare Workers](https://workers.cloudflare.com/) infrastructure
- Frontend powered by [Svelte](https://svelte.dev/) and [Tailwind CSS](https://tailwindcss.com/)

## License

[Apache License 2.0](LICENSE)

```
Copyright 2026 suminhthanh and ZeroBin contributors

Licensed under the Apache License, Version 2.0
```
