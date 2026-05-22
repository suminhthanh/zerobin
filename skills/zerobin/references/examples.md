# ZeroBin Examples

Concrete commands and shell snippets for common scenarios.

## Basic create + read roundtrip

```bash
# Create
url=$(echo "hello world" | npx zerobin-cli create)
echo "$url"
# → https://zerobin.cc/?abc123def4567890#3F4xK7J9...

# Read
npx zerobin-cli read "$url"
# → hello world
```

## Create from a file

```bash
npx zerobin-cli create --file ./error.log --expire 1day
```

## Burn after reading

The paste deletes after the first successful read.

```bash
echo "one-time secret" | npx zerobin-cli create --burn
```

## Password protection

Recipient needs both the URL and the password.

```bash
echo "extra sensitive" | npx zerobin-cli create --password "correct horse battery staple"

# Read side
npx zerobin-cli read "<url>" --password "correct horse battery staple"
```

## JSON output (for scripts)

`--json` returns full metadata, including the delete token:

```bash
result=$(echo "data" | npx zerobin-cli create --json --expire 1hour)
echo "$result"
# {
#   "url": "https://zerobin.cc/?...",
#   "id": "...",
#   "deletetoken": "...",
#   "server": "https://zerobin.cc",
#   "key": "..."
# }
```

Parse with `jq`:

```bash
url=$(echo "$result" | jq -r .url)
token=$(echo "$result" | jq -r .deletetoken)
```

## Delete a paste

```bash
npx zerobin-cli delete "$url" "$token"
```

## Custom server

Override the default `https://zerobin.cc`:

```bash
echo "internal data" \
  | npx zerobin-cli create --server https://paste.example.com
```

Or set it once for the shell session:

```bash
export ZEROBIN_SERVER=https://paste.example.com
echo "hi" | npx zerobin-cli create
```

## Pipe a command's output

```bash
git diff | npx zerobin-cli create --format syntaxhighlighting --burn
```

```bash
kubectl logs my-pod 2>&1 | npx zerobin-cli create --expire 1hour
```

## Read into a variable

```bash
content=$(npx zerobin-cli read "<url>")
echo "$content" | grep ERROR
```

## Markdown notes with discussion enabled

```bash
cat <<'EOF' | npx zerobin-cli create --format markdown --discussion --expire 1week
# Project status

- Auth: in review
- Billing: blocked on legal
EOF
```

## Useful patterns for agents

**Share command output safely:**
```bash
some-command 2>&1 | npx zerobin-cli create --burn --expire 1hour
```

**Capture URL + token in one shot:**
```bash
read -r url token < <(
  echo "data" \
    | npx zerobin-cli create --json \
    | jq -r '.url + " " + .deletetoken'
)
```

**Read and pipe to another tool:**
```bash
npx zerobin-cli read "<url>" | jq .
```
