-- ============================================================
-- Migration: 002_create_user_settings_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   Creates the user_settings table (test version 2008 or 2025,
--   optional filing date) and a trigger that keeps updated_at fresh.
--   Turns on row level security: a signed-in user can read their own
--   row and update only test_version and filing_date. Clients cannot
--   insert or delete. Rows are created by the signup trigger
--   (migration 003).
-- ============================================================

-- UP (apply this migration)
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  test_version integer not null default 2025 check (test_version in (2008, 2025)),
  filing_date date,
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "user_settings: read own row"
  on public.user_settings for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "user_settings: update own row"
  on public.user_settings for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.user_settings from anon, authenticated;
grant select on public.user_settings to authenticated;
grant update (test_version, filing_date) on public.user_settings to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.user_settings;
-- drop function if exists public.set_updated_at();
