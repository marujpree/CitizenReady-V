import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../supabase.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; email?: string }
  }
}

// Checks the Supabase access token in the Authorization header and sets
// req.user. The user id passed to start_attempt and record_answer must always
// come from here, never from the request body.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null

  if (!token) {
    res.status(401).json({ error: 'Missing access token' })
    return
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired access token' })
    return
  }

  req.user = { id: data.user.id, email: data.user.email }
  next()
}
