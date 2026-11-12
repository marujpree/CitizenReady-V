// Final screen of an English test: passed or not, and a review of each sentence.
import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { EnglishRound, EnglishTestType } from './types'

export function EnglishResults({
  test,
  passed,
  rounds,
  onAgain,
}: {
  test: EnglishTestType
  passed: boolean
  rounds: EnglishRound[]
  onAgain: () => void
}) {
  const name = test === 'reading' ? 'reading' : 'writing'

  return (
    <div>
      <section className="rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12">
        <p className="text-sm font-medium text-primary-foreground/80">Your {name} test</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          {passed ? 'You passed.' : 'Not yet.'}
        </h1>
        <p className="mt-3 text-primary-foreground/85">
          {passed
            ? `You got ${rounds.length === 1 ? 'the first sentence' : `sentence ${rounds.length}`} right. At the real interview, the officer stops as soon as you get one right.`
            : 'You need to get one of up to three sentences right. Practice again and you will get there.'}
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
        <h2 className="text-xl font-semibold tracking-tight">Review your sentences</h2>
        <ol className="mt-6 grid gap-6">
          {rounds.map(({ sentence, answer, result }) => (
            <li key={sentence.id} className="flex gap-3">
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
                <p className="font-semibold tracking-tight">{sentence.text}</p>
                <p className="mt-1 text-muted-foreground">
                  {answer ? `You ${test === 'reading' ? 'said' : 'wrote'}: ${answer}` : 'No answer'}
                </p>
                {result.missing.length > 0 && (
                  <p className="mt-1">Missing or different: {result.missing.join(', ')}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
