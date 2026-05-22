#!/usr/bin/env node
import { parseArgs } from "node:util";
import { runCreate } from "./commands/create.js";
import { runRead } from "./commands/read.js";
import { runDelete } from "./commands/delete.js";

const VERSION = "1.0.0";
const DEFAULT_SERVER = process.env.ZEROBIN_SERVER || "https://zerobin.cc";

const HELP = `zerobin ${VERSION} — zero-knowledge encrypted pastebin CLI

Usage:
  zerobin create [options]              Create a paste (reads stdin or --file)
  zerobin read <url> [options]          Read & decrypt a paste
  zerobin delete <url> <token>          Delete a paste

Global options:
  --server <url>      Server URL (default: $ZEROBIN_SERVER or ${DEFAULT_SERVER})
  --json              Output JSON instead of plain text
  --version           Print version and exit
  --help              Show this help

create options:
  --file <path>       Read content from file instead of stdin
  --expire <when>     5min, 10min, 1hour, 1day, 1week (default), 1month, 1year, never
  --burn              Burn after reading (paste deletes on first view)
  --discussion        Enable discussion threads
  --password <pass>   Password protect the paste
  --format <fmt>      plaintext (default), syntaxhighlighting, markdown

read options:
  --password <pass>   Password (if paste is protected)

Examples:
  echo "secret" | zerobin create
  zerobin create --file ./notes.md --burn --expire 1hour
  zerobin read "https://zerobin.cc/?abc...#key..."
  zerobin delete "https://zerobin.cc/?abc...#key..." <deletetoken>
`;

function fail(message: string, exitCode: number = 1): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(exitCode);
  throw new Error(message);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
    process.stdout.write(HELP);
    process.exit(0);
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    console.log(VERSION);
    process.exit(0);
  }

  const command = argv[0];
  const rest = argv.slice(1);

  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      server: { type: "string" },
      file: { type: "string" },
      expire: { type: "string", default: "1week" },
      burn: { type: "boolean", default: false },
      discussion: { type: "boolean", default: false },
      password: { type: "string", default: "" },
      format: { type: "string", default: "plaintext" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const server = (values.server as string | undefined) || DEFAULT_SERVER;

  try {
    switch (command) {
      case "create":
        await runCreate({
          server,
          expire: values.expire as string,
          burn: values.burn as boolean,
          discussion: values.discussion as boolean,
          password: values.password as string,
          format: values.format as string,
          file: values.file as string | undefined,
          json: values.json as boolean,
        });
        break;
      case "read": {
        const url = positionals[0];
        if (!url) fail("read requires a paste URL.\nUsage: zerobin read <url>");
        await runRead({
          url,
          password: values.password as string,
          json: values.json as boolean,
        });
        break;
      }
      case "delete": {
        const url = positionals[0];
        const token = positionals[1];
        if (!url || !token) {
          fail("delete requires a URL and a delete token.\nUsage: zerobin delete <url> <token>");
        }
        await runDelete({
          url,
          token,
          json: values.json as boolean,
        });
        break;
      }
      default:
        fail(`Unknown command: ${command}\nRun 'zerobin --help' for usage.`);
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

main();
