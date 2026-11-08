# App Store / Play review risks

Living list. Status: ⚠️ open, ✅ addressed, 📝 note.

| Guideline | Risk | Plan | Status |
|---|---|---|---|
| Apple 4.8 | Google sign-in requires Sign in with Apple (or equivalent) | Email only for now; Apple + Google ship together in M4b | ✅ for now / ⚠️ M4b |
| Apple 5.1.1(v) | Apps with accounts must offer in-app account deletion | `DELETE /v1/me` + Profile → Delete my account | ✅ built, verify on device |
| Apple 5.1.1 / 5.1.2 | Privacy policy, data minimisation, privacy nutrition labels | Optional fields, birth year only, privacy policy before TestFlight | ⚠️ M6 |
| Apple 1.4.1 | Health apps: no medical claims; inaccurate data can harm | Disclaimer on Home and meal details; nutrition labelled "estimated" | 📝 disclaimer drafted |
| Apple 4.2 | Minimum functionality — too little content looks like a demo | Launch with enough curated meals (target 60+) | ⚠️ M1 |
| Apple 3.1.1 | Premium features must use in-app purchase | Use StoreKit / Play Billing when premium arrives | 📝 future |
| Apple 2.3 | Accurate metadata and screenshots | Screenshots only of real features | ⚠️ release |
| Apple 5.1.4 / Play families | Minors (16–17) | No weight-loss targets under 18; not directed at children | 📝 |
| Licensing | WAFCT 2019 nutrition data is licensed for non-commercial use only | Request FAO commercial licence, or replace with USDA FDC data before launch | ⚠️ launch blocker |
| Apple 1.4.1 | Seed recipes and nutrition not yet reviewed by a professional | Keep "estimated" labels; get recipes reviewed before launch | ⚠️ |
| Privacy | Health-related data stored for accounts | Explicit, versioned consent; withdrawal deletes it; privacy policy still to write | ⚠️ policy |
| Ghana Act 843 | Data controller registration with the Data Protection Commission | Confirm with a local lawyer before launch | ⚠️ |

## Image licences (added 2026-11-08)

Meal photos come from Wikimedia Commons (CC BY 2.0 / CC BY-SA 4.0: attribution required),
Unsplash and Pexels (free licences). Credits appear on each meal page and on Profile → Photo
credits. Before launch: host copies ourselves and re-check each photo page for licence changes.
