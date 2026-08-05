-- Firsthand — multi-vertical support (Phase A, part 3)
-- Adds a `vertical` discriminator column to every content-bearing table so a
-- single Supabase project can hold rows for multiple verticals
-- (health, money, tech, …). The app filters reads by the active vertical
-- (src/lib/db.ts) and stamps writes with it (src/lib/queue.ts, src/lib/social.ts).
--
-- Existing rows predate multi-vertical and are all Health, so every column
-- defaults to 'health' and an explicit UPDATE backfills any pre-existing rows
-- for safety (the default already covers rows inserted before this migration).
--
-- This migration is additive and safe to re-run: every statement is guarded
-- with IF (NOT) EXISTS.

-- ---------------------------------------------------------------------------
-- 0) Enum drift fix: reviewer_credential
--
-- 0001_init.sql created `reviewer_credential as enum ('RD','MD')`, but the TS
-- type Reviewer.credential_type is "RD" | "MD" | "Editorial" and the live seed
-- ("Firsthand Editorial Team") uses 'Editorial'. In Supabase mode that row would
-- violate the enum. Add the missing value here.
--
-- NOTE: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block in
-- PostgreSQL older than 12, and even on 12+ a newly added value cannot be USED
-- in the same transaction. We neither use it here nor wrap this file in an
-- explicit transaction, and `IF NOT EXISTS` (PG 12+; Supabase runs PG 15+)
-- makes it idempotent. Keep this statement FIRST and standalone.
alter type reviewer_credential add value if not exists 'Editorial';

-- ---------------------------------------------------------------------------
-- 1) categories
-- ---------------------------------------------------------------------------
alter table categories add column if not exists vertical text not null default 'health';
update categories set vertical = 'health' where vertical is null;
create index if not exists idx_categories_vertical on categories (vertical);

-- ---------------------------------------------------------------------------
-- 2) authors
-- ---------------------------------------------------------------------------
alter table authors add column if not exists vertical text not null default 'health';
update authors set vertical = 'health' where vertical is null;
create index if not exists idx_authors_vertical on authors (vertical);

-- ---------------------------------------------------------------------------
-- 3) reviewers
-- ---------------------------------------------------------------------------
alter table reviewers add column if not exists vertical text not null default 'health';
update reviewers set vertical = 'health' where vertical is null;
create index if not exists idx_reviewers_vertical on reviewers (vertical);

-- ---------------------------------------------------------------------------
-- 4) products_providers
-- ---------------------------------------------------------------------------
alter table products_providers add column if not exists vertical text not null default 'health';
update products_providers set vertical = 'health' where vertical is null;
create index if not exists idx_products_providers_vertical on products_providers (vertical);

-- ---------------------------------------------------------------------------
-- 5) articles
-- ---------------------------------------------------------------------------
alter table articles add column if not exists vertical text not null default 'health';
update articles set vertical = 'health' where vertical is null;
create index if not exists idx_articles_vertical on articles (vertical);

-- ---------------------------------------------------------------------------
-- 6) social_posts (0001 + 0003 rich shape)
-- ---------------------------------------------------------------------------
alter table social_posts add column if not exists vertical text not null default 'health';
update social_posts set vertical = 'health' where vertical is null;
create index if not exists idx_social_posts_vertical on social_posts (vertical);

-- ---------------------------------------------------------------------------
-- 7) queue_items (0002 admin content queue)
-- ---------------------------------------------------------------------------
alter table queue_items add column if not exists vertical text not null default 'health';
update queue_items set vertical = 'health' where vertical is null;
create index if not exists idx_queue_items_vertical on queue_items (vertical);

-- ---------------------------------------------------------------------------
-- NOTE: email_subscribers is intentionally NOT given a `vertical` column. The
-- newsletter list is a single cross-vertical audience (src/lib/db.ts
-- addSubscriber dedupes on the global unique email and does not scope by
-- vertical). Revisit if per-vertical newsletters are ever introduced.
-- ---------------------------------------------------------------------------
