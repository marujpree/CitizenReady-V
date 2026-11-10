// What this browser can do with voice. Based on features it actually has, not the
// browser's name, because names lie and versions change. The browser name is only
// used to word the tip.
export type VoiceSupport = {
  recognition: boolean // browser speech-to-text (Chrome, Edge, Safari)
  synthesis: boolean // browser text-to-speech
  recording: boolean // can record audio for Whisper
  browser: 'Firefox' | 'Chrome' | 'Edge' | 'Safari' | 'your browser'
  linux: boolean
}

export function getVoiceSupport(): VoiceSupport {
  const w = window as unknown as Record<string, unknown>
  const ua = navigator.userAgent
  const browser = /Firefox\//.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'your browser'
  return {
    recognition: !!(w.SpeechRecognition ?? w.webkitSpeechRecognition),
    synthesis: 'speechSynthesis' in window,
    recording: typeof MediaRecorder !== 'undefined',
    browser,
    linux: /Linux/.test(ua) && !/Android/.test(ua),
  }
}

// One short tip, or null when everything we use works. Mentions what still works.
export function voiceTip(s: VoiceSupport): string | null {
  if (!s.synthesis && !s.recognition) {
    return `Voice features are not available in ${s.browser}. You can still type your answers. For voice, try Chrome, Edge or Safari.`
  }
  if (!s.recognition) {
    return `Speaking your answers works best in Chrome, Edge or Safari. ${s.browser === 'your browser' ? 'This browser' : s.browser} does not support it yet, so type your answers instead.`
  }
  if (s.browser === 'Firefox' && s.linux) {
    return 'Read-aloud may sound robotic in Firefox on Linux. Chrome or Edge usually sound better.'
  }
  return null
}
