import express, { Router } from 'express'
import { env } from '../env.js'
import { requireAuth } from '../middleware/auth.js'
import { ipLimiter, userLimiter } from '../middleware/rate-limit.js'
import { transcribe, TranscribeError } from '../speech/groq.js'

export const speechRouter = Router()

speechRouter.use(ipLimiter)

// The browser sends the raw audio bytes (not JSON). A short answer is well under 1 MB,
// so 2 MB is plenty and keeps one user from using up the shared Groq quota.
const audioBody = express.raw({ type: 'audio/*', limit: '2mb' })

// Groq's free quota is shared by every user, so each person gets a small share.
speechRouter.post(
  '/transcribe',
  requireAuth,
  userLimiter({ windowMs: 60_000, limit: 30 }),
  audioBody,
  async (req, res) => {
    // No key set: tell the web app to use the browser's own speech recognition.
    if (!env.GROQ_API_KEY) {
      res.status(503).json({ error: 'Speech service is not set up' })
      return
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: 'Send the audio as the request body' })
      return
    }

    try {
      const text = await transcribe(req.body, req.get('content-type') ?? '', env.GROQ_API_KEY)
      res.json({ text })
    } catch (e) {
      if (e instanceof TranscribeError) {
        res.status(e.status).json({ error: e.message })
        return
      }
      res.status(500).json({ error: 'Could not transcribe the audio' })
    }
  },
)
