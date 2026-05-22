#!/usr/bin/env bash
set -euo pipefail

echo "ZeroBin Setup"
echo "============="
echo ""

if ! command -v npx &>/dev/null; then
  echo "Error: Node.js is required. Install it from https://nodejs.org"
  exit 1
fi

if ! npx wrangler whoami &>/dev/null; then
  echo "Not logged in to Cloudflare. Running wrangler login..."
  npx wrangler login
fi

echo ""
echo "Creating D1 database 'zerobin'..."
DB_OUTPUT=$(npx wrangler d1 create zerobin 2>&1) || true
echo "$DB_OUTPUT"

DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2 || true)

if [ -z "$DB_ID" ]; then
  echo ""
  echo "Could not auto-detect database_id from output."
  echo "If the database already exists, find the ID with: npx wrangler d1 list"
  echo ""
  read -rp "Enter database_id: " DB_ID
fi

if [ -n "$DB_ID" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml
  else
    sed -i "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml
  fi
  echo "Patched wrangler.toml with database_id = \"$DB_ID\""
fi

echo ""
echo "Creating R2 bucket 'zerobin-pastes'..."
npx wrangler r2 bucket create zerobin-pastes 2>/dev/null || echo "Bucket may already exist, continuing."

echo ""
echo "Running D1 migrations..."
npx wrangler d1 migrations apply DB --remote

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Building frontend..."
npm run build

echo ""
echo "Deploying Worker..."
npx wrangler deploy

echo ""
echo "Done! Your ZeroBin instance is live."
