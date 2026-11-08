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
| M5b | Sync plans and shopping lists to the account | ✅ Built (2026-11-08) — needs a two-phone test |
| UI | Redesign: saffron + charcoal, food photos, Lucide icons, Fraunces | ✅ Done (2026-11-08) — browser-checked, phone check pending |
| M6a | Hardening, no paid accounts: accessibility, offline, own photo storage, privacy policy, release config | ✅ Built (2026-11-08) — two-phone sync test and on-device accessibility check pending |
| M6b | Store testing, needs paid accounts: Apple Developer + Play Console, hosted API and production email, EAS builds, TestFlight / Play internal testing (M4b can follow) | Pending |
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

## M5b — what exists

- Database: `PlanEntry` and `ShoppingList` replaced the unused M0 plan/list tables (migration
  `plan_and_list_sync`); records are keyed by user + phone-made id, with `changedAt` and `deleted`.
- API: `POST /v1/me/sync` (signed in, 1 MB body limit): newest change wins per record, device clocks
  capped at server time + 5 min, tombstones kept 60 days, plan days older than 30 days purged,
  caps of 1000 plan entries and 100 lists. Merge rules are pure functions (`modules/sync/merge.ts`)
  shared by the database repository and the test fake.
- App: change times and tombstones in the plan and list stores (stored-data upgrade from M5 tested),
  sync engine (one sync at a time, re-runs if something changed meanwhile), syncs on sign-in, app
  foreground and 2 s after each change, last sync before sign-out, status line with "Try again"
  in Profile. Anything planned before signing in moves into the account on the first sync.
- Tests: merge rules (API and app), engine (upload, second phone, deletions, offline, sign-out
  mid-request), routes (isolation, validation, large bodies), database round-trip and cascade
  (`pnpm --filter @food-suggest/api test:db`, now runs every `*.db.test.ts` one file at a time).
- **Not yet tested with a real account on two devices.**

## UI redesign — what changed

- Design tokens (`theme/tokens.ts`), shared components (Icon, IconButton, PressableScale, Button,
  Chip, Card, Badge, SearchField, SectionHeader, ListGroup/ListRow, Segmented, Stepper, EmptyState).
- Every screen restyled: Home, Discover (+ filter sheet), meal page, Saved meals, Plan (+ entry
  sheet, picker, Add to plan), Lists (+ list, options and edit sheets), Profile (+ Privacy, Photo
  credits), onboarding and sign-in.
- Photos for all 15 meals with credits (`prisma/seed/images.ts`; rerun `pnpm db:seed`).
- Checked in the browser at phone size in light and dark mode. Not yet checked on a device.

## M6a — what exists

- **Photos:** all 15 copied to a public Supabase Storage bucket `meal-photos`
  (`pnpm --filter @food-suggest/api photos:upload`, skips ones already there). With
  `MEAL_PHOTOS_BASE_URL` set the seed points meals at our copies; unused photo rows are removed.
- **Offline:** meal lists, meal pages, ingredients and picks are saved on the phone
  (`lib/query-persist.ts`: up to 80 queries, 7 days, versioned; account data never saved) and
  restored at start-up. NetInfo tells TanStack Query when the phone is offline, so cached screens
  stay up, uncached ones say "You're offline" and load on reconnect. Home and Discover show an
  offline banner. Actions (save a meal, make a list) fail straight away with a clear message.
  Sync waits while offline and runs as soon as the phone is back online.
- **Accessibility:** contrast test for every text colour pairing in both themes (WCAG AA,
  `theme/contrast.test.ts`); every button and field has a role and spoken label; text follows
  the phone's text size (big titles stop growing at 1.4 to 1.6x, other text at 2.5x); press
  animations respect Reduce Motion. Sign-in back buttons now use the readable saffron shade.
- **Privacy policy:** one source (`features/legal/privacy-policy.ts`) shown in the app (Profile,
  "Your data" page, sign-in consent) and as `docs/PRIVACY_POLICY.md` for the store listing; a
  test keeps them identical (`pnpm --filter @food-suggest/mobile policy:write` regenerates).
  Owner name and contact email are placeholders until M6b.
- **Release config:** app ID `com.agkay.foodsuggest` (iOS and Android), version 0.1.0, build 1,
  no non-exempt encryption, phone only; placeholder icon (Lucide soup bowl on saffron), adaptive
  and monochrome Android icons, light and dark splash; `eas.json` with preview and production.
- Checked in the browser at phone size: offline banner, offline meal page, reload on reconnect,
  privacy policy, photos from our storage.

### Still to do for M6a (needs your phone)

- **Two-phone sync test:** sign in on two devices (or phone + browser), plan a meal and tick a
  list item on one, confirm it appears on the other after reopening; delete on one, confirm it
  disappears; turn on airplane mode, make a change, turn it off, confirm it syncs.
- **On-device accessibility:** VoiceOver / TalkBack through each tab, and the largest text size
  (no Xcode on this Mac, so this couldn't be automated).

### M6b checklist (needs paid accounts)

- Fill in the policy owner and contact email, publish `docs/PRIVACY_POLICY.md` at a public URL.
- Host the API and Postgres; keep request logs no longer than 30 days (the policy says so).
- Production email for sign-in codes (replace Gmail SMTP).
- Apple Developer + Play Console, EAS builds, TestFlight / internal testing, privacy labels
  (Apple) and Data safety form (Play) using the policy.
- Crash reporting.

## Known gaps / to do

- Count-only shopping amounts show a bare number ("1" lemon); consider "1 ×" or units per item.

- Sync is whole-state per request (fine for one person's data); shopping lists merge as whole
  documents, so ticking items on two phones at the same moment keeps only the newer list.
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
- App icon is a placeholder (Lucide soup bowl); a designed icon would be better before launch.
- Re-check each photo's source page for licence changes before launch.
- Web is not a target; the native-tabs layout is not tuned for web.
