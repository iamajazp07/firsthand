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
- `d06d5ec` — *Phase B: health.vivahale.com rebrand + vivahale.com brand portal*.
  Nothing pushed.
