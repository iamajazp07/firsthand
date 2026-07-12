# Daily social automation

Posts one piece of published content across **X, Facebook, Instagram, and
LinkedIn** every day, to drive referral traffic back to the site.

## The pipeline

```
content published  ──▶  social:generate --latest   (makes 4 platform DRAFTS)
                   ──▶  social:autopilot            (approve + schedule 1 topic)
                   ──▶  social:send                 (dispatch due posts)
```

- **`social:generate --latest`** — turns newly published articles into draft
  posts (X / Facebook / Instagram / LinkedIn), one per platform. Non-monetized
  articles only via `--latest`; monetized hubs/reviews carry an `#ad`
  disclosure automatically when generated explicitly.
- **`social:autopilot`** — the hands-off step. Promotes the drafts for **one
  content unit per run** (oldest first) `draft → approved → scheduled(now)`.
  The FTC disclosure gate is enforced: a monetized caption missing
  `#ad`/`affiliate` is refused and left as a draft. `--dry-run` previews.
  Tune volume with `SOCIAL_TOPICS_PER_RUN` (default `1`).
- **`social:send`** — dispatches `scheduled` posts that are due. With no
  platform tokens it marks each `skipped_no_credentials` (never "failed").
  `--dry-run` prints exactly what would post and writes nothing.

Run it locally end to end:

```bash
npm run social:generate -- --latest
npm run social:autopilot -- --dry-run   # preview
npm run social:autopilot                # really schedule today's topic
npm run social:send -- --dry-run        # preview what would post
```

## GitHub Actions (`.github/workflows/daily-social.yml`)

Runs daily at 14:00 UTC (edit the `cron`). Also runnable on demand via
**Actions → Daily social post → Run workflow**.

### Two things it needs to be genuinely useful

1. **A persistent store (Supabase).** The local JSON stores
   (`data/queue.local.json`, `data/social.local.json`) are **gitignored**, so a
   fresh CI checkout starts empty. Set these repo **secrets** so CI shares the
   same store your site uses:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

   Without them, each CI run is stateless and usually finds "nothing to post."

2. **A daily content source.** Dedupe is permanent: one post per
   `(platform, content)`. So a given article is posted **once per platform,
   ever** — you can't sustainably re-share the same links daily. To post
   something new every day you must publish something new every day. Feed it
   with the existing content pipeline (`content:briefs`, `content:ingest`,
   `queue:publish`) or schedule those too.

### Going live

By default the workflow runs in **preview** (`--dry-run`) — it shows what would
post and changes nothing. To actually schedule + send:

1. Add the platform credentials as repo **secrets** (all optional; any missing
   platform is skipped, not failed):
   - `X_API_BEARER_TOKEN`
   - `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, `META_IG_USER_ID`
   - `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORG_URN`
   - or a single `SOCIAL_WEBHOOK_URL` (Zapier / Make / Buffer) that fans out
     to everything.
2. Set repo **variable** `SOCIAL_LIVE = true` (Settings → Secrets and variables
   → Actions → Variables), or trigger the workflow manually with `live = true`.

## Notes / honest limits

- **Reddit is intentionally not automated.** Daily self-promo posting there
  gets accounts banned; it rewards genuine participation, not a feed. Post there
  by hand.
- **Instagram needs an image.** The Graph API can't publish a text-only post;
  each IG post uses the content's OG image (`/api/og`).
- **"Domain authority" ≠ social posting.** Social links are almost all
  `nofollow`, so posting does not directly raise domain authority — that comes
  from other sites linking to you. Posting drives **referral traffic and
  discovery**, which is still worth automating.
