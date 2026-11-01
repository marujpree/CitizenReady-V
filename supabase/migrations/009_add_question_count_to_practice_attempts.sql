-- ============================================================
-- Migration: 009_add_question_count_to_practice_attempts.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   Adds question_count to practice_attempts: how many questions the
--   quiz has. record_answer compares answers given to this number to
--   know when the attempt is finished. Set once by start_attempt.
--   Depends on 005 (practice_attempts).
-- ============================================================

-- UP (apply this migration)
alter table public.practice_attempts
  add column question_count integer not null default 1 check (question_count between 1 and 128);

alter table public.practice_attempts
  alter column question_count drop default;

-- DOWN (undo this migration, for rollback reference)
-- alter table public.practice_attempts drop column if exists question_count;
