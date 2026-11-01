-- ============================================================
-- Migration: 008_create_srs_cards_table.sql
-- Author:    Santiago Reyes
-- Date:      2026-10-27
-- Description:
--   Spaced repetition (FSRS) review card, one per user and question.
--   Columns follow the ts-fsrs card: due, stability, difficulty,
--   scheduled_days, learning_steps, reps, lapses, state (0 new,
--   1 learning, 2 review, 3 relearning), last_review. Written only by
--   the server; users can read their own cards.
--   Depends on 004 (civics_questions).
-- ============================================================

-- UP (apply this migration)
create table public.srs_cards (
  user_id        uuid not null references auth.users (id) on delete cascade,
  question_id    uuid not null references public.civics_questions (id),
  due            timestamptz not null default now(),
  stability      double precision not null default 0,
  difficulty     double precision not null default 0,
  scheduled_days integer not null default 0,
  learning_steps integer not null default 0,
  reps           integer not null default 0,
  lapses         integer not null default 0,
  state          smallint not null default 0 check (state between 0 and 3),
  last_review    timestamptz,
  primary key (user_id, question_id)
);

create index srs_cards_user_id_due_idx
  on public.srs_cards (user_id, due);

alter table public.srs_cards enable row level security;

create policy "srs_cards: read own rows"
  on public.srs_cards for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.srs_cards from anon, authenticated;
grant select on public.srs_cards to authenticated;

-- DOWN (undo this migration, for rollback reference)
-- drop table if exists public.srs_cards;
