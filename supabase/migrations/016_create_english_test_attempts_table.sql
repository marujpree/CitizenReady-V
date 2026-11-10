-- ============================================================
-- Migration: 016_create_english_test_attempts_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-11-10
-- Description:
--   One row per reading or writing test. The USCIS rule is: the
--   applicant gets up to three sentences and passes by getting ONE
--   right, and the officer stops at the first right one. So a test
--   ends at the first correct sentence (passed) or after the third
--   wrong one (failed).
--   sentence_ids: the sentences already given in this test, so the
--   same one is never used twice. sentences_correct is 0 or 1.
--   Users can read their own attempts only. Nobody writes from the
--   client: start_english_attempt and record_english_answer (later
--   migrations) do it. Deleting a user deletes their attempts.
--   Depends on Supabase Auth (auth.users).
-- ============================================================

-- UP (apply this migration)
create table public.english_test_attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  test_type         text not null check (test_type in ('reading', 'writing')),
  sentence_ids      uuid[] not null default '{}' check (cardinality(sentence_ids) <= 3),
  sentences_correct integer not null default 0 check (sentences_correct between 0 and 1),
  passed            boolean,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index english_test_attempts_user_id_started_at_idx
  on public.english_test_attempts (user_id, started_at desc);

alter table public.english_test_attempts enable row level security;

create policy "english_test_attempts: read own rows"
  on public.english_test_attempts for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.english_test_attempts from anon, authenticated;
grant select on public.english_test_attempts to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.english_test_attempts;
