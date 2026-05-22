# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ZeroBin, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Use [GitHub Security Advisories](../../security/advisories/new) to report privately
3. Or email: security@webpilot.cc

## What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix**: Within 30 days for critical issues

## Scope

The following are in scope:
- Server-side vulnerabilities in the Worker code
- Client-side encryption/decryption flaws
- Authentication/authorization bypasses
- Data leakage (encryption key exposure, plaintext leaks)
- Rate limiting bypasses

The following are out of scope:
- Denial of service (Cloudflare handles this)
- Social engineering
- Issues in third-party dependencies (report upstream)

## Architecture Notes

ZeroBin uses a zero-knowledge architecture:
- All encryption/decryption happens client-side (AES-256-GCM)
- The encryption key is in the URL fragment (never sent to the server)
- The server only stores encrypted blobs
- PBKDF2-SHA256 with 100,000 iterations for key derivation

The server cannot decrypt any stored data by design.
