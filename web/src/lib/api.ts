import { env } from '@/env'
import { supabase } from '@/lib/supabase'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new ApiError('You are signed out. Please log in again.', 401)
  return token
}

// Sends the request and turns any failure into an ApiError with a friendly message.
async function send<T>(path: string, init: RequestInit): Promise<T> {
  const token = await accessToken()
  let res: Response
  try {
    res = await fetch(`${env.VITE_API_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0)
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      res.status === 429
        ? 'You are going a little fast. Wait a moment and try again.'
        : typeof json.error === 'string'
          ? json.error
          : 'Something went wrong. Please try again.'
    throw new ApiError(message, res.status)
  }
  return json as T
}

// Calls our Express API with the signed-in user's access token.
// The server decides who the user is from that token, never from the body.
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return send<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiGet<T>(path: string): Promise<T> {
  return send<T>(path, { method: 'GET' })
}

// Sends a recorded audio clip as the raw request body (not JSON).
export function apiPostAudio<T>(path: string, audio: Blob): Promise<T> {
  return send<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': audio.type || 'audio/webm' },
    body: audio,
  })
}
