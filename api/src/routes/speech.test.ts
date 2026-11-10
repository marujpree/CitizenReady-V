import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.stubEnv('SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('SUPABASE_SECRET_KEY', 'test')
vi.stubEnv('GROQ_API_KEY', 'groq-test-key')

const getUser = vi.fn()
vi.mock('../supabase.js', () => ({ supabaseAdmin: { auth: { getUser } } }))

const { app } = await import('../app.js')

const auth = { Authorization: 'Bearer good' }
const audio = Buffer.from('fake audio bytes')
const fetchMock = vi.fn()

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  fetchMock.mockReset().mockResolvedValue(new Response(JSON.stringify({ text: ' The Constitution ' })))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

// supertest uses real HTTP to our app, so only the call to Groq is faked.
async function post(headers: Record<string, string>, body: Buffer = audio) {
  vi.unstubAllGlobals()
  const realFetch = globalThis.fetch
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) =>
    String(url).includes('groq.com') ? fetchMock(url, init) : realFetch(url, init),
  )
  return request(app).post('/speech/transcribe').set(headers).send(body)
}

describe('POST /speech/transcribe', () => {
  it('needs a login', async () => {
    const res = await post({ 'Content-Type': 'audio/webm' })
    expect(res.status).toBe(401)
  })

  it('returns the trimmed transcript', async () => {
    const res = await post({ ...auth, 'Content-Type': 'audio/webm;codecs=opus' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ text: 'The Constitution' })
  })

  it('sends the key, model and language to Groq, not to the client', async () => {
    await post({ ...auth, 'Content-Type': 'audio/webm' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('api.groq.com')
    expect(init.headers.Authorization).toBe('Bearer groq-test-key')
    const form = init.body as FormData
    expect(form.get('model')).toBe('whisper-large-v3')
    expect(form.get('language')).toBe('en')
  })

  it('rejects an empty body', async () => {
    const res = await post({ ...auth, 'Content-Type': 'audio/webm' }, Buffer.alloc(0))
    expect(res.status).toBe(400)
  })

  it('rejects audio over 2 MB', async () => {
    const res = await post({ ...auth, 'Content-Type': 'audio/webm' }, Buffer.alloc(3 * 1024 * 1024))
    expect(res.status).toBe(413)
  })

  it('passes a Groq rate limit on as 429 so the web app can fall back', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429 }))
    const res = await post({ ...auth, 'Content-Type': 'audio/webm' })
    expect(res.status).toBe(429)
  })

  it('returns 502 when Groq fails', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    const res = await post({ ...auth, 'Content-Type': 'audio/webm' })
    expect(res.status).toBe(502)
  })
})

describe('GET /speech/status', () => {
  it('needs a login', async () => {
    const res = await request(app).get('/speech/status')
    expect(res.status).toBe(401)
  })

  it('says transcription is on when a key is set, without leaking it', async () => {
    const res = await request(app).get('/speech/status').set(auth)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ transcription: true })
  })
})

describe('without a Groq key', () => {
  it('returns 503 so the web app uses browser speech recognition', async () => {
    vi.resetModules()
    vi.stubEnv('GROQ_API_KEY', undefined as unknown as string)
    delete process.env.GROQ_API_KEY
    const { app: bare } = await import('../app.js')
    const res = await request(bare)
      .post('/speech/transcribe')
      .set({ ...auth, 'Content-Type': 'audio/webm' })
      .send(audio)
    expect(res.status).toBe(503)
  })

  it('reports transcription as off', async () => {
    vi.resetModules()
    delete process.env.GROQ_API_KEY
    const { app: bare } = await import('../app.js')
    const res = await request(bare).get('/speech/status').set(auth)
    expect(res.body).toEqual({ transcription: false })
  })
})
