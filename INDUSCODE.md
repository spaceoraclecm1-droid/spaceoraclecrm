# INDUSCODE.md

This file provides guidance to Induscode (compatible with claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Next.js dev server at http://localhost:3000
- `npm run build` - Production build (`next build`)
- `npm start` - Serve production build (`next start`)
- `npm run lint` - ESLint via `next lint`

There is **no test framework configured** in `package.json` (no `test` script, no jest/vitest/playwright). If asked to "run tests" or write tests, surface that gap to the user rather than fabricating a command.

## Environment Setup

Required env vars (see `env.example` and `VERCEL_ENV_SETUP.md`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `HOUSING_PROFILE_ID` (Housing.com lead integration)
- `HOUSING_ENCRYPTION_KEY` (Housing.com lead integration)
- `CRON_SECRET` (optional, gates `/api/housing/cron`)

Helper script: `node setup-housing-env.js` writes `HOUSING_PROFILE_ID` / `HOUSING_ENCRYPTION_KEY` / `CRON_SECRET` to `.env.local`. Refuses to run if `.env.local` already exists; will not add Supabase vars (add those manually).

The repo ships `.next/` and root-owned build artifacts under `/Users/varunisrani/spaceoraclecrm/.next` from a prior elevated run. If `next dev` fails with `EACCES` on `.next/`, that directory must be `sudo rm -rf`'d before `npm run dev` will work for the current user.

## Architecture

Next.js 15 App-Router CRM for real estate lead tracking, with three layered subsystems:

### 1. App layer (`app/`)

- **Routing**: App Router pages under `app/`. Feature areas split by status/time-bucket rather than by entity, e.g. `app/today-inquiries/`, `app/new-inquiries/`, `app/due-inquiries/`, `app/yesterday-inquiries/`, `app/weekend-inquiries/`, `app/sales-inquiries/`, `app/site-visits/`, `app/todays-site-visits/`. Inquiry CRUD lives under `app/enquiry/` (`new/`, `list/`, `[id]/`, `[id]/edit`, `[id]/progress`, `reports/`). Employee reports under `app/reports/`. Housing admin UI under `app/housing-integration/`. Auth screens at `app/login/`.
- **Components**: `app/components/` holds page-level presentational and form components (InquiryProgress, ScheduleVisitForm, SiteVisitList, StatusBadge, Navbar, etc.). They are not a generic design-system library — most are coupled to specific pages.
- **State**:
  - `app/context/AuthContext.tsx` — `'use client'` context. Auth is **localStorage-based** (`localStorage['crm_user']`), not middleware-based. Protected routing is enforced by a `useEffect` redirect inside `AuthProvider`, so SSR pages are not gated. The login function queries `supabase.from('users')` directly with a **plaintext password comparison** — no hashing. See "Known constraints" below before touching auth.
  - `app/store/inquiryStore.ts` — Zustand store with a single `todayInquiries` slice. Mostly wired through `app/page.tsx` (dashboard).
- **Types**: Defined in two places — `app/types.ts` (re-export / shape of `Enquiry`) and `app/types/inquiry.ts` (status unions, progress types, remarks, employee reports, site visits). When changing types, update both.
- **Utilities**: `app/utils/supabase.ts` builds a Supabase singleton from the public anon key. `localStorage.ts` and `sampleData.ts` support offline/seed mode. `initializeData.ts` bootstraps demo data.
- **API routes** (`app/api/housing/`): server-only entry points for the Housing integration — `sync/`, `cron/`, `test/`, `debug/`, `fetch-leads/`, `test-fetch/`. All are thin wrappers around `HousingService`.

### 2. Housing.com integration (`lib/housing/`)

Pure server-side library, no React. Three classes plus a config:
- `config.ts` — `HOUSING_CONFIG` (API URL, profile id, encryption key, polling interval) and `validateConfig()`. Module-loads env vars; nothing runs without them.
- `hash-generator.ts` — HMAC for the Housing API auth hash.
- `api-client.ts` — `HousingAPIClient`: builds the signed request URL via `hash-generator`, fetches leads, normalizes the Housing response into `ProcessedLead` (mapping `lead_name→clientName`, `lead_phone→mobile`, formatting `min_price`/`max_price` into a budget string, formatting area range, hardcoding `assignedTo: 'Unassigned'` and `enquirySource: 'Housing'`).
- `supabase-sync.ts` — `HousingSupabaseSync`: de-dupes against existing rows, bulk inserts `ProcessedLead`s, tracks `LAST_FETCH_KEY` so subsequent runs only fetch new leads.
- `housing-service.ts` — `HousingService` orchestrates: fetch → process → dedupe → insert → update last-fetch timestamp. This is the only class API routes call.
- `types.ts` — internal `HousingAPIResponse`, `HousingLeadResponse`, `ProcessedLead`.

### 3. Data flow (Housing → CRM)

1. Vercel Cron hits `/api/housing/cron` (schedule in `vercel.json`: `0 2 * * *`, daily at 02:00 UTC — note this **contradicts** the "every 15 minutes" claim in `VERCEL_ENV_SETUP.md` and the `FETCH_INTERVAL_MS = 15min` constant in `config.ts`; the cron is the source of truth in production). Endpoint accepts optional `Authorization: Bearer ${CRON_SECRET}`.
2. Route instantiates `HousingService`, calls `fetchAndSyncLatestLeads()`.
3. `HousingAPIClient` calls the Housing API with a signed URL covering `[lastFetchTimestamp, now]`.
4. Returns `HousingLeadResponse[]` → mapped to `ProcessedLead[]` → deduped + inserted by `HousingSupabaseSync`.
5. Last-fetch timestamp is advanced so the next run only sees new leads.

`/api/housing/sync` accepts both `GET` (auto window = since-last-fetch → now) and `POST` with `{ hoursBack }` (manual backfill). `/api/housing/test` is a 1-hour probe for credential verification.

Inquiry status flow used throughout the UI: `new` → `in_progress` → `site_visit_scheduled` → `site_visit_done` → `deal_succeeded` | `deal_lost`. `site_visit_done` is reused both for completed visits and for re-scheduling context; recent commits (`Exclude Deal Lost enquiries from Housing duplicate checks and batch-filter leads`) suggest `deal_lost` is treated as terminal across several pages — confirm against the relevant page before adding new status-aware UI.

## Configuration Notes

- `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Treat type/lint errors as warnings; they do **not** block `next build`. Do not introduce new type errors without flagging them.
- `next.config.js` (the CommonJS one) duplicates the `.ts` config and adds `swcMinify: true`, which Next 15 logs as `Unrecognized key(s) in object: 'swcMinify'`. Next loads `.ts` first; the JS file is effectively dead config. Don't edit `next.config.js` — edit `next.config.ts`.
- Image domain `i.ibb.co` is allow-listed in `images.domains`.
- Path alias `@/*` → `./` (project root).

## Known Constraints (worth knowing before changing auth, types, or build)

- **Auth is client-side only.** `app/utils/supabase.ts` uses the anonymous key, and `AuthContext` compares plaintext passwords against the `users` table. There is no Supabase Auth integration, no middleware, no `crypto.subtle` hashing. Anything sensitive is gated only by Supabase RLS policies. Any auth refactor needs to touch `AuthContext`, the `users` table, and RLS policies together.
- **No service-role Supabase client.** API routes under `app/api/housing/` use the same public anon client implicitly (they instantiate `HousingService`, which uses `HousingSupabaseSync`, which uses anon credentials). If Housing sync needs elevated DB privileges, add a server-only Supabase client using a service-role key — do not reuse the singleton in `app/utils/supabase.ts`.
- **Type duplicates.** `app/types.ts` and `app/types/inquiry.ts` overlap. When extending inquiry fields, grep both files.
- **No `.env.example` of the actual file** — only `env.example` (no leading dot, not auto-loaded by Next). Developers either copy it to `.env.local` or use `setup-housing-env.js`. Do not commit a populated `.env.local`.

## 99acres Inbound Integration

Receives leads POSTed by 99acres into the CRM. Receives JSON, validates Bearer if configured, inserts into `enquiries` with `Enquiry Source='99acres'`, and logs to `integration_logs`.

### Files

- `app/api/integrations/99acres/webhook/route.ts` — POST receiver
- `app/api/integrations/99acres/logs/route.ts` — GET recent logs / GET one log by id
- `app/api/integrations/99acres/test-send/route.ts` — POST used by the Test Lead button
- `app/api/integrations/99acres/postman/route.ts` — GET Postman v2.1 collection
- `lib/ninety-nine-acres/{config,lead-mapper,types}.ts` — shared lib (mirror of `lib/housing/`)
- `app/settings/integrations/99acres/page.tsx` + `Integration99AcresClient.tsx` — UI
- `setup_99acres.sql` — schema + RLS for `integration_logs`
- `INTEGRATIONS_99ACRES.md` — partner-facing docs

### Field mapping (permissive aliases)

| Target column | Accepted JSON keys |
|---|---|
| `Client Name` | `lead_name`, `name`, `customer_name` |
| `Mobile` | `phone`, `mobile`, `mobile_number`, `lead_phone` |
| `Email` | `email`, `lead_email` |
| `Enquiry For` | `project`, `project_name` |
| `Area` | `locality`, `city`, `area` |
| `Budget` | `budget`, `max_price`, `min_price` |
| `Configuration` | `configuration`, `bhk`, `property_field` |
| `Remarks` | `message`, `remarks`, `comment` |

Lead date accepts `lead_date`/`created_at`/`timestamp` (epoch s, ms, or ISO). Hardcoded on insert: `Enquiry Progress='New'`, `Enquiry Source='99acres'`, `Assigned To='Unassigned'`, `Assigned By='System'`, `NFD=null`. Raw payload mirrored into `enquiries."99acres_raw_payload"`.

### Env vars

`NINETY_NINE_ACRES_USERNAME`, `NINETY_NINE_ACRES_PROFILE_ID`, `NINETY_NINE_ACRES_BEARER_TOKEN` (optional — if empty, webhook is open for dev).

### RLS caveat

`setup_99acres.sql` ships permissive demo policies so the integration is testable on day one. **Before pointing the 99acres team at the URL in production**, lock `integration_logs` SELECT/INSERT to authenticated users (or move both directions behind a service-role server client). The enquiry insert is via the anon key the same way the rest of the CRM works.

## Cursor Rules

`.cursor/rules/byterover-rules.mdc` is active: always invoke the `search-memories` MCP tool before any task and `create-memories` after completing one. This is a harness-level rule, not a project rule — honor it as the first/last step of substantive work.
