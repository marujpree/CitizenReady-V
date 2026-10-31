import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../supabase.js'

export const quizRouter = Router()

// review and passed need the progress and SRS tables, so they come later.
const startSchema = z.object({
  mode: z.enum(['category', 'practice_exam', 'mock_test']),
  category: z.string().min(1).optional(),
  count: z.number().int().min(1).max(128).optional(),
})

// The real interview asks 10 questions. Other modes default to the same.
const DEFAULT_COUNT = 10

// Never select accepted_answers here: the response goes straight to the browser.
const PUBLIC_COLUMNS =
  'id, question_number, question_text, required_count, category, is_65_20, answer_kind'

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

quizRouter.post('/start', requireAuth, async (req, res) => {
  const parsed = startSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: z.flattenError(parsed.error) })
    return
  }
  const { mode, category, count } = parsed.data

  if (mode === 'category' && !category) {
    res.status(400).json({ error: 'category is required for category mode' })
    return
  }

  const userId = req.user!.id

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('user_settings')
    .select('test_version')
    .eq('user_id', userId)
    .single()

  if (settingsError || !settings) {
    res.status(500).json({ error: 'Could not load user settings' })
    return
  }

  let query = supabaseAdmin
    .from('civics_questions')
    .select(PUBLIC_COLUMNS)
    .eq('test_version', settings.test_version)
    .eq('is_active', true)
  if (mode === 'category') query = query.eq('category', category!)

  const { data: pool, error: poolError } = await query

  if (poolError) {
    res.status(500).json({ error: 'Could not load questions' })
    return
  }
  if (!pool || pool.length === 0) {
    res.status(404).json({ error: 'No questions found' })
    return
  }

  // A category quiz covers the whole category unless a count is given.
  const wanted = count ?? (mode === 'category' ? pool.length : DEFAULT_COUNT)
  const questions = shuffle(pool).slice(0, wanted)

  const { data: attemptId, error: startError } = await supabaseAdmin.rpc('start_attempt', {
    p_user_id: userId,
    p_mode: mode,
    p_test_version: settings.test_version,
    p_question_count: questions.length,
  })

  if (startError || !attemptId) {
    res.status(500).json({ error: 'Could not start the quiz' })
    return
  }

  res.status(201).json({ attemptId, questionCount: questions.length, questions })
})
