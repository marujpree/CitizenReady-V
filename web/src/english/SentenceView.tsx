// One sentence of the reading or writing test.
// Reading: the sentence is on screen, the applicant reads it out loud (or types it if there is no mic).
// Writing: the sentence is only spoken. It is NOT shown, so the applicant has to write what they hear.
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import { useSpeak } from '@/quiz/useSpeak'
import { useSpeech } from '@/quiz/useSpeech'
import type { EnglishAnswerResponse, EnglishSentence } from './types'
import { useSubmitEnglishAnswer } from './useEnglish'

export function SentenceView({
  attemptId,
  sentence,
  number,
  max,
  onAnswered,
  onNext,
  loadingNext,
  nextError,
}: {
  attemptId: string
  sentence: EnglishSentence
  number: number // 1 to max
  max: number
  onAnswered: (answer: string, result: EnglishAnswerResponse) => void
  onNext: () => void
  loadingNext: boolean
  nextError: string | null
}) {
  const reading = sentence.test === 'reading'
  const [text, setText] = useState('')
  const [result, setResult] = useState<EnglishAnswerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submit = useSubmitEnglishAnswer()
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  // Reading: what the speech engine heard fills the box, and the applicant can fix it.
  const onSpeech = useCallback((t: string) => setText(t), [])
  const speech = useSpeech(onSpeech)
  const voice = useSpeak()

  useEffect(() => {
    if (!reading) inputRef.current?.focus()
  }, [reading])
  useEffect(() => {
    if (result) nextRef.current?.focus()
  }, [result])

  async function send(answer: string) {
    if (submit.isPending || result) return
    setError(null)
    speech.stop()
    voice.stop()
    try {
      const res = await submit.mutateAsync({ attemptId, sentenceId: sentence.id, answer })
      setResult(res)
      onAnswered(answer, res)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (text.trim()) void send(text.trim())
  }

  const done = result?.attemptCompleted ?? false
  const shown = number - (result ? 0 : 1)

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>
          Sentence {number} of {max}
        </span>
        <span>{reading ? 'Reading test' : 'Writing test'}</span>
      </div>
      <div
        role="progressbar"
        aria-label="English test progress"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={shown}
        className="mt-3 h-2 overflow-hidden rounded-full bg-white"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${(shown / max) * 100}%` }}
        />
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 sm:p-10">
        {reading ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">Read this sentence out loud.</p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {sentence.text}
            </h1>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-muted-foreground">
              Listen to the sentence, then write it.
            </p>
            {voice.supported ? (
              <Button
                type="button"
                onClick={() => (voice.speaking ? voice.stop() : voice.speak(sentence.text, 0.8))}
                aria-label={voice.speaking ? 'Stop the sentence' : 'Listen to the sentence'}
                className="mt-3 h-14! rounded-xl! px-6 text-lg"
              >
                {voice.speaking ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                {voice.speaking ? 'Stop' : 'Listen to the sentence'}
              </Button>
            ) : (
              // No text-to-speech in this browser, so the only way to practice is to see it.
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {sentence.text}
                <span className="mt-2 block text-sm font-normal text-muted-foreground">
                  This browser cannot read aloud, so the sentence is shown. Try writing it from memory.
                </span>
              </p>
            )}
            {voice.supported && (
              <p className="mt-2 text-sm text-muted-foreground">You can listen as many times as you need.</p>
            )}
          </>
        )}

        <form onSubmit={onSubmit} className="mt-8">
          <label htmlFor="english-answer" className="text-sm font-medium text-muted-foreground">
            {reading
              ? speech.supported
                ? 'Tap the microphone and read the sentence. You can fix the text before you check it.'
                : 'Type the sentence you read.'
              : 'Write the sentence you heard.'}
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id="english-answer"
              ref={inputRef}
              value={text}
              maxLength={300}
              autoComplete="off"
              spellCheck={!reading ? false : undefined}
              disabled={!!result}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                speech.listening
                  ? 'Listening…'
                  : speech.busy
                    ? 'Turning your voice into text…'
                    : reading
                      ? 'What we hear shows up here'
                      : 'Type the sentence'
              }
              className="h-14! rounded-xl! px-4 text-lg!"
            />
            {reading && speech.supported && !result && (
              <Button
                type="button"
                variant="outline"
                disabled={speech.busy}
                onClick={speech.listening ? speech.stop : speech.start}
                aria-label={speech.listening ? 'Stop listening' : 'Read the sentence with your voice'}
                aria-pressed={speech.listening}
                className={`h-14! w-14 shrink-0 rounded-xl! p-0 ${
                  speech.listening ? 'bg-brand-red! text-white! border-brand-red!' : ''
                }`}
              >
                {speech.listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </Button>
            )}
          </div>

          {reading && speech.error && (
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              {speech.error}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-destructive">
              {error}
            </p>
          )}

          {!result && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={!text.trim() || submit.isPending}
                className="h-12! rounded-lg! px-6 text-base"
              >
                {submit.isPending ? 'Checking…' : 'Check sentence'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={submit.isPending}
                onClick={() => void send('')}
                className="h-12! rounded-lg! px-4 text-base"
              >
                {reading ? 'I can’t read this one' : 'I didn’t catch it'}
              </Button>
            </div>
          )}
        </form>

        {result && (
          <div aria-live="polite" className="mt-8">
            <div
              className={`rounded-2xl p-5 ${
                result.isCorrect ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <p
                className={`flex items-center gap-2 text-lg font-semibold ${
                  result.isCorrect ? '' : 'text-brand-red'
                }`}
              >
                {result.isCorrect ? (
                  <Check className="size-5" aria-hidden="true" />
                ) : (
                  <X className="size-5" aria-hidden="true" />
                )}
                {result.isCorrect ? 'Correct' : 'Not quite'}
              </p>
              <div
                className={`mt-3 grid gap-1 text-sm ${
                  result.isCorrect ? 'text-primary-foreground/90' : 'text-muted-foreground'
                }`}
              >
                <p>The sentence was: “{sentence.text}”</p>
                {result.heard && <p>We read: “{result.heard}”</p>}
                {result.missing.length > 0 && <p>Missing or different: {result.missing.join(', ')}</p>}
                {result.note && <p>{result.note}</p>}
              </div>
            </div>

            <p className="mt-4 text-muted-foreground">
              {result.isCorrect
                ? 'You passed this test. One correct sentence is all you need.'
                : done
                  ? 'That was your last sentence.'
                  : `You can try ${result.maxSentences - result.sentencesTried} more ${
                      result.maxSentences - result.sentencesTried === 1 ? 'sentence' : 'sentences'
                    }.`}
            </p>

            {nextError && (
              <p role="alert" className="mt-3 text-destructive">
                {nextError}
              </p>
            )}
            <Button
              ref={nextRef}
              disabled={loadingNext}
              onClick={onNext}
              className="mt-6 h-12! rounded-lg! px-6 text-base"
            >
              {done ? 'See my result' : loadingNext ? 'Loading…' : 'Next sentence'}
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
