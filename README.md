# ReadyCustomer

**Qualified customers, ready to buy.**

ReadyCustomer connects Canadian businesses with qualified customer opportunities based on service fit, geography, timing, purchase intent, contactability, and economics.

## Business model

Businesses define the customer they want. ReadyCustomer captures demand, qualifies it, matches it to participating businesses, routes the opportunity, and tracks the outcome.

**Core loop:**

`Buyer ICP → demand capture → qualification → matching → routing → quote → won/lost → fee → learning`

## Launch thesis

- **Target customer:** Canadian SMBs with meaningful gross profit per closed customer.
- **Problem:** Businesses do not want another marketing retainer; they want qualified demand.
- **Product:** Qualified Customer Opportunities.
- **Revenue:** Per-qualified-lead, exclusive-opportunity fees, and permitted success-based arrangements.
- **Wedge:** ReadyCustomer owns the demand/qualification/routing layer rather than selling marketing activity.
- **North-star metric:** ReadyCustomer revenue generated from accepted qualified opportunities.

## MVP

The initial MVP supports two sides of the marketplace:

1. **Customer demand intake** — people/businesses submit a real purchase need.
2. **Buyer ICP intake** — businesses specify who they want, what they sell, geography, deal value, gross profit, and acceptable CAC.

Lead scoring is based on intent, timing, economics, reachability, and fit signals. The backend is designed for Supabase and Vercel.

## Initial verticals

- Flooring
- Business funding
- Mortgage / HELOC
- Commercial landscaping
- Insulation
- Construction
- Flowers / corporate gifting
- Dry cleaning
- Marketing / growth services

## Deployment

Designed for Vercel serverless functions.

Production environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Apply `sql/schema.sql` before accepting production leads.

## AI / search discovery

Included:

- `llms.txt`
- `services.json`
- `openapi.json`
- `mcp.txt`
- `ai-sitemap.json`
- `.well-known/agent.json`
- `/api/mcp`
- `robots.txt`
- `sitemap.xml`
- Schema.org Organization + WebSite markup

## Validation

Run:

`npm test`

The launch standard is revenue-first: prove one buyer, one qualified opportunity, one accepted introduction, and one paid outcome before adding major complexity.
