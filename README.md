# Vivahale

**Vivahale** is an independent health & wellness authority and review-directory
site. It analyzes clinical research to rank supplements, telehealth providers,
and health products using a **hub-and-spoke** content model: ranked "Best X of
YYYY" **hubs** (`/best/[slug]`) link down to in-depth product **review spokes**
(`/reviews/[slug]`), all wrapped in an **E-E-A-T** framework (named analyst +
medical reviewer, transparent methodology, editorial + affiliate-disclosure
policies) and a **GEO** (Generative Engine Optimization) content structure —
answer-first blocks, verifiable primary-source citations, and FAQ sections
written to be quotable by AI answer engines and search alike.

**Tech stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS
v4 · Supabase (Postgres) with a transparent local-JSON fallback · deployed on
Vercel. No paid AI APIs anywhere in the loop — all drafting is human-in-the-loop
via an operator's Claude Code session.

---

## ⚠️ PENDING OPERATOR ACTIONS (do these before/at launch)

The site **builds, runs, and passes every check today**, but these seven items
are intentionally left as placeholders for the operator. Nothing here blocks
local development; several block **production money-page publishing** or real
monetization.

- [ ] **1. Replace the placeholder medical reviewer.** The record
  `"Dr. Elena Marsh, MD"` in **`src/data/reviewers.json`** has
  `"is_placeholder": true`. Swap `name`, `slug`, `bio`, `credentials`, and
  `credential_type` for a **real, verified** physician, then set
  `"is_placeholder": false`. **Why it matters:** the admin compliance gate marks
  the "Medical reviewer attached (not a placeholder)" check as **fail** for any
  `review` / `hub` / `hub_update` money page while `is_placeholder` is true, so
  those pages **cannot be approved for publish in production**. (In Supabase
  mode, update the corresponding row in the `reviewers` table too.)
- [ ] **2. Wire real affiliate links.** The string
  `VIVAHALE_AFFILIATE_PLACEHOLDER` appears **15×** in
  **`src/data/products.json`** (find them with
  `grep -c VIVAHALE_AFFILIATE_PLACEHOLDER src/data/products.json`, or
  `grep -rn VIVAHALE_AFFILIATE_PLACEHOLDER src/data/`). Replace each with the
  real **ClickBank hoplink** (`https://<nickname>.<vendor>.hop.clickbank.net`)
  or **PerformCB campaign URL**. The CTA component
  (`src/components/review/AffiliateCta.tsx`) renders these; leaving them as
  placeholders is safe (no dead-link monetization) but earns nothing.
- [ ] **3. Set `ADMIN_PASSWORD`.** Without it, `/admin` is **open in dev** (with
  an amber "DEV MODE" banner) and **returns 403 in production**. Set a long
  random value before deploying.
- [ ] **4. Add social credentials** — either `SOCIAL_WEBHOOK_URL` (recommended
  near-term: Buffer / Zapier / Make) **or** the per-platform API tokens. Without
  either, `social:send` marks due posts `skipped_no_credentials` (never
  "failed").
- [ ] **5. Analytics & Search Console.** Set `NEXT_PUBLIC_GA4_ID`
  (`G-XXXXXXXXXX`), then verify the domain in **Google Search Console** and
  submit the sitemap: **`https://vivahale.com/sitemap.xml`**.
- [ ] **6. Swap the contact email.** `CONTACT_EMAIL = "hello@vivahale.com"` in
  **`src/app/contact/page.tsx`** is a placeholder — replace with the real
  monitored inbox.
- [ ] **7. Point the domain at Vercel.** Add `vivahale.com` in the Vercel
  project's Domains tab and update DNS, then set `NEXT_PUBLIC_SITE_URL` to the
  live origin (see [Deploying to Vercel](#deploying-to-vercel)).

---

## Quick start

```bash
npm install
npm run dev        # dev server → http://localhost:3000
npm run build      # production build (must pass with zero TS/ESLint errors)
npm run start      # serve the production build → http://localhost:3000
npm run lint       # ESLint (must exit 0)
```

### Preview the whole network at once

A single build serves ONE vertical (whichever `NEXT_PUBLIC_VERTICAL` was baked
in). To click through the entire network — the vivahale.com brand portal plus
all five verticals — before any DNS exists:

```bash
bash scripts/preview-all.sh          # builds all six modes, serves them
bash scripts/preview-all.sh --serve  # reuse existing .next-* builds
```

Portal → http://localhost:3000 · health 3001 · money 3002 · tech 3003 ·
education 3004 · travel 3005. The portal's vertical cards link across the
local ports (via `NEXT_PUBLIC_LOCAL_VERTICAL_PORTS`) instead of the production
subdomains; each mode builds into its own dist dir (`.next-<mode>` via
`NEXT_DIST_DIR`). Stop with Ctrl-C or `pkill -f "next start"`.

**The entire site runs with ZERO credentials.** Out of the box it uses
**local-JSON mode**: `src/lib/db.ts` (and `queue.ts` / `social.ts`) read the
committed seed data in `src/data/*.json`, and any runtime writes (queue, social
drafts, subscribers, news-dedup) go to gitignored files under `data/`. Every
page, the admin, the RSS feed, the sitemap, and all the pipeline scripts work
this way.

### Activating Supabase mode

The data layer switches to Supabase automatically when **both** of these env
vars are set (see [Environment variables](#environment-variables)):

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Before first use, run the **three migrations in order** against your Supabase
project (SQL editor or `supabase db push`):

1. `supabase/migrations/0001_init.sql` — core schema (categories, authors,
   reviewers, products, hubs, articles, subscribers).
2. `supabase/migrations/0002_queue.sql` — the admin content-review queue.
3. `supabase/migrations/0003_social.sql` — social posts (idempotently extends
   the minimal 0001 social table into its rich shape).

Local-JSON mode and Supabase mode use the **same code paths and the same
storage-mode detection rule**, so behavior is identical apart from persistence.

---

## Environment variables

Copy `.env.example` → `.env.local` and fill in what you need. **None are
required to build or run** (local-JSON fallback). Never commit `.env.local`.

| Variable | Purpose | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Absolute production origin for canonical URLs, sitemap, robots, RSS, JSON-LD. Defaults to `https://vivahale.com`. | Your live origin (Vercel preview URL, then the real domain). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Set **with** the service-role key to enable Supabase mode. | Supabase → Project Settings → API. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key (full DB access — never expose to the client). | Supabase → Project Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (reserved for future client-side reads). | Supabase → Project Settings → API. |
| `ADMIN_PASSWORD` | Password for `/admin`. Session cookie is an HMAC of this value. Unset → dev-open / prod-403. | You choose a long random string. |
| `NEXT_PUBLIC_GA4_ID` | GA4 measurement ID (`G-XXXXXXXXXX`); analytics disabled if unset. | Google Analytics → Admin → Data Streams. |
| `SOCIAL_WEBHOOK_URL` | **Recommended** social path: every platform POSTs the post JSON here; a 2xx marks it `sent`. | Buffer / Zapier / Make catch-hook URL. |
| `X_API_BEARER_TOKEN` | X (Twitter) API v2 `POST /2/tweets` — OAuth 2.0 user-context bearer. | X Developer Portal (project + app). |
| `META_PAGE_ID` | Numeric Facebook Page ID (feed posts). | Meta Business / Graph API Explorer. |
| `META_PAGE_ACCESS_TOKEN` | Long-lived Page access token (server-only). | Meta Graph API (Page token, extended). |
| `META_IG_USER_ID` | Instagram Business/Creator user ID linked to the Page. | Meta Graph API (`/me/accounts` → IG business account). |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn Share API `POST /v2/ugcPosts` — OAuth 2.0, `w_organization_social`. | LinkedIn Developer app. |
| `LINKEDIN_ORG_URN` | Organization URN, e.g. `urn:li:organization:12345678`. | LinkedIn company page admin. |
| `CLICKBANK_AFFILIATE_ID` | ClickBank nickname / affiliate ID (for building hoplinks). | ClickBank account. |
| `CLICKBANK_API_KEY` | ClickBank API key (server-only; future automation). | ClickBank → Settings → API. |
| `PERFORMCB_AFFILIATE_ID` | PerformCB (Clickbooth) affiliate ID. | PerformCB dashboard. |
| `PERFORMCB_API_KEY` | PerformCB API key (server-only; future automation). | PerformCB dashboard. |

Override the volume caps at runtime with `CONTENT_DAILY_CAP` (ingest) and
`PUBLISH_DAILY_CAP` (publish) — see the pipeline section below.

---

## Content pipeline how-to

Full detail lives in **`docs/CONTENT_PIPELINE.md`**. The loop takes an idea from
the backlog to a live page at `/articles/[slug]` with **no paid AI APIs** — the
drafting itself happens in an operator's Claude Code session (human-in-the-loop);
every script is deterministic scaffolding around that.

```
topics.json ─▶ content:briefs ─▶ draft in Claude Code ─▶ content:ingest ─▶ /admin review
   (backlog)     (data/briefs/)     (data/drafts/*.md)     (queue: draft)   (compliance gate)
                                                                                    │
                          approve → schedule → queue:publish → LIVE at /articles/[slug]
```

1. **Backlog** — add topics to `src/data/topics.json` (long-tail / emerging
   ingredients; `type`, `category_slug`, `working_title`, `target_query`,
   `angle`, `status`).
2. **Generate briefs** — `npm run content:briefs` (default 2; `-- 3` for three).
   Writes one editorial brief per `todo` topic into gitignored `data/briefs/`,
   spelling out the required GEO structure (130–170-word answer block with ≥1
   statistic, H2 sections, real-phrasing FAQ, ≥3 verifiable PubMed/NIH/FDA/ADA
   sources, ≥1 honest limitation) and the compliance rules. Marks topics
   `drafted`.
3. **Draft in Claude Code** — the operator writes the article markdown (from the
   brief) into `data/drafts/*.md`. No AI API is called by the repo.
4. **Ingest** — `npm run content:ingest -- data/drafts/your-file.md`. Parses the
   draft into a **queue draft**. **Cap: 2 ingests/day** (override
   `CONTENT_DAILY_CAP=N`).
5. **Review & edit in `/admin`** — open the queue item; edit copy, attach the
   author + **medical reviewer**, add sources.
6. **Compliance checklist** — the queue detail runs a **server-enforced** gate
   (see [Compliance rules](#compliance-rules-summary)). Approval is blocked
   until it passes.
7. **Approve → schedule** — set `scheduled_at`.
8. **Publish** — `npm run queue:publish` promotes any due, approved items to
   published. **Cap: 2 publishes/run** (override `PUBLISH_DAILY_CAP=N`).
9. **Live** — the article renders at `/articles/[slug]` (force-dynamic), and
   appears in its category page, `/sitemap.xml`, and `/feed.xml`.

**Why the 2/day + 2/run caps?** They are a deliberate guardrail against
Google's **scaled-content-abuse** policy — a slow, reviewed cadence keeps the
site on the right side of the "mass-produced, low-value content" line.

### News track — `npm run news:fetch [n]`

The **health-news** and **health-tech-ai** categories run a separate,
primary-source-driven track that produces *original analysis of announcements*
(never rewritten headlines). `news:fetch` pulls RSS signals from
`src/data/news-feeds.json`, **dedups** against `data/news-seen.local.json`, and
surfaces candidates that feed the same queue → review → publish flow.

### Freshness — `npm run freshness:check`

Scans hubs and products for stale `last_updated_at` dates and files
**`hub_update` drafts** into the queue so aging money pages get re-reviewed on a
cadence (keeps "Last updated" honest and helps rankings).

---

## Social posting how-to

Full detail lives in **`docs/SOCIAL.md`**. Vivahale turns published content into
platform-native posts for **X, Facebook, Instagram, and LinkedIn**. It is
**fully functional without any accounts or tokens** — generate, review, approve,
schedule, and dispatch in local + dry-run + webhook mode. **Nothing is ever
auto-posted.**

```
social:generate → review/edit in /admin/social → approve (FTC gate) → schedule → social:send
   (4 drafts)         (captions, disclosure)                          (datetime)   (webhook / API / skip)
```

1. **Generate** — `npm run social:generate -- --type <article|hub|review> --slug <slug>`
   (or `-- --latest` for recently published articles with no posts yet). Creates
   **4 draft posts** (one per platform) from the content's real title + excerpt.
   Monetized links automatically get an **`#ad`** hashtag.
2. **Review in `/admin/social`** — edit captions/hashtags; the queue shows the
   OG-card image, monetized flag, and status.
3. **Approve (FTC gate)** — the admin blocks approval of a monetized post that
   lacks a disclosure (`#ad` / "Affiliate"). No disclosure → no approval.
4. **Schedule** — set `scheduled_at`.
5. **Send** — `npm run social:send` dispatches due posts. Use
   `-- --dry-run` to preview without sending.

**Dispatch order:** if `SOCIAL_WEBHOOK_URL` is set, **every** platform POSTs its
full post JSON there (Buffer/Zapier/Make handle the actual posting) → a 2xx
marks it `sent`. This is the **recommended near-term path**. Otherwise each
platform calls its native API if the tokens exist. With neither, the post is
marked `skipped_no_credentials` (never "failed").

**Per-platform token setup:** X → API v2 `POST /2/tweets` (OAuth 2.0
user-context bearer). Facebook + Instagram → Meta Graph API (Page ID + long-lived
Page token; IG requires a linked Business/Creator account). LinkedIn → Share API
`POST /v2/ugcPosts` as an organization (`w_organization_social` scope + org URN).

**Disclosure rule:** any post that links to a monetized (affiliate) destination
must carry a clear disclosure (`#ad`), added automatically at generation and
enforced again at approval.

---

## Compliance rules summary

These are enforced in code (`src/lib/queue.ts`) and stated on the public
`/editorial-policy`, `/methodology`, and `/affiliate-disclosure` pages.

- **FTC affiliate disclosure** — present **above the fold** on every money page
  and **on every monetized social post** (`#ad`).
- **No disease-cure claims** — the checker scans the body for banned substrings
  (case-insensitive): **`cures`, `cure `, `treats `, `treatment for`,
  `prevents disease`, `melts fat`, `miracle`**. Use modest "may support"
  language only.
- **Cons / red flags are mandatory** — every review lists downsides; the
  checklist has an explicit "Cons/red flags included" item.
- **Medical review required for money pages** — `review` / `hub` / `hub_update`
  items must have a **non-placeholder** medical reviewer attached, or the gate
  fails and they cannot be approved in production.
- **Human review gate** — nothing publishes automatically; a person must approve
  each item in `/admin` (and each social post in `/admin/social`) first.
- **Also checked:** ≥1 source with an `http(s)` URL, answer block within the GEO
  word range, pricing verified current, and **no fabricated testimonials**.
- **ClickBank / affiliate TOS notes** — no fake or fabricated reviews, no posing
  as a non-affiliate, no unapproved earnings/health claims; disclose the
  relationship everywhere it applies.

---

## Deploying to Vercel

1. **Import** the repository (this `vivahale/` folder as the project root) into
   Vercel. The framework is **auto-detected as Next.js** — no custom build
   command needed; the default Next build output works, so **no `vercel.json`
   is required**.
2. **Set environment variables** in the Vercel dashboard (Project → Settings →
   Environment Variables) for Production (and Preview as desired):
   - **`NEXT_PUBLIC_SITE_URL`** = your live origin (start with the
     `*.vercel.app` URL, switch to `https://vivahale.com` once DNS is live).
   - **`ADMIN_PASSWORD`** — required, or `/admin` returns 403 in production.
   - **`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`** — see the hard
     requirement below.
   - Optional: `NEXT_PUBLIC_GA4_ID`, `SOCIAL_WEBHOOK_URL` / social tokens,
     affiliate vars.
3. **Domain** — add `vivahale.com` under Project → Domains and update DNS; then
   set `NEXT_PUBLIC_SITE_URL` to `https://vivahale.com`.

> ### ⛔ HARD REQUIREMENT: Supabase is mandatory in production
> The local-JSON fallback writes to the `data/` directory on the **local
> filesystem**. Vercel's runtime filesystem is **ephemeral** — those writes do
> **not** persist across requests or deploys. So on Vercel the **content queue,
> social posts, and newsletter subscribers would be lost**. You **must** set
> `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in production and
> run the three migrations, or the pipeline has no durable store.

### Scheduling the pipeline on Vercel (suggestion, not built this step)

The publish/send/freshness/news scripts are Node CLI scripts run manually today.
To automate them on Vercel, the recommended future path is **Vercel Cron** →
thin **API routes** that call the same library functions
(`queue.ts` / `social.ts`), e.g. a nightly `queue:publish` and `social:send`,
plus a weekly `freshness:check` and daily `news:fetch`. **No cron endpoints were
added in this step** — this is documented as the intended next move so infra
isn't built prematurely.

The production base URL is configurable via `NEXT_PUBLIC_SITE_URL`
(`src/lib/site.ts`), which defaults to `https://vivahale.com`.

---

## Project structure

```
vivahale/
├─ src/
│  ├─ app/                    # App Router routes
│  │  ├─ page.tsx             # homepage
│  │  ├─ category/[slug]/     # 11 category hubs
│  │  ├─ best/[slug]/         # 4 ranked "Best X" money hubs
│  │  ├─ reviews/[slug]/      # 22 product review spokes
│  │  ├─ articles/[slug]/     # published queue articles (force-dynamic)
│  │  ├─ authors/[slug]/      # author E-E-A-T pages
│  │  ├─ reviewers/[slug]/    # medical-reviewer E-E-A-T pages
│  │  ├─ quiz/sleep/          # interactive quiz
│  │  ├─ methodology, about, editorial-policy, affiliate-disclosure,
│  │  │  privacy, terms, contact/   # trust / policy pages
│  │  ├─ admin/               # gated review dashboard + queue + social
│  │  ├─ api/                 # og image, subscribe, admin login
│  │  ├─ feed.xml/, sitemap.ts, robots.ts
│  ├─ components/             # UI (RankingCard, AffiliateCta, LastUpdated, …)
│  ├─ lib/                    # db.ts, queue.ts, social.ts, site.ts, types.ts, admin-auth.ts
│  ├─ data/                   # committed seed JSON (categories, products, hubs, …)
│  └─ proxy.ts                # /admin auth boundary (pre-render gate)
├─ scripts/                   # *.mts pipeline CLIs (briefs, ingest, publish, news, social)
├─ supabase/migrations/       # 0001_init, 0002_queue, 0003_social
├─ docs/                      # CONTENT_PIPELINE.md, SOCIAL.md
├─ data/                      # gitignored runtime stores (queue/social/subscribers/news/briefs/drafts)
├─ public/                    # static assets
└─ .env.example               # documented env template
```

---

## License / status

Private project (v0.1.0). Built as a human-in-the-loop, credential-optional
system: it runs today with no secrets and is production-ready once the pending
operator actions above are completed.
