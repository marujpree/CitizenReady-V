import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { steps } from '@/landing/steps'

// Guest tour: walks through the three things the app does using static screens.
// It never calls the API or the database, so no account or data is needed.
export default function GuestPreviewPage() {
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const isLast = index === steps.length - 1

  return (
    <main className="flex min-h-dvh flex-col items-center bg-muted px-4 pt-10 pb-12 sm:pt-16">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>
        <Wordmark className="text-foreground" />
      </div>

      <div className="mt-8 w-full max-w-3xl">
        <p className="text-sm font-medium text-brand-red">
          Guest preview · Step {index + 1} of {steps.length}
        </p>
        <div className="mt-2 flex gap-2" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 flex-1 rounded-full ${i <= index ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">{step.title}</h1>
        <p className="mt-3 max-w-2xl text-lg">{step.text}</p>
        <div className="mt-8">{step.fragment}</div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            className="h-11! rounded-lg! px-5 text-base"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          {isLast ? (
            <Button asChild className="h-11! rounded-lg! px-6 text-base">
              <Link to="/signup">
                Create free account
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="h-11! rounded-lg! px-6 text-base"
            >
              Next
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          This is a preview with sample data. Create a free account to save your progress.
        </p>
      </div>
    </main>
  )
}
