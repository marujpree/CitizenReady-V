-- ============================================================
-- Migration: 018_create_record_english_answer_function.sql
-- Author:    Santiago Reyes
-- Date:      2026-11-10
-- Description:
--   record_english_answer saves the result of one sentence and ends the
--   test by the USCIS rule: the first correct sentence passes it, and
--   three wrong sentences fail it. The API grades the sentence first and
--   passes the result in. Only the service role can run it.
--   Fails if the attempt is not the user's, is already finished, the
--   sentence is not an active sentence of the same test type, or the
--   sentence was already used in this test (error code 23505).
--   Depends on 015 and 016.
-- ============================================================

-- UP (apply this migration)
create function public.record_english_answer(
  p_user_id     uuid,
  p_attempt_id  uuid,
  p_sentence_id uuid,
  p_is_correct  boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt   public.english_test_attempts%rowtype;
  v_ids       uuid[];
  v_completed boolean := false;
  v_passed    boolean;
begin
  select * into v_attempt
  from public.english_test_attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'attempt not found';
  end if;
  if v_attempt.completed_at is not null then
    raise exception 'attempt already completed';
  end if;

  if not exists (
    select 1 from public.english_test_sentences
    where id = p_sentence_id and test_type = v_attempt.test_type and is_active
  ) then
    raise exception 'sentence not found';
  end if;

  if p_sentence_id = any (v_attempt.sentence_ids) then
    raise exception 'sentence already used' using errcode = '23505';
  end if;

  v_ids := v_attempt.sentence_ids || p_sentence_id;

  if p_is_correct then
    v_completed := true;
    v_passed := true;
  elsif cardinality(v_ids) >= 3 then
    v_completed := true;
    v_passed := false;
  end if;

  update public.english_test_attempts
  set sentence_ids      = v_ids,
      sentences_correct = case when p_is_correct then 1 else 0 end,
      passed            = v_passed,
      completed_at      = case when v_completed then now() end
  where id = p_attempt_id;

  return jsonb_build_object(
    'is_correct', p_is_correct,
    'attempt_completed', v_completed,
    'passed', v_passed,
    'sentences_tried', cardinality(v_ids)
  );
end;
$$;

revoke execute on function public.record_english_answer(uuid, uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.record_english_answer(uuid, uuid, uuid, boolean)
  to service_role;

-- DOWN (undo this migration, for rollback reference)
-- drop function if exists public.record_english_answer(uuid, uuid, uuid, boolean);
