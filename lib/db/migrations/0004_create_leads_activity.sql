create extension if not exists pgcrypto;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  agent_id text,
  name text not null,
  title text,
  company text,
  email text,
  status text not null default 'new',
  score integer,
  source text not null default 'manual',
  review text not null default 'accepted',
  profile_url text,
  platform text,
  research jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_user_agent_idx on leads(user_id, agent_id);
create index if not exists leads_user_review_idx on leads(user_id, review);

create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  agent_id text,
  type text not null,
  lead_id uuid references leads(id) on delete set null,
  text text not null,
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists activity_user_created_idx on activity(user_id, created_at);
