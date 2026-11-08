# Decisions log

Newest first. Each entry: what we decided, why, and what would make us revisit it.

## 2026-11-08 — Milestone 5 (meal planning + shopping lists)

- **Plans and lists live on the phone first** (persisted Zustand), for anonymous and signed-in
  users alike. Account sync is split into **M5b** so this milestone stays shippable; the server
  tables (`MealPlan`, `ShoppingList`) already exist.
- **Shopping lists are built by the API, statelessly** (`POST /v1/shopping-list` with slugs and
  servings): the ingredient data lives there, and nothing personal is stored or logged.
- **Unit rules:** quantities are added only within one family: mass (g, kg), volume (tsp, tbsp,
  cup, ml, l) or count (piece). Unknown units are added only when identical. **No conversions
  between families** (e.g. tbsp → g) — that needs per-ingredient densities and would silently
  produce wrong amounts. "To taste" lines are dropped when a measured line exists for the same
  ingredient. Amounts are **rounded up** for display so nobody comes home short.
- **Servings scale the shopping list only.** Day nutrition is for one person eating one portion
  of each planned meal (cooking for four doesn't mean eating four portions). Calories in the day
  summary follow the calories setting.
- **Plan dates are local "YYYY-MM-DD" strings**, never timestamps, so a Monday meal stays on Monday
  across time zones and clock changes. Weeks start on Monday. Past days are dropped after 14 days.
- **One list per plan range:** making a list again for the same days updates it, keeping ticks
  for lines that are still needed and every item the user added.
- Optional ingredients (e.g. shito) are on the list, marked "Optional", unless any meal needs them.

## 2026-11-07 — Milestone 4 (accounts)

- **Email 6-digit code sign-in via Supabase Auth** in this milestone (works in Expo Go).
  **Apple and Google moved to M4b**: Google needs a development build and Google Cloud setup, Apple
  needs an Apple Developer account, and App Review 4.8 requires Apple sign-in whenever Google is
  offered, so they ship together.
- **Token verification in our API** with `jose` against the project's JWKS: issuer
  `${SUPABASE_URL}/auth/v1`, audience `authenticated`, ES256/RS256 only, role `authenticated`,
  UUID `sub`, anonymous Supabase users rejected. The secret key is used only for deleting users.
- **Session storage on the phone:** Supabase's "LargeSecureStore" pattern. A fresh AES-256 key
  per write lives in SecureStore (Keychain/Keystore), the AES-CTR ciphertext in AsyncStorage.
  Random bytes come from `expo-crypto` (in Expo Go) instead of `react-native-get-random-values`.
- **Explicit consent before storing health-related data** (`Consent`, versioned with
  `HEALTH_DATA_CONSENT_VERSION`). Without consent, an account still works for saved meals, but the
  profile stays on the phone. Withdrawing consent deletes the stored profile.
- **Claiming:** after sign-in, an account without a profile receives the phone's answers; an account
  that already has one wins and is copied to the phone (simple and predictable across devices).
- **Every `/v1/me` route takes the user id from the verified token only**; strict schemas reject
  smuggled fields. Data isolation is tested in-memory and against the real database (`pnpm test:db`).
- **Account deletion** (App Review 5.1.1(v)): delete all rows (cascades), then the Supabase auth
  user; failures return an error so the user can retry. Sign-out and deletion also clear this
  phone's personal data.
- Account routes are mounted only when `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are set; the app hides
  sign-in when `EXPO_PUBLIC_SUPABASE_*` are missing. Both keep working in anonymous mode.

## 2026-11-07 — Milestone 3 (onboarding + recommendations)

- **Onboarding is optional and on-device.** Home invites the user; nothing is forced. Answers live
  in a persisted Zustand store on the phone and are sent in the body of
  `POST /v1/recommendations` for that request only; the API never stores or logs them.
  POST keeps health data out of URLs, logs and caches.
- **Only what M3 needs is collected:** birth year (age gate), goal, diet, allergies, cuisines,
  foods to avoid, cooking time and skill. Height, weight, sex and activity are deferred until
  calorie targets exist (data minimisation).
- **Age:** under-16 entry shows a friendly block and *clears any saved profile*. 16–17 year olds who
  pick weight loss get "eat healthier" ranking and a note instead.
- **Engine (`modules/recommendations/engine.ts`), in order:**
  1. Hard filters: declared allergens; any meal with brand-dependent allergen info if the user has
     *any* allergy (fail closed); diet; avoided ingredients; max cooking time; slot.
  2. Optional extras that conflict (e.g. shito with a fish allergy) keep the meal but add a caution.
  3. Score = 40 + goal points (protein, energy, fibre, sodium heuristics in `THRESHOLDS`) +
     liked cuisine/ingredients − disliked ingredients − skill mismatch + quick/slot bonuses, clamped 0–100.
  4. Up to 3 reasons from the largest positive contributions, built from real per-serving values.
     Calories appear in reasons only when the user turned calories on.
  Thresholds are ranking heuristics, not dietetic targets; review with a nutritionist.
- **Allergy test suite** runs every allergen and every diet against the real seed recipes
  (built from seed files, so it needs no database or licensed data).
- **Stricter rate limit** on recommendations: 30 requests/minute per IP.
- Profile food preferences use public **slugs** (ingredients, cuisines), not database IDs.
- Zustand selectors must not return a fresh `[]` (infinite re-render in Zustand 5): use
  module-level empty constants.

## 2026-11-07 — Milestone 2 (discovery)

- **Navigation:** root `Stack` in `app/_layout.tsx`; the five native tabs live in the
  `app/(tabs)/` group; `app/meal/[slug].tsx` is pushed over the tabs.
- **Server data with TanStack Query** (5-minute stale time, 2 retries only for network/5xx/429),
  **device-only state with Zustand** persisted to AsyncStorage: the calories preference
  (off by default) and recently viewed meals. Neither leaves the device.
- **API address:** `EXPO_PUBLIC_API_URL` (e.g. in `apps/mobile/.env.local`). In development
  only, it falls back to the Expo dev server's host on port 4000, so Expo Go on a phone on
  the same Wi-Fi reaches the API with no setup. Production builds must set the variable.
- **Search field instead of the native header search bar:** simpler, identical on iOS and
  Android, no nested stack per tab. Revisit for iOS polish.
- **Navigation from cards uses `router.push`, not `<Link asChild>`:** `Link` dropped the
  pressed-state style on web, breaking the card layout.
- **Request timeout built with `AbortController`:** `AbortSignal.timeout/any` are not
  guaranteed in React Native.
- **Image placeholders** (tinted block with initials, hidden from screen readers) until
  licensed food photography exists.
- **Development-only CORS** on the API for `http://localhost:8081` (Expo web), so screens
  can be checked in a browser. Native apps don't use CORS; production allows no origins.
- **TypeScript 6** no longer includes all `@types/*` automatically: `apps/mobile/tsconfig.json`
  lists `"types": ["jest"]`.
- Expo web uses `"output": "single"` (no server rendering); web is a preview tool, not a target.

## 2026-11-07 — Milestone 1 (content)

- **Nutrition sources.** WAFCT 2019 (FAO/INFOODS) for West African foods; USDA FoodData
  Central for foods WAFCT lacks (so far: salmon). Nutrient numbers are never typed by hand:
  every ingredient points at a source code and the seed reads the values from the source.
- **WAFCT licence = non-commercial only** (stated in the workbook's introduction sheet).
  Commercial use needs a licence from FAO (www.fao.org/contact-us/licence-request,
  copyright@fao.org). Consequences: the extracted data is git-ignored
  (`wafct.local.json`), `NutritionSource.commercialUseCleared` is `false` for WAFCT, and
  this is a **launch blocker** (docs/APP_STORE_RISKS.md). Fallback if FAO says no: replace
  each WAFCT reference with a USDA FDC equivalent; the schema supports that per ingredient.
- **USDA FDC snapshots are committed** (`prisma/seed/data/fdc/*.json`, CC0) so seeding is
  deterministic and needs no API key. `pnpm fdc:fetch` downloads new ones.
- **Source match quality** on every ingredient: EXACT / CLOSE / PROXY, with a note for
  CLOSE and PROXY, returned by the API so the app can be transparent. Example: banku uses
  cooked fermented maize dough as a PROXY (no banku entry exists in WAFCT).
- **Calculation method:** per-serving nutrition = Σ(ingredient raw edible grams × per-100 g
  values) ÷ servings. Ignores cooking losses and water; always labelled `ESTIMATED`.
  Missing core data fails the calculation; missing secondary nutrients become `null`,
  never a silently low number. WAFCT values in [brackets] (lower quality) are used but
  recorded during extraction.
- **Recipes are drafts** (`MealVariant.recipeReviewed = false`) written by the Food Suggest
  team with typical home quantities. They need review by a Ghanaian cook / nutritionist.
- **Diet and allergens are derived, not stored per meal**: diet = least plant-based
  required ingredient; allergens = union over ingredients, with optional-only allergens
  (e.g. shito on waakye) listed separately. Any ingredient with brand-dependent allergens
  (curry powder, stock cubes) makes `allergenInfoComplete = false`, shown on cards and
  details. This module (`modules/meals/derive.ts`) will drive M3 filtering.
- **Local database:** `prisma dev` (Prisma's built-in local Postgres) instead of Docker or
  Supabase during M1–M3. Switching is a `DATABASE_URL` change.
- **Prisma 7 notes:** `migrate dev` no longer runs `generate` — use `pnpm db:setup` or run
  `pnpm db:generate` after schema changes. The generated client imports `.ts` files, so the
  API tsconfig has `allowImportingTsExtensions`.

## 2026-11-07 — Milestone 0

### Product decisions (from the owner)
- **Anonymous users** browse and get recommendations with an on-device profile. They can
  draft meal plans and shopping lists locally; signing up syncs them via `POST /me/claim`.
  Anonymous health data is never stored on the server.
- **Sign-in:** email (6-digit one-time code), Sign in with Apple, Google — via Supabase Auth.
  Apple sign-in is included because offering Google requires an equivalent option (App
  Review Guideline 4.8).
- **Minimum age 16.** 16–17 year olds get no weight-loss calorie targets. We collect birth
  *year* only (data minimisation) and assume the birthday hasn't happened yet, so gates
  are conservative.
- **Calories hidden by default** (`showCalories = false`); recommendations lead with food quality.
- **No dietitian yet:** all nutrition is labelled `ESTIMATED`; `VERIFIED` requires a named
  reviewer and date (fields exist in `VariantNutrition`).
- **Currency** follows the device region. The MVP shows no prices; budget is LOW/MEDIUM/HIGH.
- **AI provider:** Groq (free tier) as default for v1.1, behind an `AiProvider` interface.
  Check Groq's free-tier commercial-use terms and rate limits before launch.
- **Premium subscription** planned later → must use Apple/Google in-app purchase (Guideline 3.1).

### Technical decisions
- **Monorepo with pnpm workspaces** (`apps/mobile`, `apps/api`, `packages/shared`) so the
  app and API share one set of Zod schemas. `nodeLinker: hoisted` because React Native /
  Metro expect a flat `node_modules`. Install scripts are allow-listed (`allowBuilds`).
- **Expo SDK 58 + Expo Router native tabs** (UITabBar / Material), SF Symbols on iOS and
  Material Symbols on Android.
- **No NativeWind (for now).** Latest stable NativeWind (4.2.7) is tested against Expo 57;
  v5 is a release candidate. We use typed design tokens (`apps/mobile/src/theme/tokens.ts`)
  plus small themed components. Revisit when NativeWind officially supports our SDK; the
  tokens map directly onto a Tailwind theme.
- **Prisma pinned to 7.10.1** (CLI and client, exact). npm's `latest` tag for `prisma`
  currently points at an 8.0 release candidate. Prisma 7 uses `prisma.config.ts`, the
  `prisma-client` generator (output `src/generated/prisma`, git-ignored) and the
  `@prisma/adapter-pg` driver adapter.
- **ESLint pinned to 9.x** across the workspace: `eslint-plugin-react` (used by
  `eslint-config-expo`) does not yet support ESLint 10. Lint runs `eslint src` directly.
- **API build:** `tsx` for dev, `tsup` bundles to `dist/` for production (bundles the
  TypeScript-source shared package).
- **Logging:** pino with header redaction; request logs contain only id, method, URL and
  status. Request bodies are never logged (they can carry health data).
- **Errors:** one handler, one envelope: `{ error: { code, message, details? } }`.
  Internal errors never leak messages to clients.
- **Rate limiting:** global 120 req/min/IP for now; stricter per-route limits come with
  search, recommendations and AI.
- **Data model highlights:** dish nutrition lives on `MealVariant` (preparation styles
  differ); ingredient nutrients per 100 g with `NutritionSource` (licence tracked);
  `Ingredient.allergensReviewed` — meals with unreviewed ingredients are excluded for
  users who declared any allergy (fail closed).
- **State management (from M2):** Zustand for on-device state, TanStack Query for server
  data. Not installed yet — added when first used.
