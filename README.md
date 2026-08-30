# ReadyCustomer

**Qualified customers, ready to buy.**

ReadyCustomer connects Canadian businesses with qualified customer opportunities based on service fit, geography, timing, purchase intent, contactability, and economics.

## Business model

Businesses define the customer they want. ReadyCustomer captures demand, qualifies it, matches it to participating businesses, routes the opportunity, and tracks the outcome.

**Core loop:**

`Buyer ICP → demand capture → qualification → exclusive match → 15-minute accept → expire/decline-to-next → accepted introduction → outcome → fee`

## Launch thesis

- **Launch vertical:** Flooring only for automated matching.
- **Launch geography:** GTA / Ontario service tokens.
- **Target buyer:** Canadian flooring businesses with meaningful gross profit per closed customer.
- **Problem:** Businesses do not want another marketing retainer; they want qualified demand.
- **Product:** Exclusive Qualified Introduction.
- **Revenue:** Recorded per-qualified-opportunity fee; payment collection is not in v0.2.
- **North-star metric:** ReadyCustomer revenue generated from accepted qualified opportunities.

## MVP v0.2

The current transaction layer supports:

1. **Customer intake** — service, geography, timing, budget, contact, consent and details.
2. **Qualification** — hard filters plus a 0–100 fit score.
3. **Exclusive matching** — one flooring buyer receives the offer at a time.
4. **15-minute acceptance SLA** — accepted offers record the ReadyCustomer fee.
5. **Expire / decline to next buyer** — up to three routing attempts.
6. **Invalid-lead clawback status** — available within 24 hours; no payment processor yet.
7. **Buyer economics** — numeric AOV, gross profit, max CAC, minimum budget and max CPL.

Non-flooring or non-GTA requests are still stored but remain `unmatched`; they are not routed in v0.2.

## Qualification rules

A flooring lead can qualify when it has a valid contact method, consent, a timeline within 60 days, GTA/Ontario geography, and a score of at least 70. Flooring budgets below CAD $2,500 are disqualified when a budget is supplied.

## Deployment

Designed for Vercel serverless functions and Supabase REST.

Required production environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_KEY` — required to approve buyers through the API and to use admin rematching in production.

Optional SMS environment variables:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`

Apply the additive migration before deploying v0.2 against an existing database:

```sql
-- Supabase SQL Editor
-- run the contents of:
sql/schema_v2.sql
```

For a brand-new database, `sql/schema.sql` contains the complete current schema.

## API surface

- `POST /api/lead` — store, score, qualify and route a lead.
- `POST /api/buyer` — create buyer ICP/economics profile. Public submissions remain `new`.
- `POST /api/match` — admin re-match for eligible unmatched/expired leads.
- `GET|POST /api/expire` — expire stale offers and route the next buyer.
- `GET /api/accept?match_id=...` — redirects to the mobile accept page.
- `POST /api/accept` — accept, decline or mark invalid.
- `/accept.html?match_id=...` — mobile buyer action page.

## Expiry scheduling

`/api/expire` is cron-friendly. The current Vercel Hobby project does not have a five-minute cron configured, so call this endpoint from an external scheduler or upgrade to a plan that supports the required cadence. If `ADMIN_KEY` is set, send it as `x-admin-key`.

## Validation

Run:

```bash
npm test
```

The launch standard remains revenue-first: prove one buyer, one qualified opportunity, one accepted introduction, and one paid outcome before expanding the vertical scope.
