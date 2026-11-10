import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.stubEnv('SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('SUPABASE_SECRET_KEY', 'test')

const getUser = vi.fn()
const rpc = vi.fn()
const results: Record<string, { data: unknown; error: unknown }> = {}
const loads = vi.fn()

// A tiny stand-in for the Supabase query builder: every filter returns itself. Awaiting it
// (the sentence list) or calling maybeSingle (one attempt) resolves to `results[table]`.
function builder(table: string) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq']) chain[method] = () => chain
  chain.maybeSingle = () => Promise.resolve(results[table])
  chain.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
    if (table === 'english_test_sentences') loads()
    return Promise.resolve(results[table]).then(resolve, reject)
  }
  return chain
}

vi.mock('../supabase.js', () => ({
  supabaseAdmin: { auth: { getUser }, from: (table: string) => builder(table), rpc },
}))

const { app } = await import('../app.js')
const { clearSentenceCache } = await import('../english/bank.js')

const ATTEMPT = '3f1b8f64-0b8e-4a52-9d0a-1f6f0e2f7a11'
const R1 = '9c2d3a4e-5b6f-4c7d-8e9f-0a1b2c3d4e5f'
const R2 = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
const W1 = '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b'
const auth = { Authorization: 'Bearer good' }

beforeEach(() => {
  clearSentenceCache()
  loads.mockReset()
  getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  rpc.mockReset().mockResolvedValue({
    data: { is_correct: true, attempt_completed: true, passed: true, sentences_tried: 1 },
    error: null,
  })
  results.english_test_sentences = {
    data: [
      { id: R1, test_type: 'reading', text: 'Who was George Washington?' },
      { id: R2, test_type: 'reading', text: 'Who lives in the White House?' },
      { id: W1, test_type: 'writing', text: 'Citizens can vote.' },
    ],
    error: null,
  }
  results.english_test_attempts = {
    data: { test_type: 'reading', sentence_ids: [], completed_at: null },
    error: null,
  }
})

describe('POST /english/start', () => {
  it('needs a login', async () => {
    const res = await request(app).post('/english/start').send({ test: 'reading' })
    expect(res.status).toBe(401)
  })

  it('rejects an unknown test', async () => {
    const res = await request(app).post('/english/start').set(auth).send({ test: 'speaking' })
    expect(res.status).toBe(400)
  })

  it('opens a test for the logged in user', async () => {
    rpc.mockResolvedValue({ data: ATTEMPT, error: null })
    const res = await request(app).post('/english/start').set(auth).send({ test: 'writing' })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ attemptId: ATTEMPT, maxSentences: 3 })
    expect(rpc).toHaveBeenCalledWith('start_english_attempt', { p_user_id: 'u1', p_test_type: 'writing' })
  })
})

describe('GET /english/sentence', () => {
  it('needs a login', async () => {
    const res = await request(app).get(`/english/sentence?attemptId=${ATTEMPT}`)
    expect(res.status).toBe(401)
  })

  it('rejects a bad attempt id', async () => {
    const res = await request(app).get('/english/sentence?attemptId=nope').set(auth)
    expect(res.status).toBe(400)
  })

  it('returns 404 when the test is not the user’s', async () => {
    results.english_test_attempts = { data: null, error: null }
    const res = await request(app).get(`/english/sentence?attemptId=${ATTEMPT}`).set(auth)
    expect(res.status).toBe(404)
  })

  it('returns 409 for a finished test', async () => {
    results.english_test_attempts = {
      data: { test_type: 'reading', sentence_ids: [R1], completed_at: '2026-11-10T00:00:00Z' },
      error: null,
    }
    const res = await request(app).get(`/english/sentence?attemptId=${ATTEMPT}`).set(auth)
    expect(res.status).toBe(409)
  })

  it('returns a sentence of the test type that was not used yet', async () => {
    results.english_test_attempts = {
      data: { test_type: 'reading', sentence_ids: [R1], completed_at: null },
      error: null,
    }
    const res = await request(app).get(`/english/sentence?attemptId=${ATTEMPT}`).set(auth)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: R2, test: 'reading', text: 'Who lives in the White House?' })
  })

  it('loads the sentences once and serves later requests from memory', async () => {
    await request(app).get(`/english/sentence?attemptId=${ATTEMPT}`).set(auth)
    await request(app).get(`/english/sentence?attemptId=${ATTEMPT}`).set(auth)
    expect(loads).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when the bank cannot be loaded and nothing is cached', async () => {
    results.english_test_sentences = { data: null, error: { message: 'down' } }
    const res = await request(app).get(`/english/sentence?attemptId=${ATTEMPT}`).set(auth)
    expect(res.status).toBe(500)
  })
})

describe('POST /english/answer', () => {
  const body = { attemptId: ATTEMPT, sentenceId: R1, answer: 'Who was George Washington?' }

  it('needs a login', async () => {
    const res = await request(app).post('/english/answer').send(body)
    expect(res.status).toBe(401)
  })

  it('rejects a bad body', async () => {
    const res = await request(app).post('/english/answer').set(auth).send({ attemptId: 'nope' })
    expect(res.status).toBe(400)
  })

  it('rejects an oversized answer', async () => {
    const res = await request(app)
      .post('/english/answer')
      .set(auth)
      .send({ ...body, answer: 'x'.repeat(301) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when the test is not the user’s', async () => {
    results.english_test_attempts = { data: null, error: null }
    const res = await request(app).post('/english/answer').set(auth).send(body)
    expect(res.status).toBe(404)
  })

  it('returns 409 for a finished test', async () => {
    results.english_test_attempts = {
      data: { test_type: 'reading', completed_at: '2026-11-10T00:00:00Z' },
      error: null,
    }
    const res = await request(app).post('/english/answer').set(auth).send(body)
    expect(res.status).toBe(409)
  })

  it('returns 404 for a sentence from the other test', async () => {
    const res = await request(app).post('/english/answer').set(auth).send({ ...body, sentenceId: W1 })
    expect(res.status).toBe(404)
  })

  it('grades a correct reading and records it', async () => {
    const res = await request(app).post('/english/answer').set(auth).send(body)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      isCorrect: true,
      attemptCompleted: true,
      passed: true,
      sentencesTried: 1,
      maxSentences: 3,
    })
    expect(rpc).toHaveBeenCalledWith('record_english_answer', {
      p_user_id: 'u1',
      p_attempt_id: ATTEMPT,
      p_sentence_id: R1,
      p_is_correct: true,
    })
  })

  it('records a wrong reading as not correct', async () => {
    rpc.mockResolvedValue({
      data: { is_correct: false, attempt_completed: false, passed: null, sentences_tried: 1 },
      error: null,
    })
    const res = await request(app)
      .post('/english/answer')
      .set(auth)
      .send({ ...body, answer: 'Who was Abraham Lincoln?' })
    expect(res.status).toBe(200)
    expect(res.body.isCorrect).toBe(false)
    expect(res.body.missing.length).toBeGreaterThan(0)
    expect(res.body.attemptCompleted).toBe(false)
    expect(rpc).toHaveBeenCalledWith('record_english_answer', expect.objectContaining({ p_is_correct: false }))
  })

  it('grades writing with the writing rules', async () => {
    results.english_test_attempts = {
      data: { test_type: 'writing', completed_at: null },
      error: null,
    }
    const res = await request(app)
      .post('/english/answer')
      .set(auth)
      .send({ attemptId: ATTEMPT, sentenceId: W1, answer: 'citizens can vote' })
    expect(res.status).toBe(200)
    expect(res.body.isCorrect).toBe(true)
  })

  it('returns 409 when the sentence was already used', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23505', message: 'dup' } })
    const res = await request(app).post('/english/answer').set(auth).send(body)
    expect(res.status).toBe(409)
  })

  it('returns 500 when saving fails', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom' } })
    const res = await request(app).post('/english/answer').set(auth).send(body)
    expect(res.status).toBe(500)
  })
})
