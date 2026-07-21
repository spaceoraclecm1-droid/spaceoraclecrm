# 99acres CRM Integration

End-to-end receiver for leads POSTed by 99acres into this CRM.

## Components

| File | Purpose |
|---|---|
| `app/api/integrations/99acres/webhook/route.ts` | Receives POST; authn, logs, inserts into `enquiries`. |
| `app/api/integrations/99acres/logs/route.ts` | Reads recent integration logs (powers the on-page table). |
| `app/api/integrations/99acres/test-send/route.ts` | Server-side self-call used by the Test Lead button. |
| `app/api/integrations/99acres/postman/route.ts` | Generates a downloadable Postman v2.1 collection. |
| `app/settings/integrations/99acres/page.tsx` | Server page; reads env config. |
| `app/settings/integrations/99acres/Integration99AcresClient.tsx` | Client UI (status, settings, test lead, cURL, docs, logs). |
| `lib/ninety-nine-acres/config.ts` | Env handling + constant-time bearer check. |
| `lib/ninety-nine-acres/lead-mapper.ts` | Permissive mapping from 99acres JSON → `enquiries` row. |
| `lib/ninety-nine-acres/types.ts` | Shared types. |
| `setup_99acres.sql` | Supabase schema + RLS for `integration_logs`. |

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `NINETY_NINE_ACRES_USERNAME` | `ORACE01` | Shown on the settings page. |
| `NINETY_NINE_ACRES_PROFILE_ID` | `102498084` | Shown on the settings page. |
| `NINETY_NINE_ACRES_BEARER_TOKEN` | _empty_ | If set, the webhook requires `Authorization: Bearer <token>`. Constant-time compared. Empty = open (development only). |
| `NEXT_PUBLIC_APP_URL` | _derived from request_ | Optional. Lets `test-send` self-call work behind a proxy or preview URL. |

Add to `.env.local`:

```
NINETY_NINE_ACRES_USERNAME=ORACE01
NINETY_NINE_ACRES_PROFILE_ID=102498084
NINETY_NINE_ACRES_BEARER_TOKEN=sk_99acres_replace_me_with_64_random_bytes
```

Generate a token:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Lead field aliases

The mapper accepts any of these keys and uses the first non-empty value. The first row
(`Confirmed by 99acres`) lists the keys the partner team actually sends — the alias
rows below each accept back-compat keys from older/Housing-style payloads.

| Target column | Accepted JSON keys (tried in order) |
|---|---|
| `Client Name` | `name` → `lead_name` → `customer_name` |
| `Mobile` | `phone` → `mobile` → `mobile_number` → `lead_phone` |
| `Email` | `email` → `lead_email` |
| `Enquiry For` | `property` → `notes` → `project` → `project_name` |
| `Property Type` | `property_type` → `category_type` |
| `Area` | `address` → `locality` → `city` → `area` |
| `Budget` | `budget` → `max_price` → `min_price` |
| `Configuration` | `property` → `configuration` → `bhk` → `property_field` |
| `Remarks` / `Last Remarks` | `notes` → `message` → `remarks` → `comment` → `about` (decorated as `"Lead from 99acres - <notes>"` if present, else `"Lead from 99acres - Project: <enquiryFor>, Locality: <area>"`) |
| `Created Date` | `lead_date` → `created_at` → `timestamp` (epoch s/ms, or ISO) — falls back to "now" if absent (the partner's current payload has no date field) |

Hardcoded on insert: `Enquiry Progress='New'`, `Enquiry Source='99acres'`, `NFD=null`, `Assigned To='Unassigned'`, `Assigned By='System'`. The full raw JSON is also stored in `enquiries."99acres_raw_payload"` for debugging.

> **Confirmed keys (per Sandeep, 99acres Integration Team, 2026-07-21):**
> `name`, `phone`, `email`, `property` (`$bedroomNumBHK`), `budget` (`$price`),
> `about`, `address` (`"$localityName, $cityName"`), `notes` (`$compactLabel`).
> No authentication header is required.

## Webhook contract

```
POST https://<your-deployment>/api/integrations/99acres/webhook
Content-Type: application/json
```

Body — sample (matches what 99acres sends today):

```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "property": "3 BHK",
  "budget": "8500000",
  "about": "",
  "address": "Andheri West, Mumbai",
  "notes": "Sky Heights"
}
```

> `Authorization: Bearer <token>` is **only** consulted when
> `NINETY_NINE_ACRES_BEARER_TOKEN` is set in the environment. As of 2026-07-21
> the partner confirmed no authentication is required, so the env var should
> remain unset and the header may be omitted.

Responses:

| Status | When | Body |
|---|---|---|
| 200 | Lead created | `{ "success": true, "message": "Lead received successfully", "leadId": "..." }` |
| 400 | Invalid JSON / unreadable body | `{ "success": false, "message": "..." }` |
| 401 | Bearer token set but missing/wrong | `{ "success": false, "message": "Unauthorized" }` |
| 405 | Non-POST | `{ "success": false, "message": "Method not allowed. Use POST." }` (Allow: POST) |
| 409 | Active lead with same mobile already exists | `{ "success": false, "message": "Duplicate lead" }` |
| 413 | Body > 64 KB | `{ "success": false, "message": "Payload too large" }` |
| 500 | Supabase insert failed | `{ "success": false, "message": "...", "error": "..." }` |

Logging is best-effort and runs *after* the response is returned (fire-and-forget). The `integration_logs` row is filtered to a small whitelist of headers and the `Authorization` header is always redacted.

## Onboarding steps

1. Apply schema: `psql $DATABASE_URL -f setup_99acres.sql` (or paste into Supabase SQL editor).
2. Set the three env vars in `.env.local` (and on Vercel for production).
3. Deploy.
4. From the settings page (`/settings/integrations/99acres`), click **Send Test Lead** and confirm a row appears in **Integration Logs** with status `200`.
5. Download the Postman collection, set the `token` variable, and share `webhookUrl` + token with the 99acres integration team.
6. For production: turn off the demo RLS policies in `setup_99acres.sql` and restrict `integration_logs` SELECT/INSERT to authenticated users via `auth.uid()`.

## Security notes

- Bearer check is constant-time (length-equalised xor).
- JSON body is capped at 64 KB.
- All requests are logged including failed-auth attempts.
- Logs and enquiry rows are inserted via the same anon-key Supabase client as the rest of the CRM. **Tighten RLS before exposing this URL publicly** — the policies shipped in `setup_99acres.sql` are intentionally permissive for local testing.
