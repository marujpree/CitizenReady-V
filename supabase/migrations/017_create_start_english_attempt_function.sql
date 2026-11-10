-- ============================================================
-- Migration: 017_create_start_english_attempt_function.sql
-- Author:    Santiago Reyes
-- Date:      2026-11-10
-- Description:
--   start_english_attempt opens a reading or writing test for a user
--   and returns its id. Only the service role (our Express API, after
--   it verified the user's session) can run it.
--   Depends on 016 (english_test_attempts).
-- ============================================================

-- UP (apply this migration)
create function public.start_english_attempt(
  p_user_id   uuid,
  p_test_type text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
begin
  insert into public.english_test_attempts (user_id, test_type)
  values (p_user_id, p_test_type)
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

revoke execute on function public.start_english_attempt(uuid, text)
  from public, anon, authenticated;
grant execute on function public.start_english_attempt(uuid, text)
  to service_role;

-- DOWN (undo this migration, for rollback reference)
-- drop function if exists public.start_english_attempt(uuid, text);
