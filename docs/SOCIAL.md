# Social automation (step 9)

Firsthand turns published content into platform-native social posts for **X,
Facebook, Instagram, and LinkedIn**. Everything is **token-ready but fully
functional without any accounts or API tokens**: you can generate, review,
approve, schedule, and dispatch entirely in a local/dry-run + webhook-fallback
mode. Nothing is ever auto-posted.

```
social:generate  →  review/edit in /admin/social  →  approve  →  schedule  →  social:send
   (drafts)            (captions, disclosure)       (FTC gate)   (datetime)   (webhook / API / skip)
```

## Storage (dual-mode, like the content queue)

`src/lib/social.ts` is the store. It mirrors `src/lib/queue.ts`:

- **Supabase** when `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are
  set → table `social_posts` (see `supabase/migrations/0003_social.sql`, which
  idempotently extends the minimal 0001 table into the rich shape).
- **Local JSON fallback** otherwise → gitignored `data/social.local.json`
  (auto-created on first write).

A post carries: `platform`, `content_type` (`article`|`hub`|`review`),
`content_slug`, `content_url`, `caption`, `hashtags`, `image_url` (the OG card),
`is_monetized_link`, `status`, `scheduled_at`, `sent_at`, `result_note`,
timestamps. Status machine:

```
draft → approved → scheduled → sent | failed | skipped_no_credentials
  ↑__________________(any status can return to draft)__________________|
```

## 1. Generate — `npm run social:generate`

```bash
npm run social:generate -- --type article --slug news-otc-cgm-for-kids-stelo-clearance
npm run social:generate -- --type hub     --slug best-sleep-supplements
npm run social:generate -- --type review  --slug doctors-best-high-absorption-magnesium
npm run social:generate -- --latest        # recently published articles with no posts yet
```

For each content item it creates **4 DRAFT posts** (one per platform) from the
content's real title + a real excerpt (answer block / verdict) pulled from the
data layer:

- **X** — punchy, ≤260 chars, 2–3 hashtags, link unfurls the OG card.
- **LinkedIn** — professional 2–3 sentence analyst take + link.
- **Facebook** — conversational 2–3 sentences + link.
- **Instagram** — caption + hashtag block; says **"link in bio"** (IG captions
  can't carry clickable links). `image_url` is the OG card.

Template-based (no AI APIs). Dedupe: one post per `(platform, content_slug)` —
re-runs skip platforms that already have a post.

## 2. Review / edit — `/admin/social`

Protected admin page (same HMAC-cookie auth as the rest of `/admin`; dev-open
when `ADMIN_PASSWORD` is unset in development, blocked in prod). Shows a table
with a platform badge, content type/slug, truncated caption, a
**monetized/disclosure indicator**, status, and `scheduled_at`. Expand a row to
edit the caption inline, **Approve**, **Schedule** (datetime), or send **Back to
draft**. All actions re-validate auth server-side.

> **Auth boundary:** `src/proxy.ts` (Next 16's renamed middleware) gates every
> `/admin` and `/api/admin` route **before** any page renders, so an
> unauthenticated request never causes a protected page to execute — no queue
> items or social drafts leak into the RSC/HTML response. Unauth → redirect to
> `/admin/login` (password set) or `403` (prod with no `ADMIN_PASSWORD`). The
> `/admin` layout keeps its own check as defense-in-depth. `robots.txt`
> disallows `/admin`.

## 3. Approve (FTC gate) → 4. Schedule

- **Approve** runs the FTC disclosure gate **server-side**: a monetized post
  whose caption lacks `#ad` / `affiliate` is **rejected** (not just a disabled
  button).
- **Schedule** requires a datetime; the post moves to `scheduled`.

## 5. Dispatch — `npm run social:send`

Picks `scheduled` posts with `scheduled_at <= now`, oldest first, **cap 8/run**,
with a small delay between sends. For each post:

1. **Compliance guard** — monetized post missing a disclosure → **failed** with
   a note; never handed to a publisher.
2. **Webhook fallback** — if `SOCIAL_WEBHOOK_URL` is set, the full post JSON is
   POSTed there (Buffer/Zapier/Make style); a 2xx → **sent**. *This is the
   operator's recommended near-term path.*
3. **Direct platform API** — only if that platform's token exists.
4. **No credentials** — with no token and no webhook, the publisher returns
   **without any network call** and the post is marked
   **`skipped_no_credentials`** (honest, not "failed").

```bash
npm run social:send -- --dry-run   # prints platform, caption, image_url, disclosure check; NO network, NO writes
npm run social:send                # real dispatch (skips w/o creds)
```

## Where each platform's tokens go (`.env.example`)

| Platform | Env vars | API |
|----------|----------|-----|
| Webhook (all) | `SOCIAL_WEBHOOK_URL` | POST full post JSON; 2xx = sent |
| X | `X_API_BEARER_TOKEN` | `POST /2/tweets` |
| Facebook | `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` | Graph `/{page}/feed` |
| Instagram | `META_IG_USER_ID`, `META_PAGE_ACCESS_TOKEN` | Graph media container + publish |
| LinkedIn | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_URN` | `POST /v2/ugcPosts` |

Publisher modules live in `src/lib/publishers/` (`x.ts`, `meta.ts` for FB+IG,
`linkedin.ts`). Each implements the real HTTP call behind an env check but
returns `skipped — no credentials configured` when the token is absent, without
touching the network.

## OG images — `/api/og`

`GET /api/og?title=...&kind=article|hub|review` renders a branded 1200×630 card
with `next/og` (navy band, `Firsthand` wordmark, kind label, title, `readfirsthand.com`).
It's wired into `openGraph.images` (+ `twitter` card) on `/articles/[slug]`,
`/best/[slug]`, and `/reviews/[slug]`, and each social post's `image_url` points
at it.

## FTC disclosure rule

- **Monetized content** = a hub with **any** monetized ranked product, or a
  monetized review. Those posts get `is_monetized_link: true` and the generator
  **guarantees** an `#ad` / `(affiliate link)` token in the caption.
- **Education / news articles** are non-monetized (no disclosure needed).
- The disclosure is enforced in **three** places: the generator (never omits
  it), the **admin Approve** action, and the **`social:send` dispatcher**
  (refuses + marks `failed`).
```
