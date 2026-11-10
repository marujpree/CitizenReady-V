import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, apiPostAudio } from '@/lib/api'

// Records a short clip from the microphone and sends it to our API, which asks
// Groq's Whisper model for the text. Works in every modern browser, including Firefox.
// Answers are short, so a clip is cut off after MAX_SECONDS.
const MAX_SECONDS = 15

// Safari records mp4, Chrome and Firefox record webm. Take the first one the browser can make.
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

export type RecorderState = 'idle' | 'recording' | 'transcribing'

export function useRecorder(onText: (text: string) => void) {
  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  const [state, setState] = useState<RecorderState>('idle')
  const [error, setError] = useState<string | null>(null)
  // True when the speech service itself failed (busy, down, not set up), not the user's mic.
  const [serviceFailed, setServiceFailed] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  // Release the microphone if the component goes away mid-recording.
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
      const r = recorder.current
      if (r && r.state !== 'inactive') {
        r.onstop = null
        r.stop()
      }
      r?.stream.getTracks().forEach((t) => t.stop())
    },
    [],
  )

  const start = useCallback(async () => {
    if (!supported || state !== 'idle') return
    setError(null)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('We could not use your microphone. Check the permission, or type your answer.')
      return
    }

    const mimeType = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    const chunks: Blob[] = []
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const clip = new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' })
      // A tiny clip means nothing was said.
      if (clip.size < 1500) {
        setState('idle')
        setError('We did not hear anything. Try again, or type your answer.')
        return
      }
      setState('transcribing')
      try {
        const { text } = await apiPostAudio<{ text: string }>('/speech/transcribe', clip)
        if (text) onText(text)
        else setError('We did not catch that. Try again, or type your answer.')
      } catch (e) {
        // 401 and 400 are not the service's fault; everything else means use another way.
        if (!(e instanceof ApiError) || (e.status !== 401 && e.status !== 400)) setServiceFailed(true)
        setError('We could not turn your voice into text just now. Type your answer, or try again.')
      } finally {
        setState('idle')
      }
    }

    recorder.current = rec
    rec.start()
    setState('recording')
    timer.current = window.setTimeout(stop, MAX_SECONDS * 1000)
  }, [supported, state, onText, stop])

  const resetFailure = useCallback(() => setServiceFailed(false), [])

  return { supported, state, error, serviceFailed, resetFailure, start, stop }
}
