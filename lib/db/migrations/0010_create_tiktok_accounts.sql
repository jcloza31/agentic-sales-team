create table if not exists tiktok_accounts (
  user_id text primary key references users(id) on delete cascade,
  open_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  display_name text not null default '',
  username text,
  avatar_url text not null default '',
  follower_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
