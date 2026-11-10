import type { Request } from 'express'
import { rateLimit } from 'express-rate-limit'

const tooMany = { error: 'Too many requests. Please slow down and try again in a minute.' }

// First line of defence, before any call to Supabase. Keyed by IP address.
// Behind a proxy or host, set app.set('trust proxy', ...) so this sees the real IP.
export const ipLimiter = rateLimit({
  windowMs: 60_000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany,
})

// Second line, for signed-in users. Use after requireAuth so req.user is set.
export function userLimiter({ windowMs, limit }: { windowMs: number; limit: number }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: tooMany,
    keyGenerator: (req: Request) => req.user!.id,
    validate: { keyGeneratorIpFallback: false },
  })
}
