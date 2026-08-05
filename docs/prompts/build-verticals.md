# PROMPT — Build Firsthand into a config-driven multi-vertical publisher

> Paste this whole document into the prompt-loop tool. It is written to be run
> **iteratively**: each loop completes ONE phase/vertical, verifies it, reports,
> and stops. Do not attempt everything in a single pass.

---

## 0) ROLE & MISSION

You are a senior full-stack engineer working in the **Firsthand** Next.js repo.
Firsthand today is a single health-review site. Your mission is to evolve it into
a **config-driven, single-codebase, multi-vertical authority publisher** — the
structure of **U.S. News & World Report** — WITHOUT breaking the existing Health
vertical, and WITHOUT compromising the honesty/compliance standards already in
the code.

```
U.S. News                         →   Firsthand
usnews.com (portal)               →   readfirsthand.com            (brand portal)
health.usnews.com                 →   health.readfirsthand.com     (VERTICAL #1 — DONE, reference impl)
money.usnews.com                  →   money.readfirsthand.com      (to build)
education.usnews.com              →   education.readfirsthand.com  (to build)
travel.usnews.com                 →   travel.readfirsthand.com     (to build)
cars.usnews.com / 360 Reviews     →   tech.readfirsthand.com       (to build)
```

**Terminology (use it precisely):**
- **Vertical** = a subdomain-level property (Health, Money, Education…). US News calls these its channels.
- **Category / Section** = a topic *inside* a vertical (e.g. Health → Sleep, Weight Loss). These already exist as `Category`.
- **Money page** = a monetized ranking (`Hub`, "Best X of YYYY") or a `Product`/provider review (`/reviews/[slug]`).
- **Editorial content** = non-monetized `Article` of type `education` | `news` | `reddit_roundup`.

---

## 1) CURRENT ARCHITECTURE (ground truth — verify before trusting)

**Stack:** Next.js 16 (App Router, Turbopack; middleware is renamed **`proxy`** in
`src/proxy.ts`), React 19, Tailwind v4, TypeScript, optional Supabase.

**⚠️ This is a MODIFIED Next.js.** Per `AGENTS.md`, before writing ANY Next.js
code (routing, metadata, proxy, caching, image, OG) you MUST read the relevant
guide under `node_modules/next/dist/docs/` and honor deprecation notices. Do not
rely on training-data Next.js conventions.

**Dual-mode data layer** (`src/lib/db.ts`, `src/lib/queue.ts`, `src/lib/social.ts`):
- If `NEXT_PUBLIC_SUPABASE_URL` **and** `SUPABASE_SERVICE_ROLE_KEY` are set → read/write Supabase (`supabase/migrations/*.sql`).
- Otherwise → transparently fall back to committed JSON seeds in `src/data/*.json` and gitignored local stores in `data/*.local.json`.
- **Every accessor must keep working in BOTH modes.** This is a hard rule.

**Core entities** (`src/lib/types.ts`, mirrored in `supabase/migrations/0001_init.sql`):
- `Category` — a section within the vertical.
- `Author` — honest byline (Health uses "Health Research Analyst, MSc" — a data analyst, NOT a doctor).
- `Reviewer` — **editorial fact-check, NOT fabricated medical review.** Current record: "Firsthand Editorial Team", slug `editorial-team`, `is_placeholder: false`, `credential_type: "Editorial"`. See §2.
- `Product` — a reviewed product/provider (spoke). Has `ratings: CriterionRatings` (safety/evidence/cost_value/transparency/support), pros/cons, `pricing_table`, `faq`, `evidence_points` (each a claim + `source_name` + `source_url`), `is_monetized`, `affiliate_url` (literal `"FIRSTHAND_AFFILIATE_PLACEHOLDER"` until real links wired).
- `Hub` — "Best X of YYYY" ranked money page; `product_slugs` is the ordered ranking.
- `Article` — editorial content (`education` | `news` | `reddit_roundup`).

**Routes** (`src/app/`): `/`, `/category/[slug]`, `/best/[slug]` (hubs), `/reviews/[slug]`
(products), `/articles/[slug]`, `/authors/[slug]`, `/reviewers/[slug]`, legal pages
(`/about`, `/methodology`, `/editorial-policy`, `/privacy`, `/terms`,
`/affiliate-disclosure`, `/contact`), `/quiz/sleep`, `/admin/*`, `/api/*`,
`/feed.xml`, `/sitemap.ts`, `/robots.ts`, `/api/og`.

**Branding seam** (`src/lib/site.ts`): `SITE_NAME`, `SITE_URL`
(`NEXT_PUBLIC_SITE_URL` || `https://readfirsthand.com`), `SITE_DESCRIPTION`,
`NAV_CATEGORIES`, `NAV_PRIMARY_COUNT`. **This is the single file to generalize
first** — it is imported by `layout.tsx`, `sitemap.ts`, `robots.ts`,
`feed.xml`, `api/og`, header/footer.

**Compliance & honesty already enforced (DO NOT REGRESS):**
- **No fabricated experts.** Never invent a credentialed reviewer or attach a real
  person's name/credentials without consent. Health uses an honest "Editorial
  Team" fact-check and explicitly states it does not employ a licensed physician.
- **FTC disclosure.** Any monetized caption/link must carry `#ad`/"affiliate".
  Enforced in `src/lib/social.ts` (`hasDisclosure`, `transitionSocialStatus`) and
  the queue approval gate (`src/lib/queue.ts`). Money pages render an
  `AffiliateDisclosure`.
- **Cited claims.** `evidence_points[].source_url` must point to real, authoritative
  primary sources (.gov / peer-reviewed / official docs), not blogs.
- **Every con list must contain a genuine drawback.** No all-positive reviews.

**Social automation** (already built): `social:generate` → `social:autopilot`
(auto-schedule) → `social:send`, plus `.github/workflows/daily-social.yml`. Any
new vertical's content must flow through this same pipeline unchanged.

---

## 2) NON-NEGOTIABLE GROUND RULES

1. **Never break the Health vertical.** It is the reference implementation. After
   every change, Health must render identically (same routes, same content) when
   the active vertical is `health`.
2. **Dual-mode always.** Both Supabase and local-JSON paths must compile and work.
3. **Honesty > growth.** No fake authors/reviewers/credentials, no fabricated
   testimonials, no invented statistics. Money and Health are **YMYL** — hold them
   to the highest sourcing bar. Financial pages carry a clear "not financial
   advice" disclaimer; health pages keep the medical disclaimer.
4. **Compliance parity.** Every vertical gets the correct disclosure language
   (health/affiliate; money/"advertiser disclosure"; etc.) and disclaimers. Never
   ship a monetized page without disclosure.
5. **Type-safe & clean.** `npx tsc --noEmit` must pass. No `any` escapes to dodge
   the vertical refactor.
6. **No secrets committed.** `.env*` stays gitignored (only `.env.example`).
   Never hardcode tokens.
7. **Read the local Next.js docs first** (see §1). 
8. **Small, verifiable steps.** One phase/vertical per loop iteration, each with
   the verification in §8 and a report in §9.

---

## 3) TARGET ARCHITECTURE — the vertical config system

Build a first-class `Vertical` abstraction and route everything through it.

### 3.1 Vertical config module — `src/lib/verticals/`
Create `src/lib/verticals/types.ts` and one config file per vertical
(`health.ts`, `money.ts`, …) plus an `index.ts` registry.

```ts
// src/lib/verticals/types.ts  (illustrative — refine as needed)
export interface RatingCriterion { key: string; label: string; weight: number; } // weights sum to 1
export interface Vertical {
  key: string;                 // "health"
  name: string;                // "Firsthand Health"
  host: string;                // "health.readfirsthand.com"
  tagline: string;
  description: string;         // SITE_DESCRIPTION for this vertical
  theme: { brandNavy: string; brandBlue: string; brandMist: string; /* … Tailwind tokens */ };
  navPrimaryCount: number;
  // Content the vertical owns (data lives under src/data/<key>/*.json):
  categories: string[];        // ordered slugs shown in nav
  // Methodology is per-vertical — Health ≠ Money:
  criteria: RatingCriterion[]; // replaces the hardcoded CriterionRatings shape
  methodologyIntro: string;
  // Compliance/disclaimers per vertical:
  disclosureLabel: string;     // "Affiliate disclosure" | "Advertiser disclosure"
  disclosureBody: string;
  contentDisclaimer: string;   // medical / financial / general
  // Optional per-vertical extras (quizzes, tools) declared here.
}
```

**Criteria generalization is required.** `CriterionRatings` today is a fixed
health shape (`safety/evidence/cost_value/transparency/support`). Replace fixed
usage with a `Record<string, number>` keyed by the active vertical's
`criteria[].key`, and drive all rating UI (`RatingBadge`, `ComparisonTable`,
`EvidenceList`, `/methodology`) from `vertical.criteria`. Keep Health's five keys
so Health data is unchanged.

### 3.2 Vertical resolution
- **Production:** resolve from the request **host** in `src/proxy.ts`
  (`health.readfirsthand.com` → `health`; apex `readfirsthand.com` → portal). Read the Next
  16 proxy docs first; expose the resolved vertical to server components (header,
  or a request-scoped accessor).
- **Dev/build/scripts:** allow override via env `NEXT_PUBLIC_VERTICAL`
  (default `health`). Scripts (`social:*`, `content:*`) must respect it so a run
  targets one vertical's data.
- Provide `getActiveVertical()` used by `site.ts`, `db.ts`, and pages.

### 3.3 Refactor `src/lib/site.ts`
Derive `SITE_NAME`, `SITE_URL`, `SITE_DESCRIPTION`, `NAV_CATEGORIES`,
`NAV_PRIMARY_COUNT` from `getActiveVertical()`. Keep the same exported names so
existing imports (`layout.tsx`, `sitemap.ts`, `feed.xml`, `api/og`, header) keep
working. `SITE_URL` for Health becomes `https://health.readfirsthand.com` (overridable
by `NEXT_PUBLIC_SITE_URL`). Also update the inlined `SITE_URL` in
`src/lib/social.ts` to be vertical-aware (it is duplicated there on purpose for
Node-script safety — keep it script-safe).

### 3.4 Refactor the data layer for per-vertical seeds
- Move Health seeds into `src/data/health/` (`categories.json`, `authors.json`,
  `reviewers.json`, `products.json`, `hubs.json`, `articles.json`,
  `news-feeds.json`, `topics.json`).
- `src/lib/db.ts` loads the **active vertical's** seed set. Since JSON imports are
  static, build a small registry mapping vertical key → imported seeds (import all
  verticals' JSON, select by active key) so bundling stays static and type-safe.
- **Supabase path:** add migration `0004_verticals.sql` adding a `vertical text
  not null default 'health'` column to `categories`, `authors`, `reviewers`,
  `products_providers`, `articles`, `social_posts`, and to the local stores'
  records; every query filters by the active vertical. Update
  `supabase/migrations` + the row/seed types. Backfill existing rows to `health`.

### 3.5 The brand portal (`readfirsthand.com`)
When the host is the apex (or `NEXT_PUBLIC_VERTICAL=portal`), render a lightweight
**portal**: hero + a card grid of live verticals (name, tagline, link to the
subdomain), shared footer, no vertical content. Keep it in the same app (a
`portal` pseudo-vertical or a host-branch in the root route). SEO: portal has its
own canonical/OG; it does NOT duplicate vertical content.

---

## 4) WORK PLAN (each phase = one loop iteration)

**Phase A — Vertical scaffolding (no new content yet).**
Build §3.1–3.4 for `health` only. Move Health seeds under `src/data/health/`.
Health must render byte-for-byte equivalently at `NEXT_PUBLIC_VERTICAL=health`.
Acceptance: §8 passes; crawling the local site shows the same routes/content as
before; `tsc` clean.

**Phase B — Re-scope Health branding + the portal.**
Health → `Firsthand Health` @ `health.readfirsthand.com` (canonical/OG/sitemap/feed/
social all use the health host). Build the `readfirsthand.com` portal (§3.5) listing
Health as the one live vertical. Acceptance: §8; portal renders; Health canonical
URLs are on the health subdomain.

**Phase C … N — Add one vertical per iteration** (order below), each following the
§5 checklist. Recommended order (highest revenue-intent / clearest sourcing first):
1. **Money** (`money.readfirsthand.com`)
2. **Tech / Product Reviews** (`tech.readfirsthand.com`)
3. **Education** (`education.readfirsthand.com`)
4. **Travel** (`travel.readfirsthand.com`)
5. **Home** (`home.readfirsthand.com`) — optional/later

Do NOT start a new vertical until the previous one passes §8.

---

## 5) PER-VERTICAL BUILD CHECKLIST (repeat for each new vertical)

For vertical `<V>`:
1. **Config:** add `src/lib/verticals/<V>.ts` (name, host, description, theme,
   `criteria` appropriate to `<V>`, disclosure + disclaimer language) and register it.
2. **Sections:** `src/data/<V>/categories.json` — 6–10 real sections (see §6).
3. **People:** `authors.json` (honest byline appropriate to the domain — e.g.
   Money → "Consumer Finance Analyst", NOT a fake CFP) and `reviewers.json`
   (an honest **Editorial Team** fact-check, `is_placeholder: false`, mirroring
   Health; never a fabricated licensed professional).
4. **Money pages:** at least **2 hubs** ("Best X of YYYY") each ranking **4–6
   products/providers**, plus the individual `products.json` review records for
   every ranked item. Every product: real pros AND real cons, `pricing_table`,
   `faq`, and **cited `evidence_points`** to authoritative sources (§6). Monetized
   items use the `FIRSTHAND_AFFILIATE_PLACEHOLDER` and render the correct
   disclosure.
5. **Editorial:** 2–3 `education`/`news` `articles.json` entries with cited sources.
6. **Compliance:** correct `disclosureLabel`/`contentDisclaimer` for `<V>`
   (Money = "advertiser disclosure" + "not financial advice"; etc.). Verify a
   monetized page cannot pass the queue/social gates without disclosure.
7. **Nav/theme:** categories appear in the header; theme tokens applied.
8. **Verify:** run §8. Fix everything before reporting.

**Content quality bar (all verticals):** neutral, evidence-first, no hype, no
fabricated numbers, every ranking explains its methodology, every claim that
could be disputed is cited. Match the tone of the existing Health copy.

---

## 6) VERTICAL DEFINITIONS (starting specs — expand sensibly)

> Sections and money-page ideas are a starting point; refine to what you can
> source credibly. NEVER invent data to fill a table.

**Money — `money.readfirsthand.com`** (YMYL; disclosure = "Advertiser Disclosure";
disclaimer = "informational only, not financial/investment advice").
- Criteria (example): `fees` (0.25), `value_returns` (0.25), `transparency`
  (0.2), `security_trust` (0.15), `support` (0.15).
- Sections: Credit Cards, High-Yield Savings, Brokerages & Investing, Personal
  Loans, Budgeting Apps, Tax Software, Insurance, Business Banking.
- Money pages: "Best High-Yield Savings Accounts", "Best Brokerages for
  Beginners", "Best Budgeting Apps".
- Authoritative sources: CFPB, FDIC/NCUA, SEC/FINRA, IRS, Federal Reserve,
  company disclosures/fee schedules.

**Tech / Product Reviews — `tech.readfirsthand.com`** (disclosure = "Affiliate
Disclosure"; disclaimer = general).
- Criteria (example): `performance` (0.3), `value` (0.25), `reliability` (0.2),
  `ease_of_use` (0.15), `support` (0.1).
- Sections: Laptops, Phones, Wearables, Smart Home, Headphones, Software/SaaS,
  AI Tools.
- Sources: manufacturer spec sheets, standardized benchmark bodies, regulatory
  (FCC) filings, primary testing methodology you disclose.

**Education — `education.readfirsthand.com`** (disclaimer = informational).
- Criteria (example): `outcomes` (0.3), `cost_value` (0.25), `academics` (0.2),
  `support_services` (0.15), `flexibility` (0.1).
- Sections: Online Degrees, Bootcamps, Certifications, Test Prep, K-12 Resources,
  Student Loans (cross-links Money).
- Sources: IPEDS/NCES, Dept. of Education College Scorecard, BLS, accreditor data.

**Travel — `travel.readfirsthand.com`** (disclosure = "Affiliate Disclosure").
- Criteria (example): `value` (0.3), `experience` (0.25), `location` (0.2),
  `amenities` (0.15), `service` (0.1).
- Sections: Destinations, Hotels, Travel Cards (cross-links Money), Cruises,
  Travel Insurance, Gear.
- Sources: official tourism boards, DOT, airline/hotel published policies.

---

## 7) THINGS THAT WILL BITE YOU (handle explicitly)

- **Static JSON imports:** you can't dynamically `import()` a seed by runtime
  string and keep it statically bundled. Build a compile-time registry object
  `{ health: {...seeds}, money: {...seeds} }` and index by active key.
- **`CriterionRatings` is load-bearing:** it's referenced in `types.ts`,
  `products.json`, `RatingBadge`, `ComparisonTable`, `/methodology`, and possibly
  JSON-LD. Generalize to keyed records everywhere in one coherent change; keep
  Health's 5 keys so Health data doesn't change.
- **`src/lib/social.ts` inlines `SITE_URL`** for Node-script safety — keep it
  importing only Node builtins + supabase-js; make it read `NEXT_PUBLIC_SITE_URL`
  / `NEXT_PUBLIC_VERTICAL` env, not `@/lib/site`.
- **`proxy.ts` is the admin security boundary** — do not weaken the existing
  `/admin` auth gate while adding host-based vertical resolution.
- **`/quiz/sleep`** is Health-specific — gate vertical-specific tools behind the
  vertical config so they don't 404/leak into other verticals' nav.
- **Sitemap/feed/robots** must emit only the active vertical's URLs on that
  vertical's host, and the portal must have its own minimal sitemap.
- **CI is stateless without Supabase** (local stores are gitignored). Multi-
  vertical content that must persist in CI implies Supabase with the `vertical`
  column — note this in `docs/` and the daily-social workflow.

---

## 8) VERIFICATION (run every iteration; all must pass)

```bash
npx tsc --noEmit                                   # zero errors
npm run build                                      # production build succeeds
NEXT_PUBLIC_VERTICAL=health npm run dev            # Health renders unchanged
NEXT_PUBLIC_VERTICAL=<new> npm run dev             # new vertical renders
```
Then, for the running vertical, **crawl for broken links and soft-404s** (reuse
the approach in the repo's earlier link audit): every internal route returns 200
with real content; images load; monetized pages show the correct disclosure;
`/methodology` reflects the vertical's own criteria. Confirm a monetized post is
REFUSED by `social:autopilot`/`social:send` when its caption lacks disclosure.

**Definition of done for a vertical:** config + sections + honest people + ≥2
hubs with ≥4 cited, con-bearing reviews each + ≥2 cited articles render at its
host; Health still passes; `tsc` + `build` clean; correct disclosures/disclaimers;
no secrets; no fabricated experts or data.

---

## 9) REPORT FORMAT (end every iteration with this)

- **Phase/vertical:** which one you completed.
- **Files added/changed:** grouped (config / data / components / migrations / docs).
- **Verification results:** paste the `tsc`/`build` outcome + crawl summary
  (routes checked, broken=0, disclosures present).
- **Honesty/compliance notes:** confirm no fabricated experts/data; list the
  authoritative sources cited.
- **Assumptions & open questions** for the human.
- **Next iteration:** the single next phase/vertical to run.

Then STOP and wait for the next loop.

---

## 10) FIRST ITERATION

Do **Phase A** only (vertical scaffolding for Health; move seeds under
`src/data/health/`; generalize `site.ts`, `db.ts`, criteria; add vertical
resolution). Verify per §8 that Health is byte-for-byte equivalent. Report per
§9. Do not start Money until Phases A and B are green.
```
