-- ============================================================
-- Migration: 015_create_english_test_sentences_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-11-10
-- Description:
--   Sentence bank for the English reading and writing tests. Signed-in
--   users can read active sentences, nobody writes from the client. An
--   admin can retire or add sentences without a deploy. Rows are loaded
--   by supabase/seed_english.sql (generated from api/src/english/
--   sentences.ts, which checks that every sentence only uses words from
--   the official USCIS vocabulary lists).
--   test_type: reading sentences are questions the applicant reads
--   aloud; writing sentences are statements the applicant writes.
-- ============================================================

-- UP (apply this migration)
create table public.english_test_sentences (
  id        uuid primary key default gen_random_uuid(),
  test_type text not null check (test_type in ('reading', 'writing')),
  text      text not null check (length(text) between 1 and 200),
  is_active boolean not null default true,
  unique (test_type, text)
);

alter table public.english_test_sentences enable row level security;

create policy "english_test_sentences: read active"
  on public.english_test_sentences for select to authenticated
  using (is_active);

revoke all on public.english_test_sentences from anon, authenticated;
grant select on public.english_test_sentences to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.english_test_sentences;
