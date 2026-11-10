import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { AnsweredQuestion } from './types'

const PASS_AT = 60

export function Results({
  answers,
  scorePercent,
  onAgain,
}: {
  answers: AnsweredQuestion[]
  scorePercent: number | null
  onAgain: () => void
}) {
  const correct = answers.filter((a) => a.result.isCorrect).length
  const score = scorePercent ?? Math.round((correct / Math.max(answers.length, 1)) * 100)
  const passed = score >= PASS_AT

  return (
    <div>
      <section className="rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12">
        <p className="text-sm font-medium text-primary-foreground/80">Your result</p>
        <p className="mt-2 text-7xl font-semibold tracking-[-0.04em] tabular-nums sm:text-8xl">
          {Math.round(score)}%
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          {passed ? 'You passed this round.' : 'Not there yet. Keep practicing.'}
        </h1>
        <p className="mt-2 text-primary-foreground/85">
          {correct} of {answers.length} correct. You need {PASS_AT}% to pass.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={onAgain}
            className="h-12! rounded-lg! bg-white! px-6 text-base text-primary!"
          >
            Practice again
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12! rounded-lg! border-white/40! bg-transparent! px-6 text-base text-white! hover:bg-white/10!"
          >
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 sm:p-10">
        <h2 className="text-xl font-semibold tracking-tight">Review your answers</h2>
        <ol className="mt-6 grid gap-6">
          {answers.map(({ question, typed, result }) => (
            <li key={question.id} className="flex gap-3">
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white ${
                  result.isCorrect ? 'bg-primary' : 'bg-brand-red'
                }`}
              >
                {result.isCorrect ? (
                  <Check className="size-4" aria-label="Correct" />
                ) : (
                  <X className="size-4" aria-label="Incorrect" />
                )}
              </span>
              <div className="min-w-0">
                <p className="font-semibold tracking-tight">{question.question_text}</p>
                <p className="mt-1 text-muted-foreground">You said: {typed}</p>
                {!result.isCorrect && (
                  <p className="mt-1">
                    Accepted: {result.acceptedAnswers.slice(0, 4).join('; ')}
                    {result.acceptedAnswers.length > 4 ? '; …' : ''}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
