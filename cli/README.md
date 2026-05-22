# zerobin-cli

A standalone CLI for [ZeroBin](https://zerobin.cc) and PrivateBin v2 instances. Encrypts content client-side with AES-256-GCM, uploads only ciphertext, and prints a share URL whose decryption key lives in the URL fragment.

Zero runtime dependencies. Node.js 18+.

## Install

Run via npx (no install):
```bash
npx zerobin-cli --help
```

Or install globally:
```bash
npm install -g zerobin-cli
zerobin --help
```

## Usage

```
zerobin create [options]              # Reads stdin or --file, prints share URL
zerobin read <url> [options]          # Decrypts and prints plaintext
zerobin delete <url> <token>          # Deletes a paste
```

### Create a paste

```bash
echo "secret note" | zerobin create
# → https://zerobin.cc/?abc123def4567890#3F4xK...
# stderr: Delete token: d7e694f8...
```

The share URL is printed to stdout, the delete token to stderr. Use `--json` for both in one structured payload:

```bash
echo "data" | zerobin create --json
```

### Read a paste

```bash
zerobin read "https://zerobin.cc/?abc...#key..."
```

### Delete a paste

```bash
zerobin delete "https://zerobin.cc/?abc...#key..." <deletetoken>
```

## Options

### Global

| Flag | Default | Description |
|------|---------|-------------|
| `--server <url>` | `$ZEROBIN_SERVER` or `https://zerobin.cc` | Target server |
| `--json` | off | Structured output |
| `--help` | | Show help |
| `--version` | | Print version |

### `create`

| Flag | Default | Description |
|------|---------|-------------|
| `--file <path>` | stdin | Read content from file |
| `--expire <when>` | `1week` | `5min` / `10min` / `1hour` / `1day` / `1week` / `1month` / `1year` / `never` |
| `--burn` | off | Self-destruct on first read |
| `--discussion` | off | Enable encrypted comments |
| `--password <pass>` | none | Add password protection |
| `--format <fmt>` | `plaintext` | `plaintext` / `syntaxhighlighting` / `markdown` |

### `read`

| Flag | Description |
|------|-------------|
| `--password <pass>` | Required if paste is password-protected |

## Configuration

| Env var | Effect |
|---------|--------|
| `ZEROBIN_SERVER` | Default server URL (overridden by `--server`) |

## Examples

**Burn-after-reading with custom expiry:**
```bash
echo "one-time secret" | zerobin create --burn --expire 1hour
```

**Pipe a command's output:**
```bash
git diff | zerobin create --format syntaxhighlighting
kubectl logs my-pod 2>&1 | zerobin create --expire 1hour
```

**Capture URL and delete token:**
```bash
result=$(echo "data" | zerobin create --json)
url=$(echo "$result" | jq -r .url)
token=$(echo "$result" | jq -r .deletetoken)
```

**Custom server:**
```bash
echo "internal" | zerobin create --server https://paste.example.com
```

## Security model

- A 256-bit key is generated locally with `crypto.getRandomValues` and Base58-encoded into the URL fragment. Browsers do not transmit URL fragments in HTTP requests, so the server never receives the key.
- Encryption uses AES-256-GCM with a key derived via PBKDF2-SHA256 (100,000 iterations). The `adata` array (cipher params, formatter, flags) is bound as authenticated additional data.
- Anyone with the full URL (including `#key`) can decrypt. Treat the URL like a password.
- `--password` adds a second factor: even if the URL leaks, the password is still required.
- `--burn` is best-effort: the server deletes after the first successful read, but a recipient could screenshot the result before the burn completes.

## Compatibility

Wire-compatible with the [PrivateBin v2 API](https://github.com/PrivateBin/PrivateBin/wiki/API). Pastes created with this CLI are readable in any PrivateBin or ZeroBin browser frontend, and vice versa.

## Development

```bash
npm install
npm run build
npm test
```

## License

Apache-2.0
