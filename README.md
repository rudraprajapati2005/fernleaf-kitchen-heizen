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

## Environment variables

The applications use separate environment files.

### Backend: `apps/api/.env`

| Variable | Purpose | Local example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | NestJS API port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma | `postgresql://postgres:password@localhost:5432/kitchen?schema=public` |
| `WEB_ORIGIN` | Allowed browser origin for credentialed CORS | `http://localhost:3000` |
| `JWT_SECRET` | Secret used to sign authentication tokens; use at least 32 random characters | `replace-with-at-least-32-random-characters` |
| `JWT_EXPIRES_IN` | JWT lifetime | `15m` |

### Frontend: `apps/web/.env.local`

| Variable | Purpose | Local example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | HTTP base URL used by the browser to call the backend | `http://localhost:4000/api` |

`NEXT_PUBLIC_API_URL` is intentionally public because it is exposed to browser code. Do not put database credentials or `JWT_SECRET` in the frontend environment file.

For deployment, replace the backend `DATABASE_URL` with the provider connection string, set `WEB_ORIGIN` to the deployed frontend URL, and use a newly generated production `JWT_SECRET`.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

Business features are intentionally not implemented yet.
