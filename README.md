# AKR - Land vs Real Estate Audit Platform

AKR is a B2G platform for municipalities to detect tax anomalies by cross-matching land cadastre and real estate registry data.

The system is designed for two user roles:
- Head/analyst (desktop dashboard): imports data, reviews anomalies, assigns tasks
- Inspector (mobile flow): receives a magic link, verifies anomalies in the field

## Quick Start

### 1) Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 15+ (or compatible)

### 2) Backend (NestJS)
```bash
cd backend
npm install
cp .env.example .env

# edit .env: DATABASE_URL, JWT_SECRET, PORT, etc.
npm run migrate:dev
npm run start:dev
```

Backend will run on `http://localhost:8080` by default.

Swagger is available at:
- `http://localhost:8080/api`

### 3) Frontend (React + Vite)
```bash
cd front
npm install
npm run dev
```

Frontend will run on Vite default port (usually `http://localhost:5173`).

### 4) Open the app
- Public landing: `/`
- Auth: `/login`, `/signup`
- Head dashboard: `/head/dashboard`

## What the Product Does

AKR compares two datasets:
- Land cadastre records
- Real estate records

It highlights mismatch categories such as:
- Land owner without a linked building
- Building owner without linked land data
- Expired ownership rights
- Area mismatch

Each anomaly can be prioritized, assigned to inspectors, and resolved through the mobile workflow.

## Repository Structure

```text
hackathon-main/
	backend/                 # NestJS API + Prisma
		src/
			import/              # ingestion + matching
			admin/               # head dashboard APIs
			mobile/              # inspector APIs
			recommendations/     # AI suggestions
		prisma/                # schema, migrations, seed

	front/                   # React app (Vite)
		src/
			pages/               # route pages
			features/            # domain slices
			components/          # shared UI
			lib/                 # API client, hooks, constants

	docker-compose.coolify.yml
	COOLIFY.md
```

## Local Development Workflow

### Backend useful scripts
```bash
cd backend
npm run start:dev
npm run build
npm run lint
npm run prisma:studio
npm run migrate:dev
npm run migrate:reset
```

### Frontend useful scripts
```bash
cd front
npm run dev
npm run build
npm run lint
npm run typecheck
npm run preview
```

## Environment Variables

### Backend (`backend/.env`)
Minimal required values:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (default `8080`)
- `EXPIRATION_TIME` (default `7d`)
- `GROQ_API_KEY` (if using AI recommendations)

### Frontend runtime
The frontend can read API URL from runtime env injection (`front/public/env.js` in Docker flow).

For production links (inspector magic links), project code supports:
- `VITE_APP_URL` (example: `https://akr.notfounds.dev`)
- `VITE_API_URL` (example: `https://api.notfounds.dev`)

## Coolify Deployment

This project includes a dedicated Coolify compose setup.

Use:
- `docker-compose.coolify.yml`
- `.env.coolify.example`
- `COOLIFY.md`

High-level flow:
1. Set up app in Coolify with compose path `docker-compose.coolify.yml`
2. Configure env vars from `.env.coolify.example`
3. Set backend and frontend domains in Coolify UI
4. Deploy

## API Surface (high-level)

Main groups used by frontend:
- Auth
- Import
- Admin dashboard and anomalies
- Inspector task flow (magic link + task resolve)
- Recommendations

For exact contracts, use Swagger:
- `/api` on the running backend instance

## Troubleshooting

### Frontend cannot call backend
- Check backend is running on expected URL/port
- Check CORS origins in backend bootstrap config
- Confirm `VITE_API_URL` or runtime env is correct in production

### Magic links contain wrong domain
- Set `VITE_APP_URL` in frontend environment to your public domain

### Prisma errors on startup
- Verify `DATABASE_URL`
- Run migrations:
```bash
cd backend
npm run migrate:dev
```

### Build fails on TypeScript unused variables
- Run lint/typecheck and remove stale imports/unused params

## Tech Stack

Backend:
- NestJS 11
- Prisma 7
- PostgreSQL
- Passport JWT
- Swagger

Frontend:
- React 19
- Vite 7
- TypeScript
- Tailwind CSS v4
- TanStack Query
- Zustand
- Recharts

## License

Proprietary.
