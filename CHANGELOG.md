# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-22

### Added

- Initial release of ZeroBin
- Zero-knowledge AES-256-GCM encryption (client-side)
- PBKDF2-SHA256 key derivation with 100,000 iterations
- Base58 key encoding in URL fragments
- Create, read, delete pastes via JSON API
- Burn-after-reading (self-destructing messages)
- Password protection for pastes
- Discussion threads with encrypted comments
- File attachment support (encrypted with paste)
- Configurable expiration (5 min to never)
- Per-IP rate limiting via Durable Objects
- Automatic expired paste purging via Cron Triggers
- Dark cyberpunk UI (Svelte 5 + Tailwind CSS 4)
- Responsive mobile-first design
- SEO optimized (Open Graph, Twitter Cards, JSON-LD)
- Full Cloudflare infrastructure (Workers, D1, R2, DO)
- Vitest test suite with Workers pool
- GitHub Actions CI/CD pipeline
- API compatible with PrivateBin v2 format
