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
