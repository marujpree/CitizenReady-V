-- ============================================================
-- Migration: 013_add_special_consideration.sql
-- Author:    Santiago Reyes
-- Date:      2026-11-10
-- Description:
--   Adds the 65/20 special consideration setting to user_settings.
--   People who are 65 or older and have been permanent residents for
--   20 or more years study only the 20 starred questions (is_65_20),
--   and their civics test asks 10 of those 20 and needs 6 right.
--   The user can change it (column-level update grant), and sign-up
--   can set it through the new user's metadata. Replaces
--   handle_new_user from migration 012.
-- ============================================================

-- UP (apply this migration)
alter table public.user_settings
  add column special_consideration boolean not null default false;

grant update (special_consideration) on public.user_settings to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_test_version integer;
  v_special      boolean;
begin
  -- Metadata is typed by the client, so only accept the real values.
  v_test_version := case new.raw_user_meta_data ->> 'test_version'
    when '2008' then 2008
    else 2025
  end;
  v_special := coalesce(new.raw_user_meta_data ->> 'special_consideration', '') = 'true';

  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.user_settings (user_id, test_version, special_consideration)
  values (new.id, v_test_version, v_special);

  return new;
end;
$$;

-- DOWN (undo this migration, for rollback reference)
-- Put back handle_new_user from migration 012, then drop the column:
-- create or replace function public.handle_new_user()
-- returns trigger language plpgsql security definer set search_path = '' as $$
-- declare v_test_version integer;
-- begin
--   v_test_version := case new.raw_user_meta_data ->> 'test_version' when '2008' then 2008 else 2025 end;
--   insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
--   insert into public.user_settings (user_id, test_version) values (new.id, v_test_version);
--   return new;
-- end;
-- $$;
-- alter table public.user_settings drop column special_consideration;
