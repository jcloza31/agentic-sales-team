create table if not exists users (
  id text primary key,
  email text,
  name text,
  workspace_name text not null default 'My Workspace',
  notifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
