# Setting up Supabase (accounts)

You do this once. It takes about 10 minutes. Nothing here costs money on the free plan.

## 1. Create the project
1. Go to https://supabase.com and sign up / sign in.
2. **New project** → name it `food-suggest`, choose a strong database password (save it in a
   password manager), and pick the region closest to your users (e.g. `eu-west`).

## 2. Turn on email codes
1. **Authentication → Sign In / Providers → Email**: make sure Email is enabled.
2. **Authentication → Emails → Magic Link** template: add the code, for example
   `<p>Your Food Suggest code is: <strong>{{ .Token }}</strong></p>`
   (the app asks for the 6-digit code, it does not use the link).
3. Optional for testing: Supabase's built-in email sender is rate-limited. For real users, set up
   your own SMTP provider under **Authentication → Emails → SMTP settings**.

## 3. Use asymmetric signing keys
**Project Settings → JWT Keys (Signing keys)**: make sure the current key is an **ECC (P-256)** or
**RSA** key, not the legacy shared secret. The API verifies sign-ins with the public keys from
`/auth/v1/.well-known/jwks.json`, which is empty for legacy-secret projects.

## 4. Copy the keys
**Project Settings → API Keys**:

| Value | Where it goes | Secret? |
|---|---|---|
| Project URL (`https://xxxx.supabase.co`) | `apps/api/.env` → `SUPABASE_URL` and `apps/mobile/.env.local` → `EXPO_PUBLIC_SUPABASE_URL` | No |
| Publishable key (`sb_publishable_...`) | `apps/mobile/.env.local` → `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No |
| Secret key (`sb_secret_...`) | `apps/api/.env` → `SUPABASE_SECRET_KEY` **only** | **Yes** — never in the app, chat or git |

## 5. Restart
Restart the API (`pnpm dev:api`) and Expo (`pnpm dev:mobile`, then reload the app).
Profile now shows **Sign in or create account**.

## Database note
Accounts use Supabase only for sign-in. Food Suggest's own data stays in the database the API uses
(`DATABASE_URL`). In production that can be the same Supabase project's Postgres.

## Troubleshooting (what we hit on 2026-11-08)

| Symptom | Cause and fix |
|---|---|
| Email templates can't be edited | Supabase's built-in sender doesn't allow it. Turn on **custom SMTP** (Authentication → Emails → SMTP Settings). For development, Gmail works: host `smtp.gmail.com`, port `587`, username and sender = the full Gmail address, password = a Google **app password** (16 letters, no spaces). Production needs a sender on our own domain. |
| App: "We couldn't send the code"; Auth log: `535 5.7.8 Username and Password not accepted` | Wrong SMTP password or username. Create a new Google app password and enter it without spaces. |
| The API's account routes return 404 | `SUPABASE_URL` or `SUPABASE_SECRET_KEY` is missing, or an older API process still owns port 4000. |
| URL problems | Use the bare project URL (`https://xxxx.supabase.co`), not the `/rest/v1/` URL. |
| "That code is not right or has expired" | Use only the newest email (each request cancels older codes). Keep **Email OTP length = 6** (Authentication → Sign In / Providers → Email); the app expects 6 digits. |
| The secret key starts with something other than `sb_secret_` | That's probably the JWT key ID from the JWT Keys page. Copy the secret key from API Keys instead. |

In development, the app prints Supabase's real error to the Expo terminal (`[sign-in] …` warnings).
