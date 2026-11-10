import { useCallback, useEffect, useState } from 'react'

// Reads text aloud with the browser's built-in voice. Free, no API key.
// Used to ask questions out loud and, later, to dictate the writing test.
// If the browser has no speech synthesis, `supported` is false so the UI can hide the button.
export function useSpeak() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string, rate = 0.9) => {
      if (!supported) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = rate // a little slower than normal, easier to follow
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
    },
    [supported],
  )

  // Stop talking when the component goes away.
  useEffect(() => stop, [stop])

  return { supported, speaking, speak, stop }
}
