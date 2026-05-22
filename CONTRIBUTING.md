# Contributing to ZeroBin

Thank you for your interest in contributing to ZeroBin!

## How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## Development Setup

```bash
# Clone the repo
git clone https://github.com/suminhthanh/zerobin.git
cd zerobin

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Run locally
npm run dev          # backend (Worker)
cd frontend && npm run dev  # frontend (Vite)
```

## Code Style

- TypeScript strict mode
- No comments unless explaining non-obvious "why"
- Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- Keep files under 200 lines where practical

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Include browser/environment info for frontend bugs

## Security

If you discover a security vulnerability, please report it privately via GitHub Security Advisories. Do NOT open a public issue.

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
