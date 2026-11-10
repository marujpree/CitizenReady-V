-- ============================================================
-- Migration: 012_read_test_version_at_signup.sql
-- Author:    Santiago Reyes
-- Date:      2026-11-10
-- Description:
--   Lets sign-up choose the civics test version. The web app sends
--   test_version (2008 or 2025) in the new user's metadata and
--   handle_new_user copies it into user_settings. Anything else, or
--   nothing (for example Google sign-up), falls back to 2025.
--   2025 test: N-400 filed on or after October 20, 2025.
--   2008 test: N-400 filed before October 20, 2025.
--   Replaces the function from migration 003; the trigger stays as is.
-- ============================================================

-- UP (apply this migration)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_test_version integer;
begin
  -- Metadata is typed by the client, so only accept the two real values.
  v_test_version := case new.raw_user_meta_data ->> 'test_version'
    when '2008' then 2008
    else 2025
  end;

  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.user_settings (user_id, test_version)
  values (new.id, v_test_version);

  return new;
end;
$$;

-- DOWN (undo this migration, for rollback reference)
-- Put back the version from migration 003:
-- create or replace function public.handle_new_user()
-- returns trigger language plpgsql security definer set search_path = '' as $$
-- begin
--   insert into public.profiles (id, full_name)
--   values (new.id, new.raw_user_meta_data ->> 'full_name');
--   insert into public.user_settings (user_id) values (new.id);
--   return new;
-- end;
-- $$;
