-- ============================================================
-- Migration: 006_create_practice_attempt_answers_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   One row per answer inside a quiz attempt. is_correct and graded_by
--   are set by the server only (record_answer function). Users can read
--   answers that belong to their own attempts. A question can be
--   answered once per attempt.
--   Depends on 004 (civics_questions) and 005 (practice_attempts).
-- ============================================================

-- UP (apply this migration)
create table public.practice_attempt_answers (
  id               uuid primary key default gen_random_uuid(),
  attempt_id       uuid not null references public.practice_attempts (id) on delete cascade,
  question_id      uuid not null references public.civics_questions (id),
  typed_answer     text not null,
  input_mode       text not null default 'typed' check (input_mode in ('typed', 'spoken')),
  is_correct       boolean not null,
  graded_by        text not null check (graded_by in ('rule', 'ai')),
  response_time_ms integer check (response_time_ms >= 0),
  answered_at      timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index practice_attempt_answers_question_id_idx
  on public.practice_attempt_answers (question_id);

alter table public.practice_attempt_answers enable row level security;

create policy "practice_attempt_answers: read own rows"
  on public.practice_attempt_answers for select to authenticated
  using (
    attempt_id in (
      select id from public.practice_attempts
      where user_id = (select auth.uid())
    )
  );

revoke all on public.practice_attempt_answers from anon, authenticated;
grant select on public.practice_attempt_answers to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.practice_attempt_answers;
