import { createClient } from '@supabase/supabase-js'
import { env } from '@/env'

// Browser client. Uses the publishable key only, so RLS decides what it can read.
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
