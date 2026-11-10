import { Router } from 'express'
import { z } from 'zod'
import { gradeAnswer } from '../grading/grade.js'
import { requireAuth } from '../middleware/auth.js'
import { ipLimiter, userLimiter } from '../middleware/rate-limit.js'
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

// Two layers: a per-IP limit before we call Supabase to check the token, then a
// per-user limit once we know who is asking.
quizRouter.use(ipLimiter)

quizRouter.post('/start', requireAuth, userLimiter({ windowMs: 60_000, limit: 20 }), async (req, res) => {
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

const answerSchema = z.object({
  attemptId: z.uuid(),
  questionId: z.uuid(),
  answer: z.string().trim().min(1).max(500),
  inputMode: z.enum(['typed', 'spoken']).default('typed'),
  responseTimeMs: z.number().int().min(0).max(600_000).optional(),
})

quizRouter.post(
  '/answer',
  requireAuth,
  userLimiter({ windowMs: 60_000, limit: 90 }),
  async (req, res) => {
    const parsed = answerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: z.flattenError(parsed.error) })
      return
    }
    const { attemptId, questionId, answer, inputMode, responseTimeMs } = parsed.data
    const userId = req.user!.id

    // The attempt must be this user's and still open.
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('practice_attempts')
      .select('id, test_version, completed_at')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .maybeSingle()

    if (attemptError) {
      res.status(500).json({ error: 'Could not load the quiz' })
      return
    }
    if (!attempt) {
      res.status(404).json({ error: 'Quiz not found' })
      return
    }
    if (attempt.completed_at) {
      res.status(409).json({ error: 'This quiz is already finished' })
      return
    }

    // The question must be active and from the same test version as the quiz.
    const { data: question, error: questionError } = await supabaseAdmin
      .from('civics_questions')
      .select('id, accepted_answers, required_count')
      .eq('id', questionId)
      .eq('test_version', attempt.test_version)
      .eq('is_active', true)
      .maybeSingle()

    if (questionError) {
      res.status(500).json({ error: 'Could not load the question' })
      return
    }
    if (!question) {
      res.status(404).json({ error: 'Question not found' })
      return
    }

    const { isCorrect } = gradeAnswer(answer, question)

    const { data: result, error: recordError } = await supabaseAdmin.rpc('record_answer', {
      p_user_id: userId,
      p_attempt_id: attemptId,
      p_question_id: questionId,
      p_typed_answer: answer,
      p_input_mode: inputMode,
      p_is_correct: isCorrect,
      p_graded_by: 'rule',
      p_response_time_ms: responseTimeMs ?? null,
    })

    if (recordError) {
      // 23505 is the unique rule: one answer per question per quiz.
      if (recordError.code === '23505') {
        res.status(409).json({ error: 'You already answered this question' })
        return
      }
      res.status(500).json({ error: 'Could not save your answer' })
      return
    }

    // The accepted answers are only sent back now that the answer is graded.
    res.json({
      isCorrect,
      requiredCount: question.required_count,
      acceptedAnswers: question.accepted_answers,
      attemptCompleted: result.attempt_completed,
      scorePercent: result.score_percent,
      passed: result.passed,
    })
  },
)
