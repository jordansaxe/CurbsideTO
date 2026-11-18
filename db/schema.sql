-- CurbsideTO schema. Idempotent: safe to run repeatedly (npm run db:migrate).

create table if not exists users (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  handle      text unique,
  created_at  timestamptz not null default now()
);

create table if not exists invites (
  code        text primary key,
  note        text,
  max_uses    int not null default 1,
  uses        int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists login_tokens (
  token_hash  text primary key,
  email       text not null,
  invite_code text references invites(code),
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create table if not exists sessions (
  token_hash  text primary key,
  user_id     bigint not null references users(id) on delete cascade,
  expires_at  timestamptz not null
);

-- One row per address. Only the address and the outbound link are stored;
-- no listing data (photos, prices, history) is ever copied from HouseSigma.
create table if not exists homes (
  id              bigint generated always as identity primary key,
  city_slug       text not null,
  address_slug    text not null,
  city            text not null,
  address         text not null,
  housesigma_url  text not null,
  created_by      bigint references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (city_slug, address_slug)
);

create table if not exists ratings (
  home_id     bigint not null references homes(id) on delete cascade,
  user_id     bigint not null references users(id) on delete cascade,
  value       smallint not null check (value between 1 and 5),
  condition   smallint not null check (condition between 1 and 5),
  location    smallint not null check (location between 1 and 5),
  quiet       smallint not null check (quiet between 1 and 5),
  updated_at  timestamptz not null default now(),
  primary key (home_id, user_id)
);

create table if not exists comments (
  id          bigint generated always as identity primary key,
  home_id     bigint not null references homes(id) on delete cascade,
  user_id     bigint not null references users(id) on delete cascade,
  parent_id   bigint references comments(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  tags        text[] not null default '{}',
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists comments_home_idx on comments (home_id, created_at);
create index if not exists comments_user_idx on comments (user_id, created_at);

create table if not exists comment_votes (
  comment_id  bigint not null references comments(id) on delete cascade,
  user_id     bigint not null references users(id) on delete cascade,
  primary key (comment_id, user_id)
);

create table if not exists reports (
  id          bigint generated always as identity primary key,
  comment_id  bigint not null references comments(id) on delete cascade,
  user_id     bigint not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (comment_id, user_id)
);
