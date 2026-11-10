import { useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/auth-context'
import { apiGet } from '@/lib/api'
import { useBrowserSpeech } from './useBrowserSpeech'
import { useRecorder } from './useRecorder'

// Does the server have Whisper set up? Cached, and never blocks the quiz.
export function useSpeechStatus() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['speech-status', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: () => apiGet<{ transcription: boolean }>('/speech/status'),
  })
}

// How long to skip Whisper after it fails, so the user is not stuck retrying a broken service.
const RETRY_AFTER_MS = 60_000

// One mic button, best available engine:
//   1. Whisper via our API (accurate, works in every browser), when the server has it.
//   2. The browser's own speech recognition (Chrome, Edge, Safari) when Whisper is off or failed.
//   3. Neither: `supported` is false and the UI hides the button, leaving the typing box.
export function useSpeech(onText: (text: string) => void) {
  const { data: status } = useSpeechStatus()
  const browser = useBrowserSpeech(onText)
  const whisper = useRecorder(onText)
  const { serviceFailed, resetFailure } = whisper

  useEffect(() => {
    if (!serviceFailed) return
    const id = window.setTimeout(resetFailure, RETRY_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [serviceFailed, resetFailure])

  const useWhisper = status?.transcription === true && whisper.supported && !serviceFailed
  const supported = useWhisper || browser.supported

  const start = useCallback(() => {
    if (useWhisper) void whisper.start()
    else browser.start()
  }, [useWhisper, whisper, browser])

  const stop = useCallback(() => {
    whisper.stop()
    browser.stop()
  }, [whisper, browser])

  return {
    supported,
    listening: whisper.state === 'recording' || browser.listening,
    busy: whisper.state === 'transcribing',
    error: whisper.error ?? browser.error,
    start,
    stop,
  }
}
