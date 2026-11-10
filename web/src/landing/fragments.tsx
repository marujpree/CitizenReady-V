import { Check, X } from 'lucide-react'

// Static pictures of the app, shared by the landing page and the guest preview.
// Active questions per category in our question bank.
const categories = [
  { name: 'System of Government', total: 39 },
  { name: 'Recent American History', total: 19 },
  { name: 'Colonial Period and Independence', total: 17 },
  { name: 'Principles of American Government', total: 15 },
  { name: 'Rights and Responsibilities', total: 10 },
  { name: 'Symbols', total: 6 },
  { name: 'Holidays', total: 4 },
]

// Example progress for the picture of the dashboard. It is a sample, not a real user.
const sampleMastered: Record<string, number> = {
  'System of Government': 24,
  'Recent American History': 11,
  'Colonial Period and Independence': 14,
  'Principles of American Government': 15,
  'Rights and Responsibilities': 6,
  Symbols: 5,
  Holidays: 2,
}

export function QuizFragment() {
  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>Practice exam</span>
        <span>Question 4 of 10</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[40%] rounded-full bg-primary" />
      </div>
      <p className="mt-8 text-2xl leading-tight font-semibold tracking-tight">
        What did the Declaration of Independence do?
      </p>
      <div className="mt-6 rounded-xl bg-muted px-4 py-3 text-lg">
        Announced our independence from Great Britain
        <span className="ml-0.5 inline-block h-5 w-px translate-y-1 bg-foreground" />
      </div>
      <div className="mt-5 flex gap-3">
        <span className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground">
          Submit answer
        </span>
        <span className="inline-flex h-11 items-center rounded-lg bg-muted px-5 text-base font-medium">
          Skip
        </span>
      </div>
    </div>
  )
}

export function FeedbackFragment() {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-white p-6">
        <p className="flex items-center gap-2 text-base font-semibold text-primary">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" aria-hidden="true" />
          </span>
          Correct
        </p>
        <p className="mt-3 text-lg font-semibold tracking-tight">Who wrote the Declaration of Independence?</p>
        <p className="mt-1 text-base text-muted-foreground">You said: Thomas Jefferson</p>
      </div>
      <div className="rounded-2xl bg-white p-6">
        <p className="flex items-center gap-2 text-base font-semibold text-brand-red">
          <span className="flex size-6 items-center justify-center rounded-full bg-brand-red text-white">
            <X className="size-4" aria-hidden="true" />
          </span>
          Not quite
        </p>
        <p className="mt-3 text-lg font-semibold tracking-tight">How many justices are on the Supreme Court?</p>
        <p className="mt-1 text-base text-muted-foreground">You said: Seven</p>
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-base">
          Accepted answer: <strong className="font-semibold">Nine</strong>. We will bring this one back.
        </p>
      </div>
    </div>
  )
}

export function ProgressFragment() {
  const mastered = Object.values(sampleMastered).reduce((a, b) => a + b, 0)
  const total = categories.reduce((a, c) => a + c.total, 0)
  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-lg font-semibold tracking-tight">Your progress</p>
        <p className="text-base text-muted-foreground">
          <strong className="font-semibold text-foreground">{mastered}</strong> of {total} mastered
        </p>
      </div>
      <ul className="mt-6 grid gap-4">
        {categories.map((c) => {
          const done = sampleMastered[c.name]
          return (
            <li key={c.name}>
              <div className="flex justify-between gap-4 text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">
                  {done}/{c.total}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((done / c.total) * 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-5 text-sm text-muted-foreground">Sample progress, for illustration.</p>
    </div>
  )
}

