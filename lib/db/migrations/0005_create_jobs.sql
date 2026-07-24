create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  agent_id text,
  kind text not null,
  status text not null default 'queued',
  params jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists jobs_user_status_idx on jobs(user_id, status);
