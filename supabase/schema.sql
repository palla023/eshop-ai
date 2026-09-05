-- Run this in the Supabase SQL editor after creating a project.
-- Auth users live in auth.users. App roles and profile data live here.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  profile_pic text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = id or email = auth.jwt() ->> 'email');

create policy "Users can insert their own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Promote a user to admin after they register:
-- update public.user_profiles set role = 'admin' where email = 'you@example.com';
