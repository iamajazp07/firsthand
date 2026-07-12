-- Vivahale — admin content QUEUE (step 6)
-- Draft/review pipeline, kept SEPARATE from the live seeded content tables.
-- Mirrors the QueueItem type + local JSON store in src/lib/queue.ts. When
-- Supabase creds are absent, src/lib/queue.ts falls back to
-- data/queue.local.json with the identical shape.

-- Reuse the queue-item type set (distinct from article_type: uses hub_update
-- instead of hub, matching the admin workflow).
create type queue_item_type as enum (
  'review', 'hub_update', 'education', 'reddit_roundup', 'news'
);
-- article_status already exists from 0001_init.sql:
--   ('draft','in_review','approved','scheduled','published')

create table queue_items (
  id            uuid primary key default gen_random_uuid(),
  type          queue_item_type not null,
  title         text not null default '',
  slug          text not null default '',
  category_slug text not null default '',
  body_md       text not null default '',
  answer_block  text not null default '',
  sources       jsonb not null default '[]'::jsonb, -- [{name,url}]
  author_slug   text not null default '',
  reviewer_slug text,
  status        article_status not null default 'draft',
  scheduled_at  timestamptz,
  published_at  timestamptz,
  compliance    jsonb not null default '{}'::jsonb, -- named boolean checks
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_queue_items_status on queue_items (status);
create index idx_queue_items_type on queue_items (type);
create index idx_queue_items_updated_at on queue_items (updated_at desc);

-- Dedupe guard for the freshness updater: at most one hub_update draft per
-- source slug (the script uses a deterministic id, this is belt-and-braces).
create unique index idx_queue_items_hub_update_slug
  on queue_items (slug)
  where type = 'hub_update' and status = 'draft';
