# Fernleaf Kitchen

Production-ready monorepo foundation for a kitchen operations admin panel.

## Applications

- `apps/web` - Next.js dashboard frontend. It communicates with the API over HTTP.
- `apps/api` - NestJS backend with Prisma ORM and PostgreSQL.

## Requirements

- Node.js 20.11+
- npm 10+
- PostgreSQL database

## Getting started

```bash
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
npm run dev
```

The frontend runs on `http://localhost:3000` and the API runs on `http://localhost:4000`.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

Business features are intentionally not implemented yet.
