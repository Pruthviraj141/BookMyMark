# Contributing to BookMyMark

Thank you for your interest in contributing to **BookMyMark**! We welcome bug reports, feature suggestions, documentation enhancements, and pull requests.

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please treat fellow maintainers and contributors with respect.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/BookMyMark.git
   cd BookMyMark
   ```
3. **Install dependencies** for both backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

## Development Guidelines

- **Architecture Consistency**: Maintain clean boundaries between routes, services, repositories, and models.
- **Strict Typing**: Use TypeScript types and schemas (Zod). Do not use `any`.
- **Security First**: Ensure zero credentials or API keys are committed. All metadata scraping must respect SSRF rules.
- **Testing**: Run tests before submitting changes:
  ```bash
  cd backend
  npm test
  ```

## Conventional Commits

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature
- `fix:` A bug fix
- `docs:` Documentation improvements
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring without changing behavior
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance, build scripts, or dependencies

## Submitting Pull Requests

1. Create a dedicated branch for your feature or bugfix (`git checkout -b feat/smart-search`).
2. Keep your commits logical and concise.
3. Push your branch to GitHub (`git push origin feat/smart-search`).
4. Open a Pull Request against the `main` branch with a clear description of the change.
