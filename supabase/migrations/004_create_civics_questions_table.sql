-- ============================================================
-- Migration: 004_create_civics_questions_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   Creates the civics question bank (2008 and 2025 tests). Signed-in
--   users can read active questions but NOT accepted_answers, so the
--   browser can never fetch the answers before answering. The API
--   reads them with the secret key to grade. Rows are loaded by
--   supabase/seed.sql, never by clients.
--   required_count: how many answers the question asks for ("name two").
--   is_65_20: starred question for the 65/20 special consideration.
--   answer_kind: fixed answers, a current official (changes with
--   elections), or an answer that depends on where the user lives.
--   Non-fixed questions have empty accepted_answers and are inactive
--   until the app can handle them.
-- ============================================================

-- UP (apply this migration)
create table public.civics_questions (
  id               uuid primary key default gen_random_uuid(),
  test_version     integer not null check (test_version in (2008, 2025)),
  question_number  integer not null check (question_number > 0),
  question_text    text not null,
  accepted_answers text[] not null default '{}',
  required_count   integer not null default 1 check (required_count between 1 and 5),
  category         text not null,
  is_65_20         boolean not null default false,
  answer_kind      text not null default 'fixed'
                   check (answer_kind in ('fixed', 'current_official', 'by_location')),
  is_active        boolean not null default true,
  unique (test_version, question_number),
  check (answer_kind <> 'fixed' or cardinality(accepted_answers) > 0)
);

create index civics_questions_test_version_category_idx
  on public.civics_questions (test_version, category);

alter table public.civics_questions enable row level security;

create policy "civics_questions: read active"
  on public.civics_questions for select to authenticated
  using (is_active);

revoke all on public.civics_questions from anon, authenticated;
grant select (id, test_version, question_number, question_text, required_count,
              category, is_65_20, answer_kind, is_active)
  on public.civics_questions to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.civics_questions;
