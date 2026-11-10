import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './env.js'
import { quizRouter } from './routes/quiz.js'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.WEB_ORIGIN }))
app.use(express.json({ limit: '10kb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/quiz', quizRouter)
