-- ============================================================
-- Migration: 011_create_record_answer_function.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   record_answer saves one graded answer and, in the same transaction,
--   updates the user's progress for that question and finishes the
--   attempt when the last answer arrives (score and pass at 60%).
--   The API grades the answer first and passes the result in. Only the
--   service role can run it. Fails if the attempt is not the user's,
--   is already finished, or the question was already answered.
--   mastery_score is a simple recency-weighted average of the last 5
--   results (newest counts most); a later migration replaces this
--   function with the FSRS version.
--   Depends on 004 to 009.
-- ============================================================

-- UP (apply this migration)
create function public.record_answer(
  p_user_id          uuid,
  p_attempt_id       uuid,
  p_question_id      uuid,
  p_typed_answer     text,
  p_input_mode       text,
  p_is_correct       boolean,
  p_graded_by        text,
  p_response_time_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt   public.practice_attempts%rowtype;
  v_recent    boolean[];
  v_mastery   numeric;
  v_weighted  numeric := 0;
  v_weights   numeric := 0;
  v_answered  integer;
  v_correct   integer;
  v_score     numeric;
  v_passed    boolean;
  v_completed boolean := false;
  i           integer;
begin
  select * into v_attempt
  from public.practice_attempts
  where id = p_attempt_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'attempt not found';
  end if;
  if v_attempt.completed_at is not null then
    raise exception 'attempt already completed';
  end if;

  insert into public.practice_attempt_answers
    (attempt_id, question_id, typed_answer, input_mode, is_correct, graded_by, response_time_ms)
  values
    (p_attempt_id, p_question_id, p_typed_answer, p_input_mode, p_is_correct, p_graded_by, p_response_time_ms);

  -- keep the last 5 results, oldest first
  v_recent := coalesce(
    (select recent_results from public.user_question_progress
     where user_id = p_user_id and question_id = p_question_id),
    '{}'
  ) || p_is_correct;

  if cardinality(v_recent) > 5 then
    v_recent := v_recent[cardinality(v_recent) - 4 : cardinality(v_recent)];
  end if;

  for i in 1 .. cardinality(v_recent) loop
    v_weighted := v_weighted + i * (case when v_recent[i] then 1 else 0 end);
    v_weights  := v_weights + i;
  end loop;
  v_mastery := round(v_weighted / v_weights, 3);

  insert into public.user_question_progress
    (user_id, question_id, times_seen, times_correct, recent_results, mastery_score, last_seen_at)
  values
    (p_user_id, p_question_id, 1, case when p_is_correct then 1 else 0 end, v_recent, v_mastery, now())
  on conflict (user_id, question_id) do update set
    times_seen     = public.user_question_progress.times_seen + 1,
    times_correct  = public.user_question_progress.times_correct + case when p_is_correct then 1 else 0 end,
    recent_results = excluded.recent_results,
    mastery_score  = excluded.mastery_score,
    last_seen_at   = excluded.last_seen_at;

  select count(*), count(*) filter (where is_correct)
  into v_answered, v_correct
  from public.practice_attempt_answers
  where attempt_id = p_attempt_id;

  if v_answered >= v_attempt.question_count then
    v_score  := round(v_correct * 100.0 / v_attempt.question_count, 2);
    v_passed := v_score >= 60;
    v_completed := true;
    update public.practice_attempts
    set completed_at = now(), score_percent = v_score, passed = v_passed
    where id = p_attempt_id;
  end if;

  return jsonb_build_object(
    'is_correct', p_is_correct,
    'attempt_completed', v_completed,
    'score_percent', v_score,
    'passed', v_passed
  );
end;
$$;

revoke execute on function public.record_answer(uuid, uuid, uuid, text, text, boolean, text, integer)
  from public, anon, authenticated;
grant execute on function public.record_answer(uuid, uuid, uuid, text, text, boolean, text, integer)
  to service_role;

-- DOWN (undo this migration, for rollback reference)
-- drop function if exists public.record_answer(uuid, uuid, uuid, text, text, boolean, text, integer);
