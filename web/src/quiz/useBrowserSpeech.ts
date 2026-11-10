import { useCallback, useEffect, useRef, useState } from 'react'

// The browser's built-in speech recognition. Free, no API key. Chrome, Edge and
// Safari have it; Firefox does not, so the mic button hides itself there.
type RecognitionResult = { 0: { transcript: string }; isFinal: boolean }
type RecognitionEvent = { results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionCtor = new () => Recognition

function getCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useBrowserSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<Recognition | null>(null)
  const supported = typeof window !== 'undefined' && getCtor() !== null

  useEffect(() => () => ref.current?.stop(), [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) return
    setError(null)
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim()
      onText(text)
    }
    rec.onerror = () => {
      setError('We could not hear you. Check your microphone permission, or type your answer.')
      setListening(false)
    }
    rec.onend = () => setListening(false)
    ref.current = rec
    setListening(true)
    rec.start()
  }, [onText])

  const stop = useCallback(() => ref.current?.stop(), [])

  return { supported, listening, error, start, stop }
}
