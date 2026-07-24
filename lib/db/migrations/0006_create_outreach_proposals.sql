create table if not exists outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  agent_id text,
  lead_id uuid not null references leads(id) on delete cascade,
  subject text,
  body text not null,
  rationale text,
  status text not null default 'draft',
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists outreach_drafts_user_lead_idx on outreach_drafts(user_id, lead_id);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  agent_id text,
  lead_id uuid not null references leads(id) on delete cascade,
  title text not null,
  body text not null,
  products jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists proposals_user_lead_idx on proposals(user_id, lead_id);
