create extension if not exists "pgcrypto";

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  vote_count integer not null default 0,
  share_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.join_requests enable row level security;

create policy "Allow insert for join requests"
on public.join_requests
for insert
with check (true);

create policy "Allow read for join requests"
on public.join_requests
for select
using (true);

create policy "Allow update for vote count"
on public.join_requests
for update
using (true)
with check (true);
