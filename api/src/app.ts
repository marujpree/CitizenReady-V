import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './env.js'

export const app = express()

app.use(helmet())
app.use(cors({ origin: env.WEB_ORIGIN }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
