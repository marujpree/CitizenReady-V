import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'

vi.stubEnv('SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('SUPABASE_SECRET_KEY', 'test')

const getUser = vi.fn()
vi.mock('../supabase.js', () => ({ supabaseAdmin: { auth: { getUser } } }))

const { requireAuth } = await import('./auth.js')

function run(authorization?: string) {
  const req = { header: () => authorization } as unknown as Request
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response
  const next = vi.fn() as unknown as NextFunction
  return { req, res, next, done: requireAuth(req, res, next) }
}

describe('requireAuth', () => {
  beforeEach(() => getUser.mockReset())

  it('rejects a missing header', async () => {
    const { res, next, done } = run()
    await done
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects an invalid token', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('bad') })
    const { res, next, done } = run('Bearer nope')
    await done
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('sets req.user for a valid token', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.c' } }, error: null })
    const { req, next, done } = run('Bearer good')
    await done
    expect(req.user).toEqual({ id: 'u1', email: 'a@b.c' })
    expect(next).toHaveBeenCalled()
  })
})
