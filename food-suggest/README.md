# Food Suggest

Personalised food discovery, nutrition and meal planning, with Ghanaian and African
meals at the core alongside international cuisines.

## Repository layout

| Path | What it is |
|---|---|
| `apps/mobile` | Expo (SDK 58) + Expo Router + TypeScript app for iOS and Android |
| `apps/api` | Node + Express 5 + Prisma 7 + PostgreSQL API |
| `packages/shared` | Zod schemas, enums and types shared by app and API |
| `docs/` | Decisions, progress tracker, App Store review risks |

## Prerequisites

- Node 22+ (developed on Node 24)
- pnpm 11 (`corepack enable` or `npm i -g pnpm`)
- Python 3 (only for the one-off WAFCT data extraction; standard library only)

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
```

### Database (local, no install needed)

In its own terminal, start Prisma's local Postgres and leave it running:

```bash
pnpm --filter @food-suggest/api db:dev
```

If it prints different ports than `.env` has, copy its `DATABASE_URL` and
`SHADOW_DATABASE_URL` into `apps/api/.env`.

### Food data

1. Download the FAO WAFCT 2019 workbook (non-commercial licence, so it is not in git):
   https://www.fao.org/fileadmin/user_upload/faoweb/2020/WAFCT_2019.xlsx
2. Extract it and set up the database:

```bash
cd apps/api
pnpm wafct:extract /path/to/WAFCT_2019.xlsx
pnpm db:setup        # migrations + client + seed (15 meals, 50 ingredients)
```

USDA foods are already saved in `prisma/seed/data/fdc/` (public domain).

### Run

```bash
pnpm dev:api      # http://localhost:4000/v1/meals
pnpm dev:mobile   # Expo dev server
```

On a phone with Expo Go (same Wi-Fi as your Mac), the app finds the API automatically in
development. To point it elsewhere, create `apps/mobile/.env.local` with
`EXPO_PUBLIC_API_URL=http://<your-mac-ip>:4000`.

### API (so far)

| Route | What it does |
|---|---|
| `GET /v1/health` | Liveness check |
| `GET /v1/meals?q=&cuisine=&category=&slot=&diet=&maxMinutes=&limit=&offset=` | Meal cards with per-serving nutrition |
| `GET /v1/meals/:slug` | Full meal: variants, ingredients, steps, nutrition, sources |
| `GET /v1/cuisines`, `GET /v1/categories` | Filter options |

## Quality checks

```bash
pnpm check   # typecheck + lint + tests across all packages
```

Useful API scripts (run from `apps/api`): `pnpm db:validate`, `pnpm db:generate`,
`pnpm db:migrate`, `pnpm build`.

## Important rules

- Secrets (database, AI keys, API keys) live **only** in the API environment. Nothing
  secret goes in the mobile app or in git.
- Allergy and diet filtering is deterministic code, never AI.
- Nutrition values carry a source and a reliability label. Nothing is marked
  `VERIFIED` until a qualified reviewer signs it off.

See [docs/DECISIONS.md](docs/DECISIONS.md) and [docs/PROGRESS.md](docs/PROGRESS.md).
