-- ============================================================
-- Migration: 010_create_start_attempt_function.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   start_attempt creates a quiz session for a user and returns its id.
--   Only the service role (our Express API, after it verified the
--   user's session) can run it. Clients cannot call it, so they cannot
--   create attempts themselves.
--   Depends on 005 and 009 (practice_attempts).
-- ============================================================

-- UP (apply this migration)
create function public.start_attempt(
  p_user_id        uuid,
  p_mode           text,
  p_test_version   integer,
  p_question_count integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
begin
  insert into public.practice_attempts (user_id, mode, test_version, question_count)
  values (p_user_id, p_mode, p_test_version, p_question_count)
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

revoke execute on function public.start_attempt(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.start_attempt(uuid, text, integer, integer)
  to service_role;

-- DOWN (undo this migration, for rollback reference)
-- drop function if exists public.start_attempt(uuid, text, integer, integer);
