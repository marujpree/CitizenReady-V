import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
})

export const env = schema.parse(process.env)
