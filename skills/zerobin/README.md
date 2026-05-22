# zerobin skill

A skill that teaches AI agents how to create, read, and delete zero-knowledge encrypted pastes on [ZeroBin](https://zerobin.cc) or any PrivateBin v2 instance.

The agent runs the [`zerobin-cli`](../../cli) command-line tool, which encrypts content client-side with AES-256-GCM. The server only ever sees ciphertext — the decryption key lives in the URL fragment and never leaves the local machine.

## What's in this skill

```
zerobin/
├── SKILL.md                    # Metadata + instructions loaded by the agent
├── scripts/
│   └── zerobin-check.sh        # Verifies Node.js 18+ and CLI availability
└── references/
    ├── api-reference.md        # Raw HTTP API for agents skipping the CLI
    └── examples.md             # Runnable shell snippets
```

## Install

### Option A — global skill directory

Most agent runtimes look for skills in a configured directory (e.g. `~/.claude/skills/`, `~/.config/agent/skills/`, or similar). Copy or symlink this folder there:

```bash
# Copy
cp -r skills/zerobin ~/.claude/skills/

# Or symlink (preferred — picks up updates automatically)
ln -s "$(pwd)/skills/zerobin" ~/.claude/skills/zerobin
```

### Option B — project-local skill directory

Some agents auto-discover skills under `./.claude/skills/` or `./skills/` in the active workspace. In that case, this folder is already in the right place when you clone the repo.

### Option C — manual point at the folder

If your agent supports loading skills by path, point it at:

```
/absolute/path/to/zerobin/skills/zerobin
```

After install, restart the agent so it picks up the new skill metadata.

## Prerequisite — install the CLI

The skill calls `zerobin-cli`. Two ways to make it reachable:

```bash
# Run on demand via npx (no install — first run downloads it)
npx zerobin-cli --version

# Or install globally
npm install -g zerobin-cli
zerobin --version
```

Both require Node.js 18 or newer.

Run the bundled health check to confirm everything is in place:

```bash
bash skills/zerobin/scripts/zerobin-check.sh
```

## Use

Once the skill is installed, just ask the agent in plain language. It will recognize the intent and call the CLI on your behalf. Examples of phrases that trigger the skill:

- "Share this log securely"
- "Create a private paste with this snippet"
- "Encrypt these notes and give me a one-time link"
- "Burn-after-reading paste of this config"
- "Delete the paste I created earlier"

The agent will:

1. Run `npx zerobin-cli create` (with appropriate flags like `--burn`, `--password`, `--expire`)
2. Capture the share URL and delete token
3. Hand them back to you

For reads:

```
Decrypt https://zerobin.cc/?abc...#key...
```

The agent runs `npx zerobin-cli read "<url>"` and shows the plaintext.

## Configuration

| Env var | Effect |
|---------|--------|
| `ZEROBIN_SERVER` | Default server URL (overridden by `--server`). Defaults to `https://zerobin.cc`. |

Set in your shell profile if you self-host:

```bash
export ZEROBIN_SERVER=https://paste.example.com
```

## Compatibility

- Requires Node.js 18+ for `npx zerobin-cli`
- Wire-compatible with PrivateBin v2 — works with any PrivateBin or ZeroBin instance, not just `zerobin.cc`

## Files at a glance

| File | Purpose |
|------|---------|
| [`SKILL.md`](SKILL.md) | Frontmatter + instructions the agent reads on activation |
| [`scripts/zerobin-check.sh`](scripts/zerobin-check.sh) | Pre-flight check for Node version + CLI |
| [`references/api-reference.md`](references/api-reference.md) | Raw API spec for agents that prefer HTTP over CLI |
| [`references/examples.md`](references/examples.md) | Concrete create/read/delete shell snippets |

## License

Apache-2.0
