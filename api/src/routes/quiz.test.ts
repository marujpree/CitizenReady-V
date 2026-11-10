import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.stubEnv('SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('SUPABASE_SECRET_KEY', 'test')

const getUser = vi.fn()
const rpc = vi.fn()
const results: Record<string, { data: unknown; error: unknown }> = {}

// A tiny stand-in for the Supabase query builder: every filter returns itself
// and the final call resolves to whatever the test put in `results[table]`.
function builder(table: string) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq']) chain[method] = () => chain
  chain.maybeSingle = () => Promise.resolve(results[table])
  return chain
}

vi.mock('../supabase.js', () => ({
  supabaseAdmin: { auth: { getUser }, from: (table: string) => builder(table), rpc },
}))

const { app } = await import('../app.js')

const ATTEMPT = '3f1b8f64-0b8e-4a52-9d0a-1f6f0e2f7a11'
const QUESTION = '9c2d3a4e-5b6f-4c7d-8e9f-0a1b2c3d4e5f'
const auth = { Authorization: 'Bearer good' }
const body = { attemptId: ATTEMPT, questionId: QUESTION, answer: 'The Constitution' }

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  rpc.mockReset().mockResolvedValue({
    data: { is_correct: true, attempt_completed: false, score_percent: null, passed: null },
    error: null,
  })
  results.practice_attempts = { data: { id: ATTEMPT, test_version: 2025, completed_at: null }, error: null }
  results.civics_questions = {
    data: { id: QUESTION, accepted_answers: ['(U.S.) Constitution'], required_count: 1 },
    error: null,
  }
})

describe('POST /quiz/answer', () => {
  it('needs a login', async () => {
    const res = await request(app).post('/quiz/answer').send(body)
    expect(res.status).toBe(401)
  })

  it('rejects a bad body', async () => {
    const res = await request(app).post('/quiz/answer').set(auth).send({ attemptId: 'nope' })
    expect(res.status).toBe(400)
  })

  it('rejects an oversized answer', async () => {
    const res = await request(app)
      .post('/quiz/answer')
      .set(auth)
      .send({ ...body, answer: 'x'.repeat(501) })
    expect(res.status).toBe(400)
  })

  it('grades a correct answer and records it with the logged-in user', async () => {
    const res = await request(app).post('/quiz/answer').set(auth).send(body)
    expect(res.status).toBe(200)
    expect(res.body.isCorrect).toBe(true)
    expect(res.body.acceptedAnswers).toEqual(['(U.S.) Constitution'])
    expect(rpc).toHaveBeenCalledWith(
      'record_answer',
      expect.objectContaining({ p_user_id: 'u1', p_is_correct: true, p_graded_by: 'rule' }),
    )
  })

  it('never trusts a client-sent user id or result', async () => {
    const res = await request(app)
      .post('/quiz/answer')
      .set(auth)
      .send({ ...body, answer: 'Congress', userId: 'someone-else', isCorrect: true })
    expect(res.body.isCorrect).toBe(false)
    expect(rpc).toHaveBeenCalledWith(
      'record_answer',
      expect.objectContaining({ p_user_id: 'u1', p_is_correct: false }),
    )
  })

  it('404s when the quiz is not the user’s', async () => {
    results.practice_attempts = { data: null, error: null }
    const res = await request(app).post('/quiz/answer').set(auth).send(body)
    expect(res.status).toBe(404)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('409s when the quiz is finished', async () => {
    results.practice_attempts = {
      data: { id: ATTEMPT, test_version: 2025, completed_at: '2026-01-01' },
      error: null,
    }
    const res = await request(app).post('/quiz/answer').set(auth).send(body)
    expect(res.status).toBe(409)
  })

  it('404s for an inactive or unknown question', async () => {
    results.civics_questions = { data: null, error: null }
    const res = await request(app).post('/quiz/answer').set(auth).send(body)
    expect(res.status).toBe(404)
  })

  it('409s when the question was already answered', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } })
    const res = await request(app).post('/quiz/answer').set(auth).send(body)
    expect(res.status).toBe(409)
  })

  it('reports the score when the last answer finishes the quiz', async () => {
    rpc.mockResolvedValue({
      data: { is_correct: true, attempt_completed: true, score_percent: 80, passed: true },
      error: null,
    })
    const res = await request(app).post('/quiz/answer').set(auth).send(body)
    expect(res.body).toMatchObject({ attemptCompleted: true, scorePercent: 80, passed: true })
  })
})
