#!/bin/bash
# Verify that zerobin-cli is reachable via npx.
# Exits 0 if available, 1 if not.

set -e

if command -v node >/dev/null 2>&1; then
  node_version=$(node --version | sed 's/^v//' | cut -d. -f1)
  if [ "$node_version" -lt 18 ]; then
    echo "zerobin-cli requires Node.js 18+. Found: $(node --version)" >&2
    echo "Upgrade Node.js: https://nodejs.org/" >&2
    exit 1
  fi
else
  echo "Node.js is not installed." >&2
  echo "Install Node.js 18+ from https://nodejs.org/" >&2
  exit 1
fi

if npx --no-install zerobin-cli --version >/dev/null 2>&1; then
  version=$(npx --no-install zerobin-cli --version)
  echo "zerobin-cli is available (version $version)"
  exit 0
fi

echo "zerobin-cli is not installed locally."
echo "It can be invoked via 'npx zerobin-cli ...' (downloads on first use)"
echo "Or install globally: npm install -g zerobin-cli"
exit 0
