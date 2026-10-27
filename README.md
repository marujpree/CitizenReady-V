# CitizenReady

A free web app that helps immigrants prepare for the US naturalization test. It combines civics practice with AI grading, English reading and writing practice, and progress tracking.

## Stack

- **Frontend (`web/`)**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, React Hook Form and Zod
- **Backend (`api/`)**: Node.js, Express, TypeScript, Zod
- **Database and auth**: Supabase (Postgres, Auth, Row Level Security)
- **Tests**: Vitest, Supertest
- **CI**: GitHub Actions (lint, typecheck, test, build for both projects)

The browser only displays questions and sends raw answers. The API decides everything that affects a score.

## Requirements

- Node.js 22 or newer
- npm

## Run it locally

Install and configure each project:

```bash
cd api
npm install
cp .env.example .env    # then fill in real values

cd ../web
npm install
cp .env.example .env    # then fill in real values
```

Start both, in two terminals:

```bash
cd api && npm run dev   # http://localhost:3001  (try /health)
cd web && npm run dev   # http://localhost:5173
```

