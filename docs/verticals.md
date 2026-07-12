# Multi-vertical architecture

Vivahale runs multiple verticals (health, and later money/tech/…) from one
codebase. The active vertical is chosen by `NEXT_PUBLIC_VERTICAL` (default
`health`) and resolved through `src/lib/verticals/` (`getActiveVertical()`).

## Rating criteria are vertical-driven

`CriterionRatings` (src/lib/types.ts) is now a generic `Record<string, number>`
keyed by the active vertical's `criteria[].key`. All rating UI —
`RatingBreakdown` (src/components/review/RatingBadge.tsx) and the
`/methodology` criteria table — iterates `getActiveVertical().criteria` instead
of a hardcoded key list. Each `RatingCriterion` carries a short `label` (compact
badges), an optional `longLabel` (methodology prose name), a fractional `weight`
(rendered as a whole-percent), and an optional `description` (methodology
"what we evaluate" cell). For the Health vertical these produce byte-identical
output to the previous hardcoded values, and `src/data/health/products.json`
needs no change (its `ratings` keys are the same five).

## Persistence and the `vertical` column

`supabase/migrations/0004_verticals.sql` adds a `vertical text not null default
'health'` column (plus an index) to every content-bearing table — `categories`,
`authors`, `reviewers`, `products_providers`, `articles`, `social_posts`, and
`queue_items` — and adds the missing `Editorial` value to the
`reviewer_credential` enum. `email_subscribers` is intentionally left unscoped
(a single cross-vertical newsletter list).

- **Supabase mode** (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  set): `src/lib/db.ts` filters every read by `.eq("vertical", <active>)`;
  `src/lib/queue.ts` and `src/lib/social.ts` stamp each new row with the active
  vertical and read legacy rows (no `vertical` field) as `health`.
- **Local-JSON mode** (fallback): seeds are already vertical-scoped by the
  compile-time registry in `src/lib/seeds.ts` (`src/data/<vertical>/`), so no
  runtime filtering is needed. The queue/social local stores stamp `vertical`
  on write and tolerate legacy records the same way.

## CI is stateless without Supabase

The local JSON stores (`data/queue.local.json`, `data/social.local.json`,
`data/subscribers.local.json`, `data/news-seen.local.json`) are gitignored, so a
fresh checkout / CI run starts with empty content queues. **Multi-vertical
persistent content therefore requires Supabase** with the `vertical` column from
migration `0004`: only then can queued drafts, social posts, and subscribers
survive across runs and be correctly partitioned per vertical. Without Supabase,
each CI run is stateless and only the committed per-vertical seeds render.

## Phase B verification (2026-07-12)

Phase B rebrands Health onto **health.vivahale.com** and adds the
**vivahale.com** brand portal. All checks passed on the first run — Health
renders identically to Phase A apart from the intended host/name rebrand.

### What changed
- **Health rebrand:** `verticals/health.ts` `name` → `Vivahale Health`
  (host `health.vivahale.com`; tagline/description unchanged).
- **`site.ts`:** `SITE_URL` is vertical-aware — `NEXT_PUBLIC_SITE_URL` if set,
  else `https://${getActiveVertical().host}` (health → `https://health.vivahale.com`,
  portal → `https://vivahale.com`); trailing slash stripped; name/shape kept.
  Added `SITE_TAGLINE` and `IS_PORTAL` helpers.
- **`social.ts`:** script-safe `SITE_URL` (env only, no `@/lib/*` import) —
  `NEXT_PUBLIC_SITE_URL` else derived from `NEXT_PUBLIC_VERTICAL` (default
  `health`) as `https://<vertical>.vivahale.com` (portal → apex).
- **Portal:** `verticals/portal.ts` (minimal non-content registry entry),
  `src/app/portal/page.tsx` (hero + card grid driven off `contentVerticals()`),
  `proxy.ts` rewrites apex-host `/` → `/portal` (admin gate untouched, applied
  first), `sitemap.ts`/`seeds.ts` handle portal mode, `Footer`/`Logo` adapt.

### Rebrand proof (health mode, `next start`, no env)
- `<title>` = `Vivahale Health — …`; `/` and `/reviews/*` canonical + `og:url`
  = `https://health.vivahale.com/…`; review JSON-LD `@id`/`url` + `og:image`
  (`/api/og`) on the health host.
- `/sitemap.xml`: every `<loc>` on `health.vivahale.com`; `/feed.xml` item
  links on the health host; `/robots.txt` → `Sitemap: https://health.vivahale.com/sitemap.xml`.
- `social.ts` standalone via `tsx` → `SITE_URL = https://health.vivahale.com`.

### Portal proof
- Host-based: `curl -H 'Host: vivahale.com' /` → portal (hero + Health card
  linking to `https://health.vivahale.com`), canonical `https://vivahale.com`;
  `curl -H 'Host: health.vivahale.com' /` still the Health homepage.
- `NEXT_PUBLIC_VERTICAL=portal` build/dev: `/` renders the portal, canonical
  `https://vivahale.com`, `/sitemap.xml` emits ONLY `https://vivahale.com`,
  `/robots.txt` references the portal sitemap — no health URLs leak.

### Admin gate (unchanged)
- Prod + no `ADMIN_PASSWORD` → `/admin`, `/admin/social` = **403**; `/admin/login` = 200.
- Prod + `ADMIN_PASSWORD` set → `/admin` = **307 → /admin/login** on the default
  host AND with `Host: vivahale.com` (apex host does not bypass the gate).
- Dev + no password → `/admin` = **200** dev-open. Env unset afterward.

### Type + build
- `npx tsc --noEmit` → **exit 0, zero errors.**
- `npm run build` (default health) → **57 pages** (= baseline 56 + new `/portal`);
  `ƒ Proxy (Middleware)` present.

### Checkpoint commit
- `8840d70` — *Phase B: health.vivahale.com rebrand + vivahale.com brand portal*.
  Nothing pushed.

## Phase C verification (2026-07-12)

Phase C builds the **Money vertical** (`money.vivahale.com`) end to end: an
evidence-first personal-finance publisher sharing the one codebase. YMYL content,
so every disputable number cites a primary source with an "as of 2026-07-12"
qualifier, and every product review carries at least one genuine con. Health
renders identically to Phase B.

### What changed (grouped)
- **Config:** `src/lib/verticals/money.ts` (new) — key `money`, name
  `Vivahale Money`, host `money.vivahale.com`; 5 criteria **Fees 25 / Value &
  Returns 25 / Transparency 20 / Security & Trust 15 / Support 15**; money
  `methodologyIntro`; `disclosureLabel: "Advertiser Disclosure"` +
  advertiser-compensation `disclosureBody`; not-financial-advice
  `contentDisclaimer` (`contentDisclaimerLabel: "Financial disclaimer"`); shared
  Vivahale palette read from config; no `extras`/quiz. Registered in
  `verticals/index.ts` (`resolveVerticalFromHost` maps `money.vivahale.com` **and**
  `money.localhost` → `money`, port-stripped).
- **Data:** `src/data/money/` — `categories.json` (7 sections),
  `authors.json` (one honest "Consumer Finance Analyst" byline, explicitly NOT a
  CFP/CFA/advisor), `reviewers.json` ("Vivahale Editorial Team", `Editorial`,
  `is_placeholder:false`, states Vivahale employs no licensed financial advisor),
  `products.json` (10 reviews), `hubs.json` (2), `articles.json` (3),
  empty-valid `news-feeds.json`/`topics.json`. Registered in `src/lib/seeds.ts`.
- **Components/pages (config-driven, health byte-identical):**
  `AffiliateDisclosure`, `MedicalDisclaimer` (single content-disclaimer surface),
  `Footer`, `NewsletterBand`, `ArticleNewsletterCta`, `methodology/page.tsx`
  (+ money branch), `best/[slug]`, `reviews/[slug]`, `page.tsx`, `sitemap.ts`
  (quiz gated by `activeVerticalHasTool`), `quiz/sleep/page.tsx` (404s when the
  active vertical doesn't expose the tool), `articles/[slug]`, `queue.ts`
  (vertical-scoped reads), `verticals/{index,types,health}.ts`.

### The two hubs + ranked products (key primary sources; as-of 2026-07-12)
All FDIC certificate numbers, the Discover→Capital One merger, and every price
were independently re-verified against primary sources (FDIC BankFind API,
bank/issuer official pages, company pricing/security pages) — **0 fabricated or
contradicted figures**.

- **Best High-Yield Savings Accounts of 2026** (`/best/best-high-yield-savings-accounts`):
  1. **Ally Bank Online Savings** — FDIC Cert #57803 (active); no monthly fee, $0
     min. src: ally.com/bank/online-savings-account, FDIC BankFind. *(monetized)*
  2. **Marcus by Goldman Sachs** — Goldman Sachs Bank USA, FDIC Cert #33124; no
     fees, $0 min, same-day transfers ≤$100k. src: marcus.com, FDIC. *(monetized)*
  3. **Capital One 360 Performance Savings** — Capital One, N.A., FDIC Cert #4297;
     no fee/min, branch + Cafe access; rates variable eff. 7/10/2026. src:
     capitalone.com official disclosures, FDIC. *(monetized)*
  4. **American Express High Yield Savings** — Amex National Bank, FDIC Cert
     #27471; no fee/min, daily compounding; APY variable. src: americanexpress.com,
     FDIC. *(not monetized)*
  5. **Discover Online Savings** — merged into Capital One **May 18, 2025**;
     Discover Bank charter (Cert #5649) now **inactive**, deposits FDIC-insured via
     Capital One, N.A. (#4297). src: discover.com/online-banking, FDIC. *(not
     monetized; ranked last for the platform transition.)*
- **Best Budgeting Apps of 2026** (`/best/best-budgeting-apps`):
  1. **YNAB** — $14.99/mo or $109/yr, 34-day trial, no CC, shareable ×6; con:
     steep learning curve + premium price, no free tier. src: ynab.com/pricing,
     /security. *(monetized)*
  2. **Monarch Money** — Core $14.99/mo or $99.99/yr, 7-day trial, Plus $199/yr;
     SOC 2 Type 2. src: monarch.com/pricing + security help. *(monetized)*
  3. **Copilot Money** — $13/mo or $95/yr, 1-mo trial; con: **no Android app**.
     src: copilot.money/pricing, privacy-and-security. *(monetized)*
  4. **Empower Personal Dashboard** — free dashboard; con: advisory upsell,
     tiered AUM fee, $100k/$250k/$1M minimums. src:
     empower.com/products-solutions/wealth-management. *(not monetized)*
  5. **Goodbudget** — free tier (20 envelopes/1 acct/2 devices, no bank sync);
     Premium $10/mo or $80/yr. src: goodbudget.com/plans-pricing. *(not monetized)*

  Monetized items set `is_monetized:true` + `affiliate_url:
  "VIVAHALE_AFFILIATE_PLACEHOLDER"`; each hub renders the Advertiser Disclosure
  and states its weighted methodology.

### Editorial articles (`src/data/money/articles.json`, honest author + editorial reviewer)
`how-fdic-insurance-works` (cites fdic.gov + EDIE), `hysa-vs-money-market-vs-cds`
(FDIC + Investor.gov/SEC), `fed-rate-decisions-savings-apy` (federalreserve.gov
FOMC/open-market). Every claim cited; each carries the not-financial-advice
disclaimer. (Like Health, `status:draft` seeds surface as non-clickable cards on
category/home; full `/articles/[slug]` pages come from the runtime queue store,
so they are correctly absent from the crawl/sitemap here — parity with Health.)

### Money-mode crawl (production build + `next start`, `NEXT_PUBLIC_VERTICAL=money`, no Supabase env)
- **30 routes** crawled recursively from `/` (home, 2 hubs, 10 reviews, 7
  categories, 7 static/legal, author, reviewer, favicon). **All HTTP 200.**
  **Broken links = 0. Soft-404s = 0** (smallest real body ~22 KB).
- Both hubs render the **Advertiser Disclosure**. Of the 10 reviews, the **6
  monetized** ones render the Advertiser Disclosure; the **4 non-monetized** render
  the neutral "does not earn a commission" note. **Every review renders a Cons
  section** (≥1 genuine con).
- `/methodology` renders the money criteria **Fees 25% / Value & Returns 25% /
  Transparency 20% / Security & Trust 15% / Customer Support 15%** with the money
  intro and money prose.
- `/sitemap.xml` → **29 `<loc>`s, all on `https://money.vivahale.com`**, no quiz,
  no health URLs. `/robots.txt` + `/feed.xml` use the money host. Review
  canonical/`og:url`/`og:title` on the money host and say "Vivahale Money".
- **Tool gating:** `/quiz/sleep` → **404** in money mode, absent from nav and
  sitemap (Health keeps it working: 200).

### Health parity spot-check (`next start`, health build, no env)
`/`, `/methodology`, `/quiz/sleep`, `/best/best-sleep-supplements`,
`/reviews/nature-made-melatonin-3mg`, `/sitemap.xml` all **200**, titled
**"Vivahale Health"**; methodology **30/30/20/10/10**; monetized review shows the
**Affiliate disclosure** label + **Medical disclaimer**; sitemap/robots on
`health.vivahale.com`. `/quiz/sleep` still 200. Byte-identical to Phase B.

### Host routing (documented behavior)
`resolveVerticalFromHost` (used by `src/proxy.ts`) maps
`money.vivahale.com`/`money.localhost` → `money`, `health.vivahale.com` → `health`,
apex → `portal`, unknown → `null`. The proxy forwards the active vertical as the
`x-vivahale-vertical` **request** header to server components. **Page CONTENT is
chosen by `NEXT_PUBLIC_VERTICAL` at build time**, so serving the Money site on
`money.vivahale.com` requires a **per-vertical build/deployment**
(`NEXT_PUBLIC_VERTICAL=money npm run build`) behind that host — a single build
cannot serve two verticals' content by Host header alone. The proxy header is for
request-scoped resolution/routing (e.g. the apex `/`→`/portal` rewrite), not for
swapping prebuilt content.

### Compliance gate (money mode; local stores backed up + restored byte-identically)
Monetized social post with no disclosure → `transitionSocialStatus(→approved)`
**REFUSED**: *"Approval blocked: this is a monetized link but the caption is
missing an FTC disclosure ('#ad' or 'affiliate')."* New record stamped
`vertical:"money"`. Adding `#ad` → transition **succeeds** (→approved,
vertical money). `data/social.local.json` restored (SHA
`2bde2036…` before and after; `diff` identical). No external API called.

### Admin gate (money mode)
`ADMIN_PASSWORD` set → `/admin` and `/admin/social` = **307 → /admin/login**;
`/admin/login` = 200. Env unset afterward. Proxy `/admin` boundary untouched.

### Script safety
`npx tsx` loads `src/lib/social.ts` standalone; with `NEXT_PUBLIC_VERTICAL=money`
it resolves `SITE_URL = https://money.vivahale.com` (default → health host).

### Type + build
- `npx tsc --noEmit` → **exit 0, 0 errors.**
- `npm run build` (default health) → **57 pages** (matches Phase B); money hubs
  absent, health intact.
- `NEXT_PUBLIC_VERTICAL=money npm run build` → **succeeds**: 2 hubs, 10 reviews,
  money author/reviewer; `ƒ Proxy (Middleware)` present.

### Authoritative sources cited (Money)
FDIC (Understanding Deposit Insurance, financial-products-insured, FAQ, EDIE,
**BankFind** certs 57803/33124/4297/27471/5649); Federal Reserve (FOMC,
open-market operations); SEC **Investor.gov** (money-market funds bulletin, CDs);
and each provider's official page — Ally, Marcus/Goldman Sachs, Capital One,
American Express, Discover, YNAB, Monarch, Copilot, Empower, Goodbudget
(pricing + security/disclosure pages). No blogs or aggregators used for facts;
no fabricated experts, statistics, testimonials, rates, or fees.

### Checkpoint commit
- `44377c1` — *Phase C: Money vertical (money.vivahale.com)*. Nothing pushed.
