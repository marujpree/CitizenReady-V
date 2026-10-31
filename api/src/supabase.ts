import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

// Service-role client. It bypasses RLS and can run start_attempt and
// record_answer, so it is for server code only and never goes to the web app.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
