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
- `bab34e9` — *Phase C: Money vertical (money.vivahale.com)*. Nothing pushed.

## Phase D verification (2026-07-12)

Phase D builds the **Tech vertical** (`tech.vivahale.com`) end to end: an
evidence-first technology product & software publisher on the shared codebase,
plus the config-driven `NEWS_CATEGORIES` cleanup carried from Phase C. Critical
honesty constraint: **Vivahale does not run a hardware/audio/security lab.**
Every rating is derived from analysis of primary documentation (manufacturer
spec sheets, official pricing pages, published security-audit/certification
reports, FCC filings, standards-body publications) — NOT independent lab
testing. Every disputable number cites a primary source with an "as of
2026-07-12" qualifier; every product review carries at least one genuine con.
Health and Money render identically to Phase C.

### What changed (grouped)
- **Config:** `src/lib/verticals/tech.ts` (new) — key `tech`, name `Vivahale
  Tech`, host `tech.vivahale.com`; 5 criteria **Performance 30 / Value 25 /
  Reliability & Security 20 / Ease of Use 15 / Support 10**; tech
  `methodologyIntro` with an explicit no-lab-testing statement; `disclosureLabel:
  "Affiliate Disclosure"` + health-style affiliate `disclosureBody`; general
  editorial `contentDisclaimer` (`contentDisclaimerLabel: "Editorial
  disclaimer"`); shared Vivahale palette read from config; no `extras`/quiz.
  Registered in `verticals/index.ts` (`resolveVerticalFromHost` maps
  `tech.vivahale.com` **and** `tech.localhost` → `tech`, port-stripped).
- **Config-driven cleanup (Phase C carry-over):** `src/app/category/[slug]/page.tsx`
  now reads `getActiveVertical().newsCategorySlugs ?? []` instead of the hardcoded
  `NEWS_CATEGORIES` set. `Vertical.newsCategorySlugs?: string[]` added to
  `verticals/types.ts`; `health.ts` = `["health-news","health-tech-ai"]`
  (verbatim → byte-identical health output), `money.ts` = `["money-news"]`,
  `tech.ts` = `["tech-news"]`.
- **Data:** `src/data/tech/` — `categories.json` (8 sections),
  `authors.json` (one honest "Technology Research Analyst" byline, explicitly a
  documentation-analysis role, NOT a lab tester/engineer), `reviewers.json`
  ("Vivahale Editorial Team", `Editorial`, `is_placeholder:false`, states Vivahale
  does not conduct independent lab testing), `products.json` (10 reviews),
  `hubs.json` (2), `articles.json` (3), empty-valid `news-feeds.json`/`topics.json`.
  Registered in `src/lib/seeds.ts`.
- **Components/pages (config-driven, health byte-identical):** `methodology/page.tsx`
  (+ `TechMethodology` branch), `best/[slug]/page.tsx` (+ tech methodology
  summary with the no-lab-testing line).

### The two hubs + ranked products (key primary sources; as-of 2026-07-12)
All prices/specs independently re-verified against primary sources on
2026-07-12. **One correction applied:** the Sony WF-1000XM6 con that claimed the
launch release "does not specify hi-res codec support" was misleading (the
release touts "Hi-Res Audio Wireless"); reworded to state the release markets
Hi-Res Audio Wireless but does not enumerate a specific codec (e.g. LDAC) or an
IP rating. **0 fabricated experts, benchmarks, statistics, or testimonials.**

- **Best Password Managers of 2026** (`/best/best-password-managers`):
  1. **Bitwarden** — Free (unlimited pw/devices), Premium **$19.80/yr** (raised
     from $9.99 in Jan 2026, first increase in ~10 yrs), Families $47.88/yr;
     open-source (AGPLv3), Cure53 + 2025 ETH Zurich audits, SOC 2 Type 2 / SOC 3
     / ISO 27001. Con: utilitarian UI; price doubled. src: bitwarden.com/pricing,
     /help/is-bitwarden-audited. *(monetized)*
  2. **1Password** — Individual **$2.99/mo** annual ($35.88/yr), Families
     $4.49/mo, 14-day trial, **no free tier**; 128-bit Secret Key, SOC 2 Type 2.
     Con: no free tier; pricier than Bitwarden. src: 1password.com/pricing,
     /security. *(monetized)*
  3. **Proton Pass** — Free (unlimited logins, 10 aliases), Pass Plus **$1.99/mo**
     annual ($23.88/yr, reduced from $3.99); open-source, public audits, 256-bit
     AES-GCM. Con: newest/shortest track record. src: proton.me/pass/pricing,
     /blog/proton-pass-price-change, /pass/security. *(not monetized)*
  4. **Keeper** — Unlimited **$42.99/yr**, Family $91.99/yr (5 users), 30-day
     trial; SOC 2 Type II (10+ yrs), ISO 27001/27017/27018, **FedRAMP High**.
     Con: most expensive individual plan; BreachWatch a paid add-on. src:
     help.keeper.io/article/158, keepersecurity.com/security.html. *(monetized)*
  5. **Dashlane** — paid-only (14-day trial), Premium bundles a VPN, Friends &
     Family covers 10; AES-256 + Argon2d, AWS Nitro Enclaves. Con: no free tier;
     price rendered dynamically so quoted qualitatively (not invented). src:
     dashlane.com/pricing-personal, /security. *(monetized)*
- **Best Wireless Earbuds of 2026** (`/best/best-wireless-earbuds`):
  1. **Apple AirPods Pro 3** — **$249**, H2 chip, mfr-rated up to 8h ANC / 24h
     with case, heart-rate sensor (requires iPhone iOS 26+). Con: ecosystem
     lock-in; 24h total trails rivals. src: apple.com/airpods-pro/specs. *(monetized)*
  2. **Sony WF-1000XM6** — **$329.99**, QN3e processor, 4 mics (up from 3),
     up to 8h ANC / 24h. Con: most expensive here; battery trails Pixel. src:
     Sony official launch press release (prnewswire 302685878). *(monetized)*
  3. **Google Pixel Buds Pro 2** — **$229** (lowest), Tensor A1, up to 8h ANC /
     **30h** total (longest), IP54. Con: deepest features tied to Pixel/Android;
     IP54 < Galaxy's IP57. src: store.google.com/product/pixel_buds_pro_2(_specs).
     *(monetized)*
  4. **Samsung Galaxy Buds3 Pro** — **$249**, **IP57** (most durable), BT 5.4,
     up to 6h ANC / 26h (30h ANC off). Con: AI features need a Galaxy phone; 6h
     per-bud trails rivals. src: samsung.com/us/mobile-audio/galaxy-buds3-pro.
     *(not monetized)*
  5. **Bose QuietComfort Ultra Earbuds (2nd Gen)** — **$299**, Immersive Audio,
     up to 6h (4h w/ Immersive), IPX4, case holds 3 charges, third-party wireless
     charging. Con: shortest battery here; priciest of 3 rivals; no wireless
     charger included. src: bose.com official product page. *(monetized)*

  Monetized items set `is_monetized:true` + `affiliate_url:
  "VIVAHALE_AFFILIATE_PLACEHOLDER"`; both hubs render the Affiliate Disclosure
  and state the weighted, no-lab-testing methodology. No candidate had to be
  swapped or dropped — all 10 verified from primary sources.

### Editorial articles (`src/data/tech/articles.json`, honest author + editorial reviewer)
`what-soc2-and-third-party-audits-tell-you` (cites AICPA/CIMA SOC suite, ISO
27001, FedRAMP), `wireless-earbud-codecs-and-battery-claims-explained` (cites
Bluetooth SIG LE Audio / LC3), `how-to-read-a-laptop-spec-sheet` (cites Intel
ARK, AMD, USB-IF). Every claim cited; each carries the tech editorial
disclaimer. As in Health/Money, `status:draft` seeds surface as non-clickable
cards; full `/articles/[slug]` pages come from the runtime queue, so they are
correctly absent from the crawl/sitemap.

### Tech-mode crawl (production build + `next start`, `NEXT_PUBLIC_VERTICAL=tech`, no Supabase env)
- **34 URLs** crawled recursively from `/` (incl. static assets): home, 2 hubs,
  10 reviews, 8 categories, author, reviewer, 6 static/legal. **All HTTP 200.
  Broken links = 0. Redirects = 0. Soft-404s = 0** (smallest real page ~23 KB).
- Both hubs render the **Affiliate Disclosure**. Of 10 reviews, the **8
  monetized** render the Affiliate Disclosure banner; the **2 non-monetized**
  (Proton Pass, Galaxy Buds3 Pro) render the neutral "does not earn a
  commission" note. **Every review renders a Cons section** (≥1 genuine con).
- `/methodology` renders tech criteria **Performance 30% / Value 25% /
  Reliability & Security 20% / Ease of Use 15% / Support 10%** with the tech
  intro and an explicit no-lab-testing disclosure ("does NOT operate a hardware
  or audio lab", "we do not run independent benchmarks").
- `/sitemap.xml` → **30 `<loc>`s, all on `https://tech.vivahale.com`**, no quiz,
  no health/money URLs. `/robots.txt` + `/feed.xml` use the tech host. Review
  canonical/`og:url`/`og:title` on the tech host and say "Vivahale Tech".
- **Tool gating:** `/quiz/sleep` → **404** in tech mode, absent from nav and
  sitemap (Health keeps it working: 200).

### Health parity + NEWS_CATEGORIES refactor proof (health build, `next start`, no env)
`/`, `/methodology`, `/quiz/sleep` (200), `/best/best-sleep-supplements`,
`/reviews/nature-made-melatonin-3mg`, `/category/health-news`,
`/category/health-tech-ai`, `/sitemap.xml` all **200**, titled **"Vivahale
Health"**; methodology **30/30/20/10/10**; monetized review shows Affiliate +
**Medical disclaimer**; sitemap on `health.vivahale.com`. **Refactor proof:**
captured `/category/health-news`, `/category/health-tech-ai` (news-list layout),
`/category/sleep` (card grid), and `/methodology`, then reverted the tracked
Phase D files to HEAD (`git stash`), rebuilt, and diffed — **rendered content
BYTE-IDENTICAL** in all four (only volatile Turbopack chunk hashes differed).

### Money parity spot-check (`NEXT_PUBLIC_VERTICAL=money` build, `next start`)
`/`, `/methodology`, `/best/best-high-yield-savings-accounts`, `/sitemap.xml`
all **200**, titled **"Vivahale Money"**; methodology **25/25/20/15/15**; hub
renders the **Advertiser Disclosure**; sitemap 100% on `money.vivahale.com`;
`/quiz/sleep` → 404.

### Compliance gate (tech mode; local stores backed up + restored byte-identically)
Cleaned a stale test record left by a prior session (14→13 legitimate rows,
clean SHA `4cbdbbe5…`). Fresh test: monetized social post with no disclosure →
`transitionSocialStatus(→approved)` **REFUSED**: *"Approval blocked: this is a
monetized link but the caption is missing an FTC disclosure ('#ad' or
'affiliate')."* New record stamped `vertical:"tech"`. Adding `#ad` → transition
**succeeds** (→approved). `data/social.local.json` restored to the clean 13-row
baseline (SHA `4cbdbbe5…`, 0 TEST records). No external API called.

### Admin gate (tech mode)
`ADMIN_PASSWORD` set → `/admin` and `/admin/social` = **307 → /admin/login**;
`/admin/login` = 200. Password lived only in the test subshell. Proxy `/admin`
boundary untouched.

### Script safety
`npx tsx` loads `src/lib/social.ts` standalone; with `NEXT_PUBLIC_VERTICAL=tech`
it resolves `SITE_URL = https://tech.vivahale.com` (default → health host).

### Type + build
- `npx tsc --noEmit` → **exit 0, 0 errors.**
- `npm run build` (default health) → **57 pages** (matches Phase C; tech content
  absent, health intact).
- `NEXT_PUBLIC_VERTICAL=money npm run build` → **succeeds** (39 pages).
- `NEXT_PUBLIC_VERTICAL=tech npm run build` → **succeeds**: 40 pages — 2 hubs,
  10 reviews, tech author/reviewer; `ƒ Proxy (Middleware)` present.

### Authoritative sources cited (Tech)
Apple (AirPods Pro 3 tech specs), Sony (WF-1000XM6 official launch press
release), Google Store (Pixel Buds Pro 2 + specs), Samsung (Galaxy Buds3 Pro),
Bose (QC Ultra Earbuds 2nd Gen product page); Bitwarden (pricing + audit page),
1Password (pricing + security), Proton (Pass pricing + price-change blog +
security), Keeper (pricing KB + security page), Dashlane (pricing + security);
plus standards/framework bodies for the editorials — AICPA/CIMA (SOC 2 suite),
ISO (27001), FedRAMP, Bluetooth SIG (LE Audio / LC3), Intel ARK, AMD, USB-IF.
No blogs or aggregators used for product facts; no fabricated experts,
benchmarks, statistics, test results, or testimonials.

### Checkpoint commit
- `d7038e8` — *Phase D: Tech vertical (tech.vivahale.com)*. Nothing pushed.

## Phase E verification (2026-07-12)

Phase E builds the **Education vertical** (`education.vivahale.com`) end to end:
an evidence-first publisher reviewing learning programs and education tools on
the shared codebase. Education overlaps YMYL (career and financial outcomes), so
the honesty bar is high. **Critical honesty constraint: Vivahale does NOT
independently audit schools or programs and does NOT conduct student surveys.**
Every rating is derived from analysis of officially published data — accreditor
databases and the U.S. Department of Education's DAPIP, College Scorecard, the
Bureau of Labor Statistics, standardized bootcamp reports (CIRR), and each
provider's own published pricing, curriculum, and outcomes documentation. Every
disputable number cites a primary source with an "as of 2026-07-12" qualifier;
self-reported outcome figures are labeled self-reported (never presented as
verified); every review carries at least one genuine con. Health, Money, and
Tech render identically to Phase D.

### What changed (grouped)
- **Config:** `src/lib/verticals/education.ts` (new) — key `education`, name
  `Vivahale Education`, host `education.vivahale.com`; 5 criteria **Outcomes 30 /
  Cost & Value 25 / Academics 20 / Support Services 15 / Flexibility 10**;
  education `methodologyIntro` with an explicit no-independent-audit / no-student-
  survey statement; `disclosureLabel: "Affiliate Disclosure"` + house-style
  affiliate `disclosureBody` ("commission if you enroll or subscribe");
  not-academic/career/financial-advice `contentDisclaimer`
  (`contentDisclaimerLabel: "Education disclaimer"`); shared Vivahale palette read
  from config; no `extras`/quiz; `newsCategorySlugs: ["education-news"]`.
  Registered in `verticals/index.ts` (host resolution is generic, so
  `education.vivahale.com` **and** `education.localhost` → `education`).
- **Data:** `src/data/education/` — `categories.json` (8 sections),
  `authors.json` (one honest "Education Research Analyst" byline, explicitly a
  research/data-analysis role, NOT an academic advisor, admissions counselor, or
  licensed counselor), `reviewers.json` ("Vivahale Editorial Team", `Editorial`,
  `is_placeholder:false`, states Vivahale does not audit programs or survey
  students), `products.json` (11 reviews), `hubs.json` (2), `articles.json` (3),
  empty-valid `news-feeds.json`/`topics.json`. Registered in `src/lib/seeds.ts`.
- **Components/pages (config-driven, health byte-identical):** `methodology/page.tsx`
  (+ `EducationMethodology` branch with a repeated no-audit/no-survey disclosure
  and self-reported-labeling section), `best/[slug]/page.tsx` (+ education
  methodology summary with the no-audit disclosure).

### The two hubs + ranked providers (key primary sources; as-of 2026-07-12)
All prices are **US list prices as of 2026-07-12** and are explicitly flagged in
the seeds as varying by region and frequent promotions; each cites the provider's
official pricing page. Efficacy/"learn a language in X hours" claims were
**omitted entirely** (they are company-commissioned), and each review says so.
**No candidate was invented or padded** — every candidate in both hubs was
verified from primary/official sources; none had to be dropped.

- **Best Online Learning Platforms of 2026** (`/best/best-online-learning-platforms`):
  1. **Coursera** — Coursera Plus ~$59/mo or $399/yr; free-to-audit courses;
     certificate ladder up to accredited partner-university degrees. Con: Plus
     excludes some certificates and all degrees; auditing withholds graded work.
     src: coursera.org/courseraplus, /degrees. *(monetized)*
  2. **edX** — most courses free to audit; verified certificates ~$50–$300;
     founded by MIT/Harvard, now 2U-owned. Con: audit tightened since the 2021 2U
     acquisition (time-limited windows). src: help.edx.org (audit vs verified),
     edx.org/verified-certificate. *(not monetized)*
  3. **Khan Academy** — completely free 501(c)(3) nonprofit, no ads. Con: grants
     no accredited degrees/credentials; academic (K-12/early-college) focus. src:
     support.khanacademy.org (cost + not-for-profit articles). *(not monetized)*
  4. **LinkedIn Learning** — subscription (~$239.88/yr, ~$19.99/mo billed
     annually), 1-mo trial, bundled with LinkedIn Premium, library access. Con:
     certificates of **completion**, not accredited credentials. src:
     linkedin.com/learning/subscription/products. *(monetized)*
  5. **Udemy** — à-la-carte courses (frequent discounts) + Personal Plan
     subscription; 30-day refund. Con: **open marketplace → highly variable course
     quality** (per Udemy's own instructor model). src: udemy.com/pricing,
     /teaching. *(monetized)*
  6. **Skillshare** — subscription only ~$167.88/yr ($13.99/mo billed annually).
     Con: **no permanent free tier** (trial only); creative/introductory skew;
     not accredited. src: skillshare.com/en/pricing. *(monetized)*
- **Best Language Learning Apps of 2026** (`/best/best-language-learning-apps`):
  1. **Babbel** — ~$14.99/mo m2m, ~$7.99/mo on 12-mo (~$95.88/yr), Lifetime
     ~$249–$299; Babbel Live extra. Con: only the first lesson is free; low rate
     needs an up-front annual commitment. src: babbel.com/prices,
     support.babbel.com. *(monetized)*
  2. **Duolingo** — genuinely usable free (ad-supported) tier; Super ~$12.99/mo /
     $95.99/yr; Max ~$29.99/mo / $167.99/yr; Family ~$119.99/yr. Con: ads/friction
     on free tier; limited real speaking practice. src: duolingo.com/super.
     *(monetized)*
  3. **Busuu** — free Basic tier; Premium ~$5–$14/mo; native-speaker community
     feedback. Con: community-correction quality uneven (anyone can correct
     regardless of proficiency); free tier limited. src: busuu.com/en/premium-plans,
     help.busuu.com. *(monetized)*
  4. **Pimsleur** — audio-first; Premium ~$19.95/mo, All Access ~$20.95/mo, 7-day
     trial. Con: limited reading/writing practice; among the priciest; no real
     free tier. src: pimsleur.com. *(monetized)*
  5. **Rosetta Stone** — 12-mo ~$143.40; Lifetime listed ~$399, often promo
     ~$179–$219; TruAccent pronunciation feedback. Con: immersion method minimizes
     explicit grammar; lifetime list price high/promo-dependent; feedback is
     automated, not human. src: rosettastone.com/buy. *(monetized)*

  Monetized items set `is_monetized:true` + `affiliate_url:
  "VIVAHALE_AFFILIATE_PLACEHOLDER"`; both hubs render the Affiliate Disclosure and
  state the weighted, no-audit/no-survey methodology. **Self-reported outcomes:**
  none were used as ratings — where numbers could not be verified from a primary
  source (e.g. promotion-sensitive prices, region-specific figures) they are
  described qualitatively and flagged as US list prices subject to change.

### Editorial articles (`src/data/education/articles.json`, honest author + editorial reviewer)
`how-to-check-if-an-online-program-is-accredited` (cites ope.ed.gov/dapip,
ed.gov/accreditation, CHEA), `what-a-certificate-of-completion-means-for-your-resume`
(cites ed.gov/accreditation, DAPIP, CHEA), `how-to-evaluate-a-coding-bootcamp-outcome-claims`
(cites CIRR standards + school-data, BLS Occupational Outlook Handbook). Every
claim cited to authoritative sources; each carries the education content
disclaimer. As in Health/Money/Tech, `status:draft` seeds surface as
non-clickable cards; full `/articles/[slug]` pages come from the runtime queue,
so they are correctly absent from the crawl/sitemap.

### Education-mode crawl (production build + `next start`, `NEXT_PUBLIC_VERTICAL=education`, no Supabase env)
- **32 routes** crawled recursively from `/` (home, 2 hubs, 11 reviews, 8
  categories, author, reviewer, 6 static/legal, favicon). **All HTTP 200.
  Broken links = 0. Soft-404s = 0** (smallest real body ~23 KB).
- Both hubs render the **Affiliate Disclosure**. Of the 11 reviews, the **9
  monetized** render the Affiliate Disclosure banner (education body: "commission
  if you enroll or subscribe"); the **2 non-monetized** (edX, Khan Academy) render
  the neutral "does not earn a commission" note. **Every review renders a Cons
  section** (≥1 genuine con).
- `/methodology` renders education criteria **Outcomes 30% / Cost & Value 25% /
  Academic Quality 20% / Support Services 15% / Flexibility & Access 10%** with
  the education intro and an explicit no-independent-audit disclosure ("does NOT
  independently audit schools", "do not audit schools or survey students", "not
  conduct student surveys"), plus a self-reported-labeling section. The content
  **Education disclaimer** renders instead of the medical/financial one (no
  medical/financial disclaimer leaks).
- `/sitemap.xml` → **31 `<loc>`s, all on `https://education.vivahale.com`**, no
  quiz, no health/money/tech URLs. `/robots.txt` + `/feed.xml` use the education
  host. Review canonical/`og:title` on the education host and say "Vivahale
  Education".
- **Tool gating:** `/quiz/sleep` → **404** in education mode, absent from nav and
  sitemap (Health keeps it working: 200).
- **Portal:** `/portal` and the apex-host rewrite (`Host: vivahale.com`) now show
  **all four** cards — Health, Money, Tech, **Education** — automatically from the
  registry; the Education card links to `https://education.vivahale.com`.

### Health / Money / Tech parity spot-checks
- **Health** (default build): `/`, `/methodology`, `/quiz/sleep` (200),
  `/best/best-sleep-supplements`, `/reviews/nature-made-melatonin-3mg`,
  `/sitemap.xml` all **200**, title **"Vivahale Health"**; methodology
  **30/30/20/10/10**; monetized review shows the **Medical disclaimer**; sitemap
  on `health.vivahale.com`.
- **Money** (`NEXT_PUBLIC_VERTICAL=money`): `/methodology` **25/25/20/15/15**; hub
  renders the **Advertiser Disclosure**; sitemap on `money.vivahale.com`.
- **Tech** (`NEXT_PUBLIC_VERTICAL=tech`): `/methodology` **30/25/20/15/10** with
  the **no-lab-testing** intro ("do not run independent benchmarks"); hub 200;
  sitemap on `tech.vivahale.com`.

### Compliance gate (education mode; local stores backed up + restored byte-identically)
Backed up `data/social.local.json` (SHA `4cbdbbe5…`, 13 rows). Fresh test:
monetized social post with no disclosure → `transitionSocialStatus(→approved)`
**REFUSED**: *"Approval blocked: this is a monetized link but the caption is
missing an FTC disclosure ('#ad' or 'affiliate')."* New record stamped
`vertical:"education"`. Adding `#ad` → transition **succeeds** (→approved,
vertical education). `data/social.local.json` restored byte-identically (SHA
`4cbdbbe5…` before and after; `diff` identical). No external API called.

### Admin gate (education mode)
`ADMIN_PASSWORD` set → `/admin` and `/admin/social` = **307 → /admin/login**;
`/admin/login` = 200. Password lived only in the test subshell. Proxy `/admin`
boundary untouched.

### Script safety
`npx tsx` loads `src/lib/social.ts` standalone; with
`NEXT_PUBLIC_VERTICAL=education` it resolves `SITE_URL =
https://education.vivahale.com` (default → `https://health.vivahale.com`).

### Type + build (all four content modes)
- `npx tsc --noEmit` → **exit 0, 0 errors.**
- `npm run build` (default health) → **57 pages** (matches Phase D; education
  content absent, health intact).
- `NEXT_PUBLIC_VERTICAL=money npm run build` → **succeeds** (39 pages).
- `NEXT_PUBLIC_VERTICAL=tech npm run build` → **succeeds** (40 pages).
- `NEXT_PUBLIC_VERTICAL=education npm run build` → **succeeds**: **41 pages** — 2
  hubs, 11 reviews, education author/reviewer; `ƒ Proxy (Middleware)` present.

### Authoritative sources cited (Education)
U.S. Department of Education (Accreditation in the United States, DAPIP at
ope.ed.gov/dapip, College Scorecard); Council for Higher Education Accreditation
(CHEA); Council on Integrity in Results Reporting (CIRR — standards + school
data); U.S. Bureau of Labor Statistics (Occupational Outlook Handbook); Khan
Academy Help Center (cost + 501(c)(3) not-for-profit); and each provider's
official pricing/curriculum/security documentation — Coursera, edX, LinkedIn
Learning, Udemy, Skillshare, Babbel, Duolingo, Busuu, Pimsleur, Rosetta Stone.
No blogs or aggregators used as the source of record; no fabricated experts,
outcome statistics, salary figures, acceptance/graduation rates, or testimonials.

### Checkpoint commit
- `d96434b` — *Phase E: Education vertical (education.vivahale.com)*.
  Nothing pushed.
