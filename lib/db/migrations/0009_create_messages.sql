create table if not exists messages (
  id serial primary key,
  user_id text not null references users(id) on delete cascade,
  agent_id text,
  who text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_user_id_idx on messages(user_id, id);
