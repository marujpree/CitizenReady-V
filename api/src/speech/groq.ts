// Sends one short audio clip to Groq's Whisper model and returns the text.
// The key stays on the server. Docs: https://console.groq.com/docs/speech-to-text
const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

// whisper-large-v3 is the more accurate model. Our clips are short, so the cost is tiny.
const MODEL = 'whisper-large-v3'

// Hints the model toward words people say in the civics test (max 224 tokens).
const VOCAB_PROMPT =
  'U.S. civics test answers: Constitution, Bill of Rights, Declaration of Independence, ' +
  'Congress, Senate, House of Representatives, Supreme Court, President, Thomas Jefferson, ' +
  'George Washington, Abraham Lincoln, Martin Luther King Jr., freedom of speech.'

export class TranscribeError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

const EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/flac': 'flac',
}

export async function transcribe(audio: Buffer, contentType: string, apiKey: string): Promise<string> {
  // "audio/webm;codecs=opus" -> "audio/webm"
  const type = contentType.split(';')[0].trim().toLowerCase()
  const ext = EXTENSIONS[type] ?? 'webm'

  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(audio)], { type }), `answer.${ext}`)
  form.append('model', MODEL)
  form.append('language', 'en')
  form.append('prompt', VOCAB_PROMPT)
  form.append('response_format', 'json')
  form.append('temperature', '0')

  let res: Response
  try {
    res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new TranscribeError('The speech service did not respond', 502)
  }

  if (res.status === 429) throw new TranscribeError('The speech service is busy', 429)
  if (!res.ok) throw new TranscribeError('The speech service failed', 502)

  const data = (await res.json()) as { text?: unknown }
  return typeof data.text === 'string' ? data.text.trim() : ''
}
