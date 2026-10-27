-- ============================================================
-- Migration: 001_create_profiles_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   Creates the profiles table, one row per user (id matches the
--   auth user id). Turns on row level security: a signed-in user can
--   read their own row and update only full_name and
--   preferred_language. Clients cannot insert, delete, or change
--   is_admin. Rows are created by the signup trigger (migration 003).
-- ============================================================

-- UP (apply this migration)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  preferred_language text not null default 'en',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own row"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own row"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Supabase grants broad table access by default. Take it all back,
-- then give only what is needed. is_admin is deliberately not updatable.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, preferred_language) on public.profiles to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.profiles;
