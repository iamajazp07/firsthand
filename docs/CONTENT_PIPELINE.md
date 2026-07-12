# Vivahale content pipeline

How an editorial article goes from an idea in the backlog to a live page at
`/articles/[slug]` — with no paid AI APIs anywhere in the loop. The drafting
itself is done by an operator's Claude Code session (human-in-the-loop); every
script below is the deterministic scaffolding around that drafting.

```
topics.json ──▶ content:briefs ──▶ draft in Claude Code ──▶ content:ingest
   (backlog)      (data/briefs/)      (data/drafts/*.md)      (queue: draft)
                                                                    │
                                                                    ▼
                                             review & edit in /admin
                                                                    │
                                          approve (compliance gate)  │
                                                                    ▼
                                              schedule (scheduled_at set)
                                                                    │
                                              npm run queue:publish  │
                                                                    ▼
                                          LIVE at /articles/[slug]
                                  (+ category page, /sitemap.xml, /feed.xml)
```

## 1. Backlog — `src/data/topics.json`

A committed list of long-tail / emerging-ingredient topics. Each entry:

```json
{
  "id": "topic-...",
  "type": "education | reddit_roundup | news",
  "category_slug": "sleep",
  "working_title": "…",
  "target_query": "…",
  "angle": "…",
  "status": "todo | drafted"
}
```

## 2. Generate briefs — `npm run content:briefs [n]`

Picks `n` (default 2) `todo` topics and writes one editorial brief markdown file
per topic into the **gitignored** `data/briefs/` directory. Each brief spells out
the required GEO structure (130–170 word answer block with ≥1 statistic, H2
sections, FAQ with real search phrasings, ≥3 verifiable PubMed/NIH/FDA/ADA
sources, ≥1 honest limitation section) and the compliance rules (no
disease-cure claims — never "treats/cures/prevents"; modest "may support"
language; no fabricated testimonials). Marks each picked topic `drafted`.

```bash
npm run content:briefs        # 2 briefs
npm run content:briefs -- 3   # 3 briefs
```

## 2b. News layer (timely) — `npm run news:fetch [n]`

The **health-news** and **health-tech-ai** categories run on a separate,
primary-source-driven track that produces *original analysis of announcements* —
never aggregated or rewritten headlines. It reuses the same queue → review →
publish machinery; only the front of the funnel differs.

```
news-feeds.json ─▶ news:fetch ─▶ news brief ─▶ draft ORIGINAL analysis ─▶ content:ingest
 (primary feeds)   (dedup vs.     (data/briefs/  (data/drafts/*.md)        (queue: draft)
                    news-seen)     news-*.md)              │
                                                           ▼  … same review → approve
                                                              → schedule → publish path
```

- **`src/data/news-feeds.json`** — committed list of PRIMARY-SOURCE feeds. Each
  entry: `{id, name, url, category_slug (health-news|health-tech-ai), format
  (rss|atom), enabled, blocked_from_env?, note}`. Only feeds verified to return
  parseable XML from this environment are `enabled`. Feeds that a network/CDN
  blocks here (e.g. `www.nih.gov` → Cloudflare 403) are kept with
  `"blocked_from_env": true` and skipped gracefully at runtime.
- **`npm run news:fetch [n]`** (`scripts/fetch-news-signals.mts`) fetches every
  enabled feed with native `fetch` + a hand-rolled RSS/Atom parser (no new
  dependencies), dedupes items against the gitignored
  `data/news-seen.local.json`, and writes up to **n** (default 3) NEW candidate
  signals into `data/briefs/` as `news-*.md`. Every item seen in a run is
  recorded, so an immediate re-run reports **0 new** (dedup proof). It prints a
  per-feed table (feeds fetched, items found, new signals written, duplicates
  skipped) and never touches the queue.
- **Each news brief** embeds the trigger primary source (title + URL + date) and
  the **original-analysis contract**: *the source is the starting point, the
  analysis is the product* — data-analyst commentary on what the finding means,
  context from prior research, hype-vs-reality, and honest limitations. Do NOT
  rewrite the source as the article. Required structure matches the GEO rules
  below (130–170 word answer block with ≥1 statistic, H2 sections, real-phrasing
  FAQ, honest-limitations section, **≥3 verifiable primary sources including the
  trigger source**), plus: link the primary source **prominently near the top**.
- On the live page, `type: news` articles render a **`PrimarySourceNote`** mist
  box near the top (leading with the first/trigger source): *"Primary source:
  [linked name] — Vivahale analysis is original commentary; always read the
  source."* — analogous to the `reddit_roundup` paraphrase note.

### Separation rule (important)

News fuels the **freshness / social / email** layer — timely, high-frequency,
awareness-building. It is deliberately kept **separate from the money pages**
(`review` / `hub_update`, which live in `src/data/`). `news:fetch` never
auto-creates or edits a review or hub; it only produces pre-draft *briefs*. This
keeps commercial pages slow, evergreen, and human-curated while the news track
stays fast.

## 3. Draft — in Claude Code (the operator)

Open the brief, research and verify every citation (curl each URL for HTTP 200),
and write the finished article as a markdown file in `data/drafts/` (also
gitignored) using this frontmatter:

```markdown
---
title: Article Title
slug: article-slug
type: education
category_slug: sleep
author_slug: health-research-analyst
reviewer_slug: dr-elena-marsh
answer_block: |
  A self-contained 130–170 word answer with at least one statistic…
sources:
  - NIH ODS — Magnesium Fact Sheet | https://ods.od.nih.gov/…
  - Abbasi et al. (2012), J Res Med Sci | https://pubmed.ncbi.nlm.nih.gov/23853635/
---

## Body markdown starts here
Real-phrasing FAQ headings, honest caveats, etc.
```

## 4. Ingest — `npm run content:ingest -- <file.md>`

Validates required fields (title, kebab-case slug, article `type`,
`category_slug`, `answer_block`, ≥1 `sources` entry, non-empty body) and inserts
the item into the queue as **`draft`** — never higher. Author/reviewer default
to `health-research-analyst` / `dr-elena-marsh` if omitted.

**Volume cap (Google scaled-content-abuse guardrail):** refuses to create a
draft when **2 or more** queue items were already created today (UTC),
site-wide, printing:

```
Daily volume cap reached (2/day) — Google scaled-content-abuse guardrail
```

The default is **2/day**. For a controlled demo you may raise it with
`CONTENT_DAILY_CAP=<n> npm run content:ingest -- …`; the default stays 2.

## 5. Review, approve, schedule — `/admin`

The admin console (password via `ADMIN_PASSWORD`) shows the queue. Editors:

1. Open the draft, edit copy/sources.
2. Move **draft → in_review**.
3. Tick the four manual compliance boxes and move **in_review → approved**.
   Approval runs a **server-side compliance gate** (`evaluateCompliance`): ≥1
   http(s) source, 130–170 word answer block (review/education), no banned
   disease-claim phrases, reviewer attached, and all four manual confirmations.
   A failing required check blocks approval regardless of the UI.
4. Set a `scheduled_at` and move **approved → scheduled**.

## 6. Publish — `npm run queue:publish`

Finds `scheduled` items whose `scheduled_at` is now/past and transitions them to
`published` (stamping `published_at`). **Publish-side cap:** at most **2 items
per run/day** (Google scaled-content-abuse guardrail); excess due items stay
`scheduled` with a printed notice and publish on a later run. Override for demos
with `PUBLISH_DAILY_CAP=<n>`; default stays 2.

## 7. Live — `/articles/[slug]`

Published article-type items (`education`, `reddit_roundup`, `news`) render
immediately at `/articles/[slug]`. The route is **dynamic** (`force-dynamic`) —
it reads the dual-mode queue store on every request, so a freshly published item
is live with **no rebuild**. Each page renders breadcrumbs, an `<h1>`, author
byline + medical-reviewer badge + last-updated, the answer block, the markdown
body, a linked Sources list, a newsletter signup, and the medical disclaimer,
plus `Article` + `BreadcrumbList` JSON-LD. `reddit_roundup` items also show the
neutral "public discussion themes / paraphrased, not medical advice" note.

Published articles also surface on their **category page**, in **`/sitemap.xml`**,
and in **`/feed.xml`** — all kept dynamic so new items appear without a rebuild.

## Social distribution (step 9)

Once content is published, **[docs/SOCIAL.md](./SOCIAL.md)** covers turning it
into platform-native posts (X / Facebook / Instagram / LinkedIn):
`social:generate` → review/approve/schedule in `/admin/social` → `social:send`
(webhook fallback + dry-run + `skipped_no_credentials` when no tokens exist),
plus the OG image route and the FTC `#ad` disclosure rule.

## Guardrails recap

| Guardrail | Where | Default | Override |
|-----------|-------|---------|----------|
| News dedup (seen store) | `news:fetch` | surface each signal once | — |
| Ingest volume cap | `content:ingest` | 2 created/day | `CONTENT_DAILY_CAP` |
| Publish volume cap | `queue:publish` | 2 published/run | `PUBLISH_DAILY_CAP` |
| Compliance gate | `approved` transition | always on | — |
| Draft-only ingest | `content:ingest` | status = `draft` | — |
