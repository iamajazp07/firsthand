# Firsthand — Refactor Baseline

Read-only reconnaissance snapshot taken **before** any multi-vertical refactor.
This is the parity reference: Health must render identically after later changes.

## Provenance

- **Copied from (SOURCE, never modified):** `/Users/ajazahamed/prompt-loop/workspaces/run-2026-07-10T21-54-40/firsthand`
- **Copied to (this workspace):** `/Users/ajazahamed/prompt-loop/workspaces/run-2026-07-12T11-23-59/firsthand`
- **Copy method:** `rsync -a` excluding `node_modules`, `.next`, `tsconfig.tsbuildinfo`, `.DS_Store`. `.git` and all dotfiles preserved. Old workspace `state.json` NOT copied.
- **Git integrity:** SOURCE and COPY both at HEAD `b5d2343`. SOURCE `git status` shows only the pre-existing untracked `docs/prompts/` (present before copy) — source untouched. `npm install` re-run in the copy: **added 370 packages, exit 0** (2 moderate audit vulns, non-blocking). `node_modules/next/dist/docs/` confirmed present after install.

---

## Part 2a — Stack versions (package.json)

| Dependency | Version | Notes |
|---|---|---|
| next | `16.2.10` | Next.js 16 ✓ (Turbopack dev) |
| react | `19.2.4` | React 19 ✓ |
| react-dom | `19.2.4` | ✓ |
| @supabase/supabase-js | `^2.110.2` | Supabase deps **present** ✓ |
| tailwindcss | `^4` | Tailwind v4 ✓ |
| @tailwindcss/postcss | `^4` | v4 PostCSS plugin |
| typescript | `^5` | TypeScript ✓ |
| eslint | `^9` | + eslint-config-next `16.2.10` |
| @types/node | `^20`, @types/react `^19`, @types/react-dom `^19` | |

All expected: Next 16, React 19, Tailwind v4, TypeScript, Supabase — **confirmed**.

---

## Part 2b — Middleware / proxy (`src/proxy.ts`)

Confirmed present (Next 16 renames `middleware` → `proxy`). It is the **PRIMARY `/admin` security boundary**.

- Exports `proxy(request)` + `config.matcher: ["/admin/:path*", "/api/admin/:path*"]`.
- **Why it exists (from the file's own header):** a layout gate runs too late — Next still renders the protected PAGE to produce its RSC flight payload, leaking queue items / social drafts into the HTML body even behind a 403. A proxy runs *before* any route renders, so an unauthenticated request never executes the page.
- Auth: mirrors `src/lib/admin-auth.ts` exactly — cookie `vh_admin_session`, HMAC key `firsthand-admin-session-v1`, token = `HMAC-SHA256(key, ADMIN_PASSWORD)`, compared with `timingSafeEqual`.
- `/admin/login` + `/api/admin/login` stay reachable unauthenticated.
- **No `ADMIN_PASSWORD` set:** production → hard `403` (blocks flight-data leak); development → dev-open (layout shows a banner).
- Runs on Node.js runtime (Next 16 proxy default; `runtime` segment option is disallowed in proxy).

> ⚠️ **Do not weaken this gate during the refactor.** Any change to `/admin` routing must keep the proxy matcher covering every admin + admin-API path.

---

## Part 2c — Modified Next.js docs (`node_modules/next/dist/docs/`)

Docs are **nested** (not flat): `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`, `index.md`.
Key app docs under `01-app/01-getting-started/`:

- `03-layouts-and-pages.md` (routing/pages), `04-linking-and-navigating.md`, `15-route-handlers.md` (route handlers)
- `08-caching.md` (caching), `09-revalidating.md`
- `12-images.md` (image), `13-fonts.md`
- `14-metadata-and-og-images.md` (metadata + OG combined), `16-proxy.md` (proxy)
- File-conventions API: `03-api-reference/03-file-conventions/{proxy.md, route.md, dynamic-routes.md, route-groups.md, ...}`

### Proxy doc (`16-proxy.md` + file-conventions `proxy.md`) — conventions differing from stock Next
1. **Middleware is renamed to Proxy** as of Next 16 — same functionality, new name/file.
2. Convention: single `proxy.ts` (or `.js`) at project root **or inside `src/`** (this repo uses `src/proxy.ts`). Only one proxy file per project.
3. Export the function as `export function proxy(request)` or `export default` — a named `proxy` export is first-class.
4. **Proxy defaults to the Node.js runtime** (v16 change; was Edge). The `runtime` config option is **not available** and throws if set — so Node `crypto` is usable directly (this repo relies on that).
5. Without a `matcher`, proxy runs on **every** request incl. `_next/static`, `_next/image`, `public/` — use matchers/negative patterns to avoid blocking assets.
6. `matcher` accepts a string, an array, regex path patterns, and objects with `source`/`locale`/`has`/`missing` conditions.
7. Explicitly **not** for slow data fetching or full session/authorization management — meant for optimistic checks, redirects, header/cookie rewrites; may be deployed to a CDN edge in front of the app.
8. Pass data to the app via headers/cookies/rewrites/redirects/URL — do not rely on shared modules/globals across proxy and render.

### Metadata doc (`14-metadata-and-og-images.md`) — conventions
1. Three metadata mechanisms: static `metadata` object, dynamic `generateMetadata()`, and special file conventions (favicon, `opengraph-image`, `robots`, `sitemap`).
2. `metadata` / `generateMetadata` are **Server-Component only**.
3. `generateMetadata({ params, searchParams })` receives **`params` as a Promise** — you must `await params` (Next 15/16 async params).
4. Two default meta tags (charset, viewport) are always injected even without metadata.
5. **Streaming metadata:** for dynamically-rendered pages Next streams metadata separately (visual content first); **disabled for bots/crawlers** (Twitterbot, Slackbot, Bingbot) so they see it in `<head>`. Tunable via `htmlLimitedBots`.
6. Use React `cache()` to memoize a data fetch shared between `generateMetadata` and the page (avoid duplicate requests).
7. File-based metadata: `robots.txt`, `sitemap.xml`, `opengraph-image`/`twitter-image`, favicons — can be static files or code-generated (`.ts`/`.tsx`).
8. Dynamic OG via `ImageResponse` from **`next/og`** (JSX + CSS → PNG via satori/resvg). **Only flexbox + a CSS subset** — `display:grid` and advanced layouts are unsupported; deeper `opengraph-image` files override shallower ones.

---

## Part 2d — Data layer (dual-mode)

Confirmed: `src/lib/db.ts`, `src/lib/queue.ts`, `src/lib/social.ts` all exist.

**Dual-mode pattern (all three modules):** `isSupabaseConfigured = Boolean(NEXT_PUBLIC_SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)`. When both set → query Supabase; otherwise → local JSON seeds in `src/data/*.json` plus gitignored `data/*.local.json`. Return types identical in both modes. Modules are server-only (may hold service-role key).

**Seed files in `src/data/`:**
`articles.json`, `authors.json`, `categories.json`, `hubs.json`, `news-feeds.json`, `products.json`, `reviewers.json`, `topics.json`.
(db.ts imports only categories/authors/reviewers/articles/products/hubs; news-feeds & topics are used by the content/news scripts.)

**Gitignored local stores in `data/`:** `queue.local.json`, `social.local.json`, `news-seen.local.json`, plus `subscribers.local.json` (written by `addSubscriber`), and `briefs/` + `drafts/` dirs. These were copied by rsync (they are present in the source working tree).

**Exported accessors in `db.ts`:**
`isSupabaseConfigured`, `getCategories`, `getCategoryBySlug`, `getAuthors`, `getAuthorBySlug`, `getReviewers`, `getReviewerBySlug`, `getArticles`, `getArticlesByCategory`, `getArticlesByAuthor`, `getProducts`, `getProductBySlug`, `getProductsByCategory`, `getHubs`, `getHubBySlug`, `getHubsByCategory`, `addSubscriber` (+ `AddSubscriberResult` interface).

---

## Part 2e — Types (`src/lib/types.ts`)

Entities confirmed present: `Category`, `Author`, `Reviewer`, `Product`, `Hub`, `Article` (plus `ProductProvider`, `SocialPost`, `EmailSubscriber`, `PricingPlan`, `FaqItem`, `EvidencePoint`, and enums `ArticleType`, `ArticleStatus`).

### `CriterionRatings` — exact current definition
```ts
/** Per-criterion review scores (0–10), matching the /methodology criteria. */
export interface CriterionRatings {
  safety: number;
  evidence: number;
  cost_value: number;
  transparency: number;
  support: number;
}
```

### Files referencing `CriterionRatings` (type identifier)
- `src/lib/types.ts` — definition; used as `Product.ratings: CriterionRatings`.
- `src/components/review/RatingBadge.tsx` — `import type { CriterionRatings }`; `CRITERIA: Array<{ key: keyof CriterionRatings; ... }>`; prop `ratings: CriterionRatings`.

### The five criterion keys (`safety`, `evidence`, `cost_value`, `transparency`, `support`) as an object shape
- **Rendered** in `src/components/review/RatingBadge.tsx` (the `CRITERIA` array maps each key → label + weight).
- **Data** carrying these keys: `src/data/products.json` (each product's `ratings` object).
- (A broad text grep for the individual words matches many unrelated prose uses across page/component files — the *structural* `CriterionRatings` shape lives only in the two files above + products.json data.)

> ⚠️ Refactor risk: `CriterionRatings` is a fixed 5-key shape hard-wired to the Health `/methodology`. A multi-vertical refactor that needs per-vertical criteria will touch `types.ts`, `RatingBadge.tsx`, and every product's `ratings` in `products.json`.

---

## Part 2f — Branding seam (`src/lib/site.ts`)

Exports: `SITE_NAME` (`"Firsthand"`), `SITE_URL` (`NEXT_PUBLIC_SITE_URL` || `https://readfirsthand.com`, trailing slash stripped), `SITE_DESCRIPTION`, `NAV_PRIMARY_COUNT` (`6`), `NAV_CATEGORIES` (11 name/slug pairs — static so the client Header needs no server data layer).

### Files importing from `@/lib/site`
- `src/app/articles/[slug]/page.tsx` — SITE_NAME, SITE_URL
- `src/app/authors/[slug]/page.tsx` — SITE_URL
- `src/app/best/[slug]/page.tsx` — SITE_NAME, SITE_URL
- `src/app/feed.xml/route.ts` — SITE_DESCRIPTION, SITE_NAME, SITE_URL
- `src/app/layout.tsx` — SITE_DESCRIPTION, SITE_NAME, SITE_URL
- `src/app/reviewers/[slug]/page.tsx` — SITE_URL
- `src/app/reviews/[slug]/page.tsx` — SITE_NAME, SITE_URL
- `src/app/robots.ts` — SITE_URL
- `src/app/sitemap.ts` — SITE_URL
- `src/components/Footer.tsx` — NAV_CATEGORIES
- `src/components/Header.tsx` — NAV_CATEGORIES, NAV_PRIMARY_COUNT
- `src/components/review/Breadcrumbs.tsx` — SITE_URL

(No relative-path imports of `lib/site` — all use the `@/lib/site` alias.)

---

## Part 2g — Routes (`src/app/` tree)

```
src/app/
  layout.tsx  page.tsx  globals.css  favicon.ico
  robots.ts  sitemap.ts
  feed.xml/route.ts
  about/page.tsx
  methodology/page.tsx
  editorial-policy/page.tsx
  privacy/page.tsx
  terms/page.tsx
  affiliate-disclosure/page.tsx
  contact/page.tsx
  quiz/sleep/page.tsx
  category/[slug]/page.tsx
  best/[slug]/page.tsx
  reviews/[slug]/page.tsx
  articles/[slug]/page.tsx
  authors/[slug]/page.tsx
  reviewers/[slug]/page.tsx
  admin/
    login/page.tsx
    actions.ts  social-actions.ts
    (protected)/layout.tsx  (protected)/page.tsx
    (protected)/queue/[id]/page.tsx  (protected)/queue/[id]/QueueEditor.tsx
    (protected)/social/page.tsx  (protected)/social/SocialQueueTable.tsx
  api/
    admin/login/route.ts
    og/route.tsx
    subscribe/route.ts
```

**Expected vs actual:** all expected routes present — `/`, `/category/[slug]`, `/best/[slug]`, `/reviews/[slug]`, `/articles/[slug]`, `/authors/[slug]`, `/reviewers/[slug]`, `/about`, `/methodology`, `/editorial-policy`, `/privacy`, `/terms`, `/affiliate-disclosure`, `/contact`, `/quiz/sleep`, `/admin/*`, `/api/*`, `feed.xml`, `sitemap.ts`, `robots.ts`, `/api/og`. **Extras (not mismatches):** `/api/subscribe`, admin `(protected)` route-group with `/admin/queue/[id]` and `/admin/social`.

---

## Part 2h — Migrations (`supabase/migrations/`)

Files: `0001_init.sql`, `0002_queue.sql`, `0003_social.sql`.

**`0001_init.sql` tables** (mirror `src/lib/types.ts`):
- Enums: `article_type('hub','review','education','reddit_roundup','news')`, `article_status('draft','in_review','approved','scheduled','published')`, `reviewer_credential('RD','MD')`.
- `categories` (slug unique, sort_order, indexed)
- `authors` (byline; no medical creds implied)
- `reviewers` (credential_type `reviewer_credential`, is_placeholder)
- `products_providers` (slug unique, category_id FK, is_monetized, affiliate_url, pricing_json/metadata jsonb) — the slim provider table (rich `products` review shape is seed-only until a future migration)
- `articles` (slug unique, type/status enums, author/reviewer FKs, compliance_json, sources_json, published/scheduled timestamps, indexed)
- `social_posts` (article_id FK cascade, platform, caption, status, scheduled_at)
- `email_subscribers` (email unique, source)

> ⚠️ **Mismatch:** SQL enum `reviewer_credential` = `('RD','MD')`, but TS `Reviewer.credential_type` = `"RD" | "MD" | "Editorial"` and the seed reviewer is the "Editorial" fact-check team. In Supabase mode an `Editorial` reviewer would violate the enum. Seed/local mode is unaffected. Note before enabling Supabase.

---

## Part 2i — Compliance code (FTC disclosure enforcement)

### `src/lib/social.ts`
`SITE_URL` is **inlined** (line 104) and social.ts does **NOT** import `@/lib/site` — confirmed (only mentions it in comments as "mirrors src/lib/site.ts"):
```ts
export const SITE_URL = "https://readfirsthand.com";
```
Disclosure helper + approval gate:
```ts
export function hasDisclosure(caption: string): boolean {
  const c = (caption ?? "").toLowerCase();
  return /#ad\b/.test(c) || c.includes("affiliate");
}
export const DISCLOSURE_TOKEN = "#ad";

// inside transitionSocialStatus():
// FTC disclosure gate on approval (server-side, never trust the UI).
if (newStatus === "approved" && item.is_monetized_link && !hasDisclosure(item.caption)) {
  return {
    ok: false,
    error:
      "Approval blocked: this is a monetized link but the caption is missing an FTC disclosure ('#ad' or 'affiliate').",
  };
}
```
State machine: `draft→approved→scheduled→sent|failed|skipped` (+ any→draft); scheduling requires `scheduled_at`.

### `src/lib/queue.ts` — content queue approval gate
```ts
// inside transitionStatus():
// Compliance gate on approval.
if (newStatus === "approved") {
  const result = evaluateCompliance(item, opts);
  if (!result.passed) {
    return {
      ok: false,
      error: "Approval blocked: compliance checklist has failing checks.",
      failures: result.failures,
    };
  }
}
```
State machine: `draft→in_review→approved→scheduled→published` (+ any→draft). Approval runs the server-side compliance checklist (affiliate disclosure / cons+red-flags / pricing verified / no fabricated sources / placeholder-reviewer blocks approval in production for review+hub_update). `published` reachable only from approved/scheduled and stamps `published_at`. Both gates are enforced server-side, never trusting the UI.

---

## Part 2j — AGENTS.md

```
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all
differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
```
`CLAUDE.md` = `@AGENTS.md` (imports the same rule). **Rule imposed:** always consult the bundled modified Next.js docs before writing Next.js code; obey deprecation notices (e.g. middleware→proxy).

---

## Part 2k — npm scripts + CI

`package.json` scripts:
- `dev` = `next dev` · `build` = `next build` · `start` = `next start` · `lint` = `eslint`
- `queue:publish`, `freshness:check`
- `content:briefs` (generate-briefs), `content:ingest` (ingest-draft)
- `news:fetch` (fetch-news-signals)
- `social:generate` (social-generate), `social:autopilot` (social-autopilot), `social:send` (social-send)
- All content/social scripts run via `node --experimental-strip-types scripts/*.mts`.

`.github/workflows/daily-social.yml` — **confirmed present**. Daily cron `0 14 * * *` + manual dispatch; pipeline generate → autopilot schedule → send across X/Facebook/Instagram/LinkedIn. Live vs preview via `SOCIAL_LIVE` repo var (preview uses `--dry-run`). Needs Supabase secrets to persist state across CI runs (local JSON stores are gitignored → empty on fresh checkout).

---

## Part 3 — Baseline health check

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** (exit 0, no errors) |
| `npm run build` | **PASS** — 56 static pages generated; route table clean; `ƒ Proxy (Middleware)` present. SSG params: 4 `/best`, 22 `/reviews` (24 shown incl. "+19 more"), 1 author, 1 reviewer. |

No errors to report for either. Nothing was fixed (read-only baseline).

---

## Part 4 — Baseline route snapshot (dev server, port 3111)

| Route | HTTP | `<title>` / body |
|---|---|---|
| `/` | 200 | Firsthand — Independent Health & Wellness Reviews |
| `/methodology` | 200 | Firsthand — How Firsthand Ranks and Reviews Products |
| `/about` | 200 | Firsthand — About |
| `/feed.xml` | 200 | RSS 2.0, channel `<title>Firsthand</title>` |
| `/sitemap.xml` | 200 | valid urlset, `<loc>https://readfirsthand.com</loc>` first |
| `/robots.txt` | 200 | `User-Agent: * / Allow: / / Disallow: /admin / Sitemap: https://readfirsthand.com/sitemap.xml` |
| `/category/sleep` | 200 | Firsthand — Sleep |
| `/best/best-sleep-supplements` | 200 | Firsthand — Best Sleep Supplements of 2026 |
| `/reviews/nature-made-melatonin-3mg` | 200 | Firsthand — Nature Made Melatonin 3 mg Review 2026 |
| `/articles/ai-symptom-checkers-what-studies-show` | **404** | seed article is `status: draft` — see note |
| `/articles/magnesium-l-threonate-vs-glycinate-sleep` | 200 | Firsthand — Magnesium L-Threonate vs Glycinate: Which Form Is Better for Sleep? |
| `/articles/news-otc-cgm-for-kids-stelo-clearance` | 200 | Firsthand — OTC Glucose Monitors for Kids: What Dexcom's Stelo Clearance Actually Means |

> **Article-route note (expected behavior, not a bug):** `/articles/[slug]` serves **published** items from the dual-mode **queue store** (`data/queue.local.json`), not from `src/data/articles.json`. All three `articles.json` seeds are `status: "draft"` → they 404. Two items in the local queue store are `published` and render 200 (used above). If the local queue store is not carried forward, no article page will render — a parity consideration for later.

---

## Surprising / risky for the multi-vertical refactor

1. **`reviewer_credential` enum vs TS `credential_type`** — SQL allows only `RD`/`MD`; TS + seed use `Editorial`. Supabase mode would reject the editorial reviewer.
2. **`CriterionRatings` is a fixed Health-specific 5-key shape** wired to `/methodology`, `RatingBadge.tsx`, and every product's `ratings`. Per-vertical criteria will ripple through all three.
3. **Branding seam is deliberately split:** `src/lib/site.ts` is the single source for site name/URL/nav — EXCEPT `social.ts`, which **intentionally inlines** `SITE_URL` (comment says "if the domain changes, update both"). A rebrand must update both places.
4. **Article content is runtime-published via the queue**, not the static seed — parity depends on carrying `data/queue.local.json` (gitignored) or configuring Supabase. Fresh checkouts render zero article pages.
5. **`/admin` security lives in `src/proxy.ts`** (the RSC flight-leak defense). Any admin routing refactor must preserve the proxy matcher + auth mirror with `admin-auth.ts` — never move the gate solely into a layout.
6. **Compliance gates are server-side and load-bearing** (FTC `#ad`/`affiliate` on monetized social approval; queue compliance checklist on content approval). Do not relax these when generalizing verticals.
7. **Local JSON stores were copied via rsync** (`queue/social/news-seen/subscribers`, `briefs/`, `drafts/`) — they are real working-tree state, gitignored, and not reproducible from git alone.

---

## Phase A verification (2026-07-12)

Exhaustive parity + compliance verification of the config-driven vertical
refactor, run in **local-JSON mode** (no Supabase / vertical / admin env vars
set). All checks green with **nothing fixed** — Health rendered identically to
the baseline above.

### Crawl (production build + `next start`, port 3111)
- **Routes discovered/crawled:** 50 (recursive same-origin `<a href>` crawl from
  `/`; the sitemap enumerates the same 50 `<loc>`s, on the `readfirsthand.com`
  canonical origin). Enumerated `/sitemap.xml` and followed every internal link.
- **Statuses:** 50/50 → **HTTP 200**. **Broken internal links: 0.**
  **Redirects: 0. Soft-404s: 0** (every 200 rendered a real, non-placeholder body;
  smallest were the intentionally-sparse empty-category pages ~670 chars, still
  real content). The two queue-published articles render 200; the draft-only
  `ai-symptom-checkers…` slug is correctly absent (matches baseline).
- **Images:** the site uses **zero `<img>` tags** (inline SVG icons only); its
  only image source is the dynamic OG card `/api/og`, verified **200 image/png**
  for the homepage, hub, and review OG URLs.

### Disclosure (FTC) rendering
- **4/4 `/best/*` hubs** render the affiliate disclosure (unconditional).
- **15/15 monetized `/reviews/*`** (`is_monetized: true`) render the disclosure;
  **7/7 non-monetized** render the neutral "no commission" note instead — no
  false positives/negatives.

### Methodology
- `/methodology` renders the five criteria driven from `vertical.criteria`:
  **Safety 30% / Evidence Quality 30% / Cost & Value 20% / Transparency 10% /
  Customer Support & Experience 10%** — long prose `longLabel`s present, weights
  from `Math.round(weight*100)`.

### Other surfaces
- `/feed.xml` → 200, valid RSS 2.0 (`<title>Firsthand</title>`).
- `/robots.txt` → 200 (`Allow: /`, `Disallow: /admin`, sitemap URL).
- `/quiz/sleep` → 200 (renders the Sleep Quiz).

### `/admin` gate (unchanged, unweakened)
- **Production + no `ADMIN_PASSWORD`** → `/admin`, `/admin/social` = **403** block;
  `/admin/login` = 200.
- **Development + no `ADMIN_PASSWORD`** → `/admin` = **200 dev-open** (DEV banner).
- **`ADMIN_PASSWORD` set** → `/admin`, `/admin/social` = **307 → `/admin/login`**;
  `/admin/login` = 200. Env unset afterward.

### Compliance-gate refusal test (local `data/social.local.json`, backed up + restored)
- Monetized social post with **no** disclosure → `transitionSocialStatus(→approved)`
  **REFUSED**, exact message:
  `Approval blocked: this is a monetized link but the caption is missing an FTC disclosure ('#ad' or 'affiliate').`
- Same post with `#ad` added → transition **succeeds** (status → `approved`).
- New record stamped `vertical: "health"`; the 13 pre-existing **legacy** rows
  (no `vertical` field) all read as `health`. **No external social API called**
  (test stops at the gate). Local stores restored **byte-identically** (SHA match).

### Vertical resolution sanity
- `getActiveVertical()` → `health` by default; throws
  `Unknown vertical "bogus" (from NEXT_PUBLIC_VERTICAL). Known verticals: health.`
- `resolveVerticalFromHost`: `health.readfirsthand.com`→`health`,
  `readfirsthand.com`/`www.readfirsthand.com`→`portal`, `unknown-host.example`→`null`.

### Type + build
- `npx tsc --noEmit` → **exit 0, zero errors.**
- `npm run build` → **56 pages** (SSG: 4 `/best`, 22 `/reviews`, 1 author,
  1 reviewer; `ƒ Proxy (Middleware)` present) — matches baseline.

### Checkpoint commit(s)
- `fc396ac` — *Phase A: config-driven vertical architecture (health parity preserved)*
  (verticals module, proxy header, seed renames + registry, site.ts, db/queue/social,
  CriterionRatings generalization, methodology/RatingBadge, 0004 migration, scripts).
- Docs commit follows this section. **Nothing was pushed.**

**Fixes required:** none — every check passed on the first run; the `/admin` and
disclosure gates were not touched, and no Health seed content was changed.
