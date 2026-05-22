---
name: zerobin
description: Create, read, and delete zero-knowledge encrypted pastes on ZeroBin or PrivateBin v2 instances. Use when the user wants to share sensitive text, code snippets, secrets, logs, or temporary data with end-to-end encryption — the server never sees plaintext. Triggers on requests like "share this securely", "encrypt and paste", "create a private paste", "burn after reading", or any mention of zerobin, privatebin, or encrypted pastebin.
license: Apache-2.0
compatibility: Requires Node.js 18+ to run the zerobin CLI via npx. Default server is https://zerobin.cc but any PrivateBin v2 compatible instance works.
metadata:
  author: zerobin
  version: "1.0"
---

# ZeroBin

Encrypt content client-side with AES-256-GCM, upload only ciphertext, and share a URL whose decryption key lives in the URL fragment (never sent to the server). The recipient pastes the URL — the browser or CLI decrypts locally.

## Quick reference

| Goal | Command |
|------|---------|
| Create a paste | `echo "secret" \| npx zerobin-cli create` |
| Create from file | `npx zerobin-cli create --file ./notes.md` |
| Read a paste | `npx zerobin-cli read "<url>"` |
| Delete a paste | `npx zerobin-cli delete "<url>" <deletetoken>` |

The default server is `https://zerobin.cc`. Override with `--server <url>` or set `ZEROBIN_SERVER`.

## Prerequisites

Verify the CLI is reachable before running operations:

```bash
npx zerobin-cli --version
```

If that fails with "command not found" or a registry error, run `scripts/zerobin-check.sh` for a friendly install hint, or instruct the user to install Node.js 18+ and retry.

## Create a paste

The CLI reads plaintext from stdin (preferred) or a file. It generates a random 256-bit key, encrypts locally, uploads only ciphertext, and prints the share URL.

**From stdin:**
```bash
echo "my secret note" | npx zerobin-cli create
# → https://zerobin.cc/?abc123def4567890#3F4xK...
```

**From a file:**
```bash
npx zerobin-cli create --file ./secrets.txt
```

**Common options:**
- `--burn` — paste self-destructs on first read
- `--password <pass>` — adds a second factor (recipient also needs the password)
- `--expire <when>` — `5min`, `10min`, `1hour`, `1day`, `1week` (default), `1month`, `1year`, `never`
- `--discussion` — allow encrypted comments
- `--format <fmt>` — `plaintext` (default), `syntaxhighlighting`, `markdown`
- `--server <url>` — target a different ZeroBin/PrivateBin instance
- `--json` — emit `{ url, id, deletetoken, server, key }` instead of just the URL

**Important:** `create` writes the share URL to stdout and the delete token to stderr. If the user wants to delete the paste later, capture both:

```bash
output=$(echo "data" | npx zerobin-cli create --json)
url=$(echo "$output" | jq -r .url)
token=$(echo "$output" | jq -r .deletetoken)
```

## Read a paste

The decryption key lives in the URL fragment (`#...`). Always quote URLs in shell so the fragment is preserved:

```bash
npx zerobin-cli read "https://zerobin.cc/?abc123def4567890#3F4xK..."
```

If the paste is password-protected, pass `--password`. If the paste was created with `--burn`, the first read deletes it server-side.

## Delete a paste

Requires the original URL and the delete token captured at creation time:

```bash
npx zerobin-cli delete "https://zerobin.cc/?abc...#key..." <deletetoken>
```

## Configuration

| Variable | Effect |
|----------|--------|
| `ZEROBIN_SERVER` | Default server URL (overridden by `--server`) |

## Security notes

- The decryption key is generated locally and never transmitted to the server. It travels in the URL fragment, which browsers do not include in HTTP requests.
- Anyone with the full URL (including `#key`) can decrypt the paste. Treat the share URL like a password.
- `--password` adds a layer beyond the URL key. Useful when the URL might be observed (e.g., shoulder-surfing a chat log).
- `--burn` is best-effort: the server deletes after the first successful read, but the recipient could screenshot the result before the burn completes.

## Error handling

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Paste not found or expired` | Burn-after-reading already triggered, expired, or wrong ID | Confirm the URL; pastes cannot be recovered after expiry |
| `Invalid base58 character` | URL fragment was mangled or unquoted | Re-paste the full URL inside quotes |
| `URL is missing decryption key fragment` | The `#...` portion was stripped | Ensure the entire URL including the hash was preserved |
| `400` / `Invalid data` | Server rejected payload (size, format) | Check paste size limit; default cap is 10 MB |
| Network/DNS error | Server unreachable | Verify `--server` value or network |

## When NOT to use

- Storing the only copy of important data — pastes expire and can be deleted by anyone with the URL.
- Compliance scenarios requiring audit logs of who accessed data — the server has no view into reads.
- Real-time secure messaging — Signal or similar tools are the right shape for that.

## See also

- `references/api-reference.md` — raw HTTP API for agents that prefer not to use the CLI
- `references/examples.md` — runnable example commands and shell snippets
