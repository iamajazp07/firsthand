-- Vivahale — SOCIAL distribution store (step 9)
-- Extends the minimal `social_posts` table from 0001_init.sql into the rich,
-- platform-native shape mirrored by the SocialPost type + local JSON store in
-- src/lib/social.ts. When Supabase creds are absent, src/lib/social.ts falls
-- back to data/social.local.json with the identical shape.
--
-- IDEMPOTENT / SAFE: the original 0001 table only had a few columns and a NOT
-- NULL foreign key to articles(id). Step 9 posts promote hubs, review spokes,
-- AND published queue articles (which do NOT live in the `articles` table), so
-- the old article_id FK cannot be kept. We therefore (a) add every new column
-- if missing, (b) drop the obsolete article_id column + its FK, and (c) widen
-- status handling. Re-running this migration is a no-op.

-- 1) New columns (all guarded with IF NOT EXISTS) ---------------------------
alter table social_posts add column if not exists content_type      text not null default 'article';
alter table social_posts add column if not exists content_slug      text not null default '';
alter table social_posts add column if not exists content_url       text not null default '';
alter table social_posts add column if not exists hashtags          jsonb not null default '[]'::jsonb;
alter table social_posts add column if not exists image_url         text not null default '';
alter table social_posts add column if not exists is_monetized_link boolean not null default false;
alter table social_posts add column if not exists sent_at           timestamptz;
alter table social_posts add column if not exists result_note       text not null default '';
alter table social_posts add column if not exists updated_at        timestamptz not null default now();

-- 2) Retire the old NOT NULL article_id FK (posts now key on content_slug) ---
--    Drop the FK constraint first (its name is deterministic from 0001), then
--    the column. Guarded so a fresh DB that never had it stays happy.
alter table social_posts drop constraint if exists social_posts_article_id_fkey;
alter table social_posts drop column if exists article_id;

-- 3) Helpful indexes (IF NOT EXISTS keeps re-runs safe) ----------------------
create index if not exists idx_social_posts_content on social_posts (content_type, content_slug);
create index if not exists idx_social_posts_platform on social_posts (platform);
create index if not exists idx_social_posts_updated_at on social_posts (updated_at desc);
-- idx_social_posts_status and idx_social_posts_scheduled_at already exist from
-- 0001_init.sql; recreate defensively in case this runs on a partial schema.
create index if not exists idx_social_posts_status on social_posts (status);
create index if not exists idx_social_posts_scheduled_at on social_posts (scheduled_at);

-- 4) One social post per (platform, content_slug) — matches the generator's
--    dedupe key. Partial-safe: only enforced when content_slug is present.
create unique index if not exists idx_social_posts_platform_content
  on social_posts (platform, content_slug)
  where content_slug <> '';

-- Status vocabulary (stored as text, validated in app code):
--   draft | approved | scheduled | sent | failed | skipped_no_credentials
-- Platform vocabulary: x | facebook | instagram | linkedin
-- content_type vocabulary: article | hub | review
