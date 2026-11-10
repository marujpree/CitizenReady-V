import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api'
import type { AnswerResponse, QuizQuestion } from './types'
import { useSpeak } from './useSpeak'
import { useSpeech } from './useSpeech'
import { useSubmitAnswer } from './useQuiz'

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five']

export function QuestionView({
  attemptId,
  question,
  index,
  total,
  onAnswered,
  onNext,
}: {
  attemptId: string
  question: QuizQuestion
  index: number
  total: number
  onAnswered: (typed: string, result: AnswerResponse) => void
  onNext: () => void
}) {
  const [text, setText] = useState('')
  const [spoken, setSpoken] = useState(false)
  const [result, setResult] = useState<AnswerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submit = useSubmitAnswer()
  const shownAt = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const onSpeech = useCallback((t: string) => {
    setText(t)
    setSpoken(true)
  }, [])
  const speech = useSpeech(onSpeech)
  const voice = useSpeak()

  useEffect(() => {
    shownAt.current = Date.now()
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    if (result) nextRef.current?.focus()
  }, [result])

  async function send(answer: string) {
    if (submit.isPending || result) return
    setError(null)
    speech.stop()
    try {
      const res = await submit.mutateAsync({
        attemptId,
        questionId: question.id,
        answer,
        inputMode: spoken ? 'spoken' : 'typed',
        responseTimeMs: Math.min(Date.now() - shownAt.current, 600_000),
      })
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

  const isLast = index + 1 === total
  const needed = question.required_count
  const hint =
    needed > 1
      ? `Give ${NUMBER_WORDS[needed] ?? needed} answers, separated by commas.`
      : 'Answer in your own words.'

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>{question.category}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + (result ? 1 : 0)}
        className="mt-3 h-2 overflow-hidden rounded-full bg-white"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${((index + (result ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 sm:p-10">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {question.question_text}
        </h1>
        {voice.supported && (
          <Button
            type="button"
            variant="outline"
            onClick={() => (voice.speaking ? voice.stop() : voice.speak(question.question_text))}
            aria-label={voice.speaking ? 'Stop reading the question' : 'Read the question aloud'}
            className="mt-4 h-10! rounded-lg! px-4"
          >
            {voice.speaking ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            {voice.speaking ? 'Stop' : 'Listen'}
          </Button>
        )}

        <form onSubmit={onSubmit} className="mt-8">
          <label htmlFor="answer" className="text-sm font-medium text-muted-foreground">
            {hint}
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id="answer"
              ref={inputRef}
              value={text}
              maxLength={500}
              autoComplete="off"
              disabled={!!result}
              onChange={(e) => {
                setText(e.target.value)
                setSpoken(false)
              }}
              placeholder={speech.listening ? 'Listening…' : 'Type your answer'}
              className="h-14! rounded-xl! px-4 text-lg!"
            />
            {speech.supported && !result && (
              <Button
                type="button"
                variant="outline"
                onClick={speech.listening ? speech.stop : speech.start}
                aria-label={speech.listening ? 'Stop listening' : 'Answer with your voice'}
                aria-pressed={speech.listening}
                className={`h-14! w-14 shrink-0 rounded-xl! p-0 ${
                  speech.listening ? 'bg-brand-red! text-white! border-brand-red!' : ''
                }`}
              >
                {speech.listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </Button>
            )}
          </div>

          {speech.error && (
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
                {submit.isPending ? 'Checking…' : 'Check answer'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={submit.isPending}
                onClick={() => void send("I don't know")}
                className="h-12! rounded-lg! px-4 text-base"
              >
                I don’t know
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
              <p className={`mt-3 text-sm ${result.isCorrect ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {result.isCorrect ? 'Other accepted answers' : 'Accepted answers'}
                {needed > 1 ? ` (any ${needed})` : ''}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {result.acceptedAnswers.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <Button
              ref={nextRef}
              onClick={onNext}
              className="mt-6 h-12! rounded-lg! px-6 text-base"
            >
              {isLast ? 'See my results' : 'Next question'}
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
