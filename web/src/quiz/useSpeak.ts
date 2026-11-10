import { useCallback, useEffect, useRef, useState } from 'react'

// Reads text aloud with the browser's built-in voices. Free, no API key.
// Used to ask questions out loud and, later, to dictate the writing test.
// If the browser has no speech synthesis, `supported` is false so the UI can hide the button.

// Higher is better. Prefers US English, then natural-sounding or network voices,
// and avoids the robotic espeak voices some Linux systems fall back to.
function scoreVoice(v: SpeechSynthesisVoice): number {
  let score = 0
  if (v.lang === 'en-US' || v.lang === 'en_US') score += 10
  else if (v.lang.toLowerCase().startsWith('en')) score += 5
  else return -100 // not English
  if (/natural|neural|online/i.test(v.name)) score += 8
  if (/google/i.test(v.name)) score += 6
  if (/samantha|alex|aria|jenny|zira|ava|allison/i.test(v.name)) score += 3
  if (!v.localService) score += 2
  if (/espeak|mbrola/i.test(v.name)) score -= 10
  return score
}

export function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null
  let bestScore = -Infinity
  for (const v of voices) {
    const s = scoreVoice(v)
    if (s > bestScore) {
      best = v
      bestScore = s
    }
  }
  return bestScore > 0 ? best : null
}

export function useSpeak() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const voice = useRef<SpeechSynthesisVoice | null>(null)

  // Browsers load their voice list after the page starts, so listen for it.
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis
    const load = () => {
      voice.current = pickBestVoice(synth.getVoices())
    }
    load()
    synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [supported])

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
      if (voice.current) utterance.voice = voice.current
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
