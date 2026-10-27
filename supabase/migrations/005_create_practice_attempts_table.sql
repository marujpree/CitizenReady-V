-- ============================================================
-- Migration: 005_create_practice_attempts_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   One row per quiz session. Users can read their own attempts only.
--   Nobody writes from the client: the start_attempt function (a later
--   migration) creates rows and record_answer fills in the score.
--   Depends on Supabase Auth (auth.users).
-- ============================================================

-- UP (apply this migration)
create table public.practice_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  mode          text not null
                check (mode in ('category', 'practice_exam', 'review', 'passed', 'mock_test')),
  test_version  integer not null default 2025 check (test_version in (2008, 2025)),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  score_percent numeric(5, 2) check (score_percent between 0 and 100),
  passed        boolean
);

create index practice_attempts_user_id_started_at_idx
  on public.practice_attempts (user_id, started_at desc);

alter table public.practice_attempts enable row level security;

create policy "practice_attempts: read own rows"
  on public.practice_attempts for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.practice_attempts from anon, authenticated;
grant select on public.practice_attempts to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.practice_attempts;
