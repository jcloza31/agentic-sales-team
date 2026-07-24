create table if not exists creator_profile (
  user_id text primary key references users(id) on delete cascade,
  niche text,
  bio text,
  platforms jsonb not null default '[]'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  tone text,
  past_deals text,
  rate_floor text,
  updated_at timestamptz not null default now()
);
