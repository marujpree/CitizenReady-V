-- ============================================================
-- Migration: 007_create_user_question_progress_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   Per-user, per-question mastery. recent_results holds the last few
--   results (oldest first, true = correct) and mastery_score (0 to 1)
--   is weighted toward recent results. Written only by the
--   record_answer function; users can read their own rows.
--   Depends on 004 (civics_questions).
-- ============================================================

-- UP (apply this migration)
create table public.user_question_progress (
  user_id        uuid not null references auth.users (id) on delete cascade,
  question_id    uuid not null references public.civics_questions (id),
  times_seen     integer not null default 0 check (times_seen >= 0),
  times_correct  integer not null default 0 check (times_correct >= 0),
  recent_results boolean[] not null default '{}',
  mastery_score  numeric(4, 3) not null default 0 check (mastery_score between 0 and 1),
  last_seen_at   timestamptz,
  primary key (user_id, question_id),
  check (times_correct <= times_seen)
);

alter table public.user_question_progress enable row level security;

create policy "user_question_progress: read own rows"
  on public.user_question_progress for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.user_question_progress from anon, authenticated;
grant select on public.user_question_progress to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.user_question_progress;
