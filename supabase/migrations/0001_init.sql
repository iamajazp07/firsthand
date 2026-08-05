-- Firsthand — initial schema
-- Mirrors the TypeScript types in src/lib/types.ts and the local seed JSON
-- in src/data/ (used as fallback when Supabase credentials are absent).

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type article_type as enum ('hub', 'review', 'education', 'reddit_roundup', 'news');
create type article_status as enum ('draft', 'in_review', 'approved', 'scheduled', 'published');
create type reviewer_credential as enum ('RD', 'MD');

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_categories_sort_order on categories (sort_order);

-- ---------------------------------------------------------------------------
-- authors (bylines; no medical credentials implied)
-- ---------------------------------------------------------------------------

create table authors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  photo_url   text,
  bio         text not null default '',
  credentials text not null default '',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reviewers (medical reviewers; RD/MD credential + placeholder flag)
-- ---------------------------------------------------------------------------

create table reviewers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  photo_url       text,
  bio             text not null default '',
  credentials     text not null default '',
  credential_type reviewer_credential not null,
  is_placeholder  boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- products_providers (things reviewed/ranked; may be monetized)
-- ---------------------------------------------------------------------------

create table products_providers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  category_id   uuid not null references categories (id) on delete restrict,
  is_monetized  boolean not null default false,
  affiliate_url text,
  pricing_json  jsonb,
  metadata      jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_products_providers_category on products_providers (category_id);
create index idx_products_providers_monetized on products_providers (is_monetized) where is_monetized;

-- ---------------------------------------------------------------------------
-- articles (all editorial content)
-- ---------------------------------------------------------------------------

create table articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  type            article_type not null,
  category_id     uuid not null references categories (id) on delete restrict,
  title           text not null,
  body_mdx        text not null default '',
  author_id       uuid not null references authors (id) on delete restrict,
  reviewer_id     uuid references reviewers (id) on delete set null,
  status          article_status not null default 'draft',
  scheduled_at    timestamptz,
  published_at    timestamptz,
  last_updated_at timestamptz not null default now(),
  compliance_json jsonb,
  sources_json    jsonb,
  created_at      timestamptz not null default now()
);

create index idx_articles_category on articles (category_id);
create index idx_articles_status on articles (status);
create index idx_articles_type on articles (type);
create index idx_articles_published_at on articles (published_at desc);
create index idx_articles_scheduled_at on articles (scheduled_at) where status = 'scheduled';

-- ---------------------------------------------------------------------------
-- social_posts (per-article social distribution queue)
-- ---------------------------------------------------------------------------

create table social_posts (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references articles (id) on delete cascade,
  platform     text not null,               -- e.g. 'x', 'facebook', 'pinterest', 'linkedin'
  caption      text not null default '',
  status       text not null default 'draft', -- draft | scheduled | posted | failed
  scheduled_at timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_social_posts_article on social_posts (article_id);
create index idx_social_posts_status on social_posts (status);
create index idx_social_posts_scheduled_at on social_posts (scheduled_at);

-- ---------------------------------------------------------------------------
-- email_subscribers (newsletter list)
-- ---------------------------------------------------------------------------

create table email_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text,                          -- e.g. 'homepage_band', 'article_footer'
  created_at timestamptz not null default now()
);

create index idx_email_subscribers_created_at on email_subscribers (created_at desc);
