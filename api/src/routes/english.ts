// Routes for the English reading and writing tests. The server owns the test: it opens an
// attempt, hands out sentences, grades each answer and ends the test by the USCIS rule (the
// first correct sentence passes, three wrong ones fail). The browser never says "I passed".
import { Router, type Response } from 'express'
import { z } from 'zod'
import { findSentence, sentencesFor } from '../english/bank.js'
import { gradeReading, gradeWriting } from '../english/grade.js'
import { requireAuth } from '../middleware/auth.js'
import { ipLimiter, userLimiter } from '../middleware/rate-limit.js'
import { supabaseAdmin } from '../supabase.js'

export const englishRouter = Router()

englishRouter.use(ipLimiter)

const MAX_SENTENCES = 3

function bankError(res: Response) {
  res.status(500).json({ error: 'Could not load the sentences' })
}

englishRouter.post(
  '/start',
  requireAuth,
  userLimiter({ windowMs: 60_000, limit: 20 }),
  async (req, res) => {
    const parsed = z.object({ test: z.enum(['reading', 'writing']) }).safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: z.flattenError(parsed.error) })
      return
    }

    const { data: attemptId, error } = await supabaseAdmin.rpc('start_english_attempt', {
      p_user_id: req.user!.id,
      p_test_type: parsed.data.test,
    })
    if (error || !attemptId) {
      res.status(500).json({ error: 'Could not start the test' })
      return
    }
    res.status(201).json({ attemptId, maxSentences: MAX_SENTENCES })
  },
)

const sentenceQuery = z.object({ attemptId: z.uuid() })

// Reading shows the text on screen. Writing sends it so the browser can read it aloud
// (dictation); the applicant types what they heard.
englishRouter.get(
  '/sentence',
  requireAuth,
  userLimiter({ windowMs: 60_000, limit: 60 }),
  async (req, res) => {
    const parsed = sentenceQuery.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: z.flattenError(parsed.error) })
      return
    }

    const { data: attempt, error } = await supabaseAdmin
      .from('english_test_attempts')
      .select('test_type, sentence_ids, completed_at')
      .eq('id', parsed.data.attemptId)
      .eq('user_id', req.user!.id)
      .maybeSingle()
    if (error) {
      res.status(500).json({ error: 'Could not load the test' })
      return
    }
    if (!attempt) {
      res.status(404).json({ error: 'Test not found' })
      return
    }
    if (attempt.completed_at) {
      res.status(409).json({ error: 'This test is already finished' })
      return
    }

    let pool
    try {
      pool = await sentencesFor(attempt.test_type)
    } catch {
      bankError(res)
      return
    }
    const used = new Set<string>(attempt.sentence_ids)
    const fresh = pool.filter((s) => !used.has(s.id))
    if (fresh.length === 0) {
      res.status(404).json({ error: 'No sentences left' })
      return
    }

    const sentence = fresh[Math.floor(Math.random() * fresh.length)]
    res.json({ id: sentence.id, test: sentence.test, text: sentence.text })
  },
)

const answerSchema = z.object({
  attemptId: z.uuid(),
  sentenceId: z.uuid(),
  // What speech-to-text heard (reading) or what the applicant typed (writing).
  answer: z.string().max(300),
})

englishRouter.post(
  '/answer',
  requireAuth,
  userLimiter({ windowMs: 60_000, limit: 90 }),
  async (req, res) => {
    const parsed = answerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: z.flattenError(parsed.error) })
      return
    }
    const { attemptId, sentenceId, answer } = parsed.data
    const userId = req.user!.id

    // The test must be this user's and still open.
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('english_test_attempts')
      .select('test_type, completed_at')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .maybeSingle()
    if (attemptError) {
      res.status(500).json({ error: 'Could not load the test' })
      return
    }
    if (!attempt) {
      res.status(404).json({ error: 'Test not found' })
      return
    }
    if (attempt.completed_at) {
      res.status(409).json({ error: 'This test is already finished' })
      return
    }

    // The sentence must belong to the same test (reading or writing) as the attempt.
    let sentence
    try {
      sentence = await findSentence(attempt.test_type, sentenceId)
    } catch {
      bankError(res)
      return
    }
    if (!sentence) {
      res.status(404).json({ error: 'Sentence not found' })
      return
    }

    const grade =
      attempt.test_type === 'reading'
        ? gradeReading(sentence.text, answer)
        : gradeWriting(sentence.text, answer)

    const { data: result, error: recordError } = await supabaseAdmin.rpc('record_english_answer', {
      p_user_id: userId,
      p_attempt_id: attemptId,
      p_sentence_id: sentenceId,
      p_is_correct: grade.passed,
    })
    if (recordError) {
      // 23505: this sentence was already used in this test.
      if (recordError.code === '23505') {
        res.status(409).json({ error: 'You already answered this sentence' })
        return
      }
      res.status(500).json({ error: 'Could not save your answer' })
      return
    }

    res.json({
      isCorrect: grade.passed,
      missing: grade.missing,
      heard: grade.heard,
      note: grade.note,
      attemptCompleted: result.attempt_completed,
      passed: result.passed,
      sentencesTried: result.sentences_tried,
      maxSentences: MAX_SENTENCES,
    })
  },
)
