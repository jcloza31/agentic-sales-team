create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  agent_id text,
  lead_id uuid references leads(id) on delete set null,
  title text not null,
  kind text not null default 'call',
  when_at timestamptz not null,
  when_label text not null,
  created_at timestamptz not null default now()
);

create index if not exists meetings_user_when_idx on meetings(user_id, when_at);
