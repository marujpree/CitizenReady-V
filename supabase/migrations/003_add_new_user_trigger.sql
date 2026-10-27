-- ============================================================
-- Migration: 003_add_new_user_trigger.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   Adds a trigger on auth.users so every new signup automatically
--   gets a row in profiles and in user_settings. Runs as the
--   function owner (security definer) because clients cannot insert
--   into those tables themselves. Depends on migrations 001 and 002.
-- ============================================================

-- UP (apply this migration)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- DOWN (undo this migration, for rollback reference)
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
