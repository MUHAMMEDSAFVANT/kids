create extension if not exists "pgcrypto";

create table if not exists public.members (
  id text primary key,
  name text not null,
  image_url text,
  description text not null default '',
  share_code text unique not null,
  vote_count integer not null default 0,
  voted_devices jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;

create policy "Allow insert for members"
on public.members
for insert
with check (true);

create policy "Allow read for members"
on public.members
for select
using (true);

create policy "Allow update for members"
on public.members
for update
using (true)
with check (true);
