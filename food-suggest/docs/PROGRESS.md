# Progress

## Milestones

| | Milestone | Status |
|---|---|---|
| M0 | Foundations: monorepo, design tokens, tabs, API skeleton, schema, docs | ✅ Done (2026-11-07) |
| M1 | Content: ingredient import (WAFCT + USDA), seed meals, nutrition calculator | ✅ Done (2026-11-07) |
| M2 | Discovery: search, filters, meal details, loading/empty/error states | ✅ Done (2026-11-07) |
| M3 | Onboarding + rule-based recommendations, allergy test suite | ✅ Done (2026-11-07) |
| M4 | Auth (email code), consent, claim local data, favourites, account deletion | ✅ Done (2026-11-08) — email sign-in tested on a phone |
| M4b | Sign in with Apple + Google (development build, Apple Developer account, Google Cloud) | Pending |
| M5 | Meal planning + shopping lists (on the phone) | ✅ Done (2026-11-08) |
| M5b | Sync plans and shopping lists to the account | ⏳ Next |
| M6 | Hardening: accessibility, offline, privacy policy, TestFlight / Play testing | Pending |
| v1.1 | AI explanations and alternatives (Groq) | Pending |

## M0 — what exists

- `packages/shared`: enums, `ProfileInput` schema (16+ age gate), API error/health schemas. Tests.
- `apps/api`: Express 5 app factory, env validation, pino logging with redaction, helmet,
  rate limiting, 404 + error handler, `validateBody` middleware, `GET /v1/health`.
  Tests (Vitest + Supertest), ESLint, tsup production build.
- `apps/api/prisma/schema.prisma`: full MVP schema (validated, client generates).
  **No migration yet** — needs a database (M1).
- `apps/mobile`: five native tabs (Home, Discover, Plan, Lists, Profile), design tokens
  for light/dark, `AppText`, `Button`, `Card`, `Screen`, `EmptyState`.

## M1 — what exists

- Local Postgres via `prisma dev`; two migrations (`init`, `source_match_and_review`).
- Nutrition calculator (`modules/nutrition/calculator.ts`) with strict accuracy rules. Tests.
- USDA FDC client (`integrations/fdc/client.ts`), server-only, tested; salmon snapshot committed.
- WAFCT extractor (`scripts/extract_wafct.py`, stdlib only) → git-ignored local JSON.
- Seed: 2 sources, 2 cuisines, 9 categories, 50 ingredients (allergen + diet tags,
  source codes, match quality), 15 meals / 16 variants (11 Ghanaian, 4 international),
  all with calculated per-serving nutrition.
- Diet/allergen derivation (`modules/meals/derive.ts`). Tests.
- Public read-only API: `GET /v1/meals` (search + filters), `GET /v1/meals/:slug`,
  `GET /v1/cuisines`, `GET /v1/categories`. Route tests with a fake repository; manually
  verified against the seeded database.

## M2 — what exists

- Home: greeting, popular meals, breakfast ideas, recently viewed, "Browse all meals".
- Discover: search (debounced), filters for meal type, diet, time and cuisine, result count,
  skeleton loading, empty state with "Clear filters", error state with retry, pull to refresh.
- Meal detail: name and local names, badges, version switcher, time/servings/difficulty,
  allergen notice (optional extras, brand-dependent warning), per-serving nutrition with
  opt-in calories, ingredients, numbered method, "About this recipe" (draft status, sources,
  close/proxy notes, disclaimer).
- Mobile tests (jest-expo + Testing Library): formatting, API client errors and timeouts,
  host parsing, recent-meals store, nutrition panel and allergen notice.
- Checked in a browser (Expo web, phone-sized): Home, Discover filters and search, detail
  version switching, back navigation, error and retry.

## M3 — what exists

- API: `POST /v1/recommendations` (anonymous, profile in body, 30/min), `GET /v1/ingredients`.
- Engine with hard safety filters, goal scoring, reasons and cautions; 40 engine tests incl.
  14 allergens × all seed meals and 4 diets.
- App: optional onboarding (welcome, birth year, goal, diet, allergies, cuisines + foods to avoid,
  cooking time + skill), "Picked for you" on Home with reasons and cautions, Profile summary with
  per-answer Edit, calories switch and "Clear my data from this phone".
- Checked in the browser at phone size: full onboarding, picks for a vegetarian with a fish
  allergy (shito caution shown), profile editing, under-16 block clearing the profile.

## M4 — what exists

- API: `requireAuth` (Supabase JWKS), `/v1/me` (account), `/v1/me/consents`, `/v1/me/profile`
  (PUT/DELETE), `/v1/me/claim`, `/v1/me/favorites` (GET/PUT/DELETE), `DELETE /v1/me`; 60/min limit.
- Tests: token verification (issuer, audience, expiry, anonymous, role, foreign key, unsigned),
  routes incl. consent, claim, isolation between users, deletion order and retry; database tests
  for profile round-trip, isolation and cascade deletion (`pnpm --filter @food-suggest/api test:db`).
- App: email → code → consent → done flow, encrypted session storage, profile sync after consent,
  Save meal button, Saved meals screen, Account card (sync on/off, sign out, delete account).
- Tested on a phone (Expo Go) against the real Supabase project on 2026-11-08: email code,
  consent, and claiming the phone's answers into the account. Email goes through Gmail SMTP (dev
  only; production needs a domain sender). The code screen submits automatically on the 6th digit
  (the number pad has no return key); Supabase's "Email OTP length" must stay 6.

## M5 — what exists

- Shared: unit families (mass / volume / count), `formatAmount` (always rounds up), request
  schema, aisle order. Tests.
- API: `POST /v1/shopping-list` (stateless, 30/min) scales each recipe to the planned servings,
  adds the same ingredient only within one unit family (unknown units only when identical),
  folds "to taste" into a measured line, flags optional-only items, groups by aisle. Tests cover
  every seed meal.
- App: Plan tab (week strip, four meals a day, add / replace / remove, servings, day nutrition for
  one person), "Add to plan" on meal pages, meal picker, Today's plan on Home, Lists tab, shopping
  list screen (tick off, add / edit / remove items, update from plan keeping ticks, rename,
  delete). Plans and lists are stored on the phone and cleared with "Clear my data".
- Checked in the browser at phone size: adding from the planner and from a meal page, servings,
  day nutrition, making a list, ticking, adding an item, updating from the plan, Home card.

## Known gaps / to do

- Plans and lists aren't synced to the account yet (M5b). Signing out clears them from the phone.
- Shopping amounts come from draft recipes (see recipe review below); buying units (e.g. "1 tin of
  tomato paste") aren't modelled.

- Liked/disliked ingredients are supported by the engine but not yet asked in onboarding.
- Recommendation thresholds need nutritionist review.
- Typed routes (`.expo/types`) are generated by `expo start`; a fresh clone needs one
  `expo start` (or `npx expo customize`) before `tsc` knows new routes. Address in CI setup.


- **Launch blocker:** request a commercial licence for WAFCT 2019 from FAO, or move to USDA equivalents.
- All 15 recipes need review by a cook / nutritionist (`recipeReviewed = false`).
- Shito and waakye leaves have no composition data (both optional, excluded from totals).
- Curry powder and stock cubes: allergen content is brand-dependent (`allergensReviewed = false`).
- No meal images yet (`imageUrl` is null).
- No database integration tests yet (repository is exercised manually); add a test database in M3.
- Mobile unit tests (jest-expo + React Native Testing Library) — set up with the first
  real logic in M2.
- App icon and splash are still Expo placeholders; need brand assets.
- iOS bundle identifier / Android package name not set yet — choose before the first EAS build.
- Web is not a target; the native-tabs layout is not tuned for web.
