# ReadyCustomer — Venture Launch OS

## Business thesis

ReadyCustomer is a Canadian qualified-customer marketplace: businesses define exactly who they want, ReadyCustomer finds and qualifies purchase intent, then routes the opportunity to the best-fit participating business.

## Opportunity score

| Dimension | Score /10 |
|---|---:|
| Customer pain | 9 |
| Market demand | 9 |
| Competition / supply gap | 7 |
| Gross margin potential | 9 |
| Recurrence | 8 |
| Speed to first revenue | 9 |
| Capital intensity | 9 |
| Operational simplicity | 7 |
| Differentiation | 8 |
| Scalability | 9 |
| **Overall** | **8.4** |

### Largest weakness

Cold-start marketplace risk: ReadyCustomer must prove it can consistently create qualified purchase intent at a cost below what buyers will pay.

### First solution

Do not build a broad marketplace first. Use known businesses as launch buyers and prove one vertical at a time. The first validation loop is:

`1 buyer → 1 defined ICP → 1 qualified opportunity → 1 accepted introduction → 1 closed sale → 1 ReadyCustomer fee`

## Offer

### Core product

Qualified Customer Opportunity.

### Entry offer

Pilot businesses can define their ICP and receive initial test opportunities without an agency retainer.

### Monetization hypotheses

1. Pay per qualified lead.
2. Higher fee for exclusive opportunities.
3. Permitted success-based fee for high-ticket categories.
4. Later: buyer subscription / priority routing / territory exclusivity.

Pricing remains a hypothesis until conversion and gross-profit data exist.

## Unit economics model

For each buyer capture:

- Average deal value.
- Gross profit per closed sale.
- Lead-to-close rate.
- Maximum acceptable CAC.
- Maximum acceptable CPL.
- Refund/credit rules for invalid leads.

**CAC ceiling formula:**

`maximum lead price ≈ gross profit per sale × target marketing share × lead-to-close probability`

Example only: if gross profit is $4,000, the buyer can spend 20% of gross profit to acquire a customer, and 20% of qualified leads close, the implied CPL ceiling is about $160.

## Launch market

Start in Ontario / GTA where existing buyer relationships reduce cold-start risk.

### Initial buyer categories

1. Flooring.
2. Business funding.
3. Mortgage / HELOC.
4. Commercial landscaping.
5. Insulation.
6. Construction.
7. Corporate flowers / gifting.
8. Dry cleaning.
9. Growth marketing.

## Positioning

**Brand:** ReadyCustomer

**Tagline:** Qualified customers, ready to buy.

**Positioning statement:** ReadyCustomer connects businesses with qualified customers who are actively looking to buy.

**Sales question:** How can we send you customers?

## Funnel

### Customer side

Traffic → service need → location → timing → budget → contact → consent → qualification score → buyer match → introduction → outcome.

### Business side

Buyer → ideal customer → product/service → geography → average deal value → gross profit → max CAC → approved buyer profile → routed opportunities → outcome reporting.

## Lead quality standard

A lead should be routed only when it meets the relevant buyer definition and has enough evidence of real purchase intent.

Default score dimensions:

- ICP / service fit.
- Purchase intent.
- Timing.
- Economic value.
- Reachability.
- Decision authority.

A qualified opportunity is not a guaranteed sale.

## GTM priority

Fastest-cash sequence:

1. Existing relationships and known buyers.
2. High-intent Google Search landing pages.
3. Partner/referral channels.
4. Local SEO and service pages.
5. Targeted paid acquisition only after CPL ceiling is known.

## Metrics

North star: **ReadyCustomer revenue from accepted qualified opportunities.**

Track:

- Visitors.
- Lead starts.
- Lead submissions.
- Qualified leads.
- Routed leads.
- Accepted leads.
- Quotes.
- Wins.
- GMV / closed value.
- ReadyCustomer fee.
- Qualification rate.
- Acceptance rate.
- Close rate.
- Cost per qualified lead.
- Revenue per qualified lead.

## Current bottleneck

Prove that a qualified opportunity can be generated and monetized in one launch vertical.

## Top 3 next measurable actions

1. Capture the first live flooring request and route it to the pilot flooring buyer.
2. Load the first 3 buyer ICP/economics profiles into the database.
3. Track the complete outcome from source through ReadyCustomer fee.

## v0.2 shipped — transaction layer

Automated now:

- Flooring-only GTA qualification using service, geography, timing, budget, consent and contactability.
- Numeric buyer economics and computed maximum CPL.
- Exclusive routing to one ranked buyer at a time.
- 15-minute offer expiry.
- Accept / decline actions and fee assignment.
- Expired or declined offers route to the next eligible buyer, up to three attempts.
- Invalid-lead clawback status within 24 hours.

Still manual / optional:

- SMS delivery is optional and only runs when Twilio environment variables exist.
- Payment collection is not implemented; `fee_cad` is recorded only.
- No human review queue is included in v0.2.
- On the current Vercel Hobby project, automatic five-minute cron scheduling is not configured; `/api/expire` is ready for an external scheduler or a plan that supports the required cadence.
