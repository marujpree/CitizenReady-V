import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Check, X } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'

// Real questions and answers from the 2025 civics test (USCIS M-1778).
const sampleQuestions = [
  {
    number: 2,
    category: 'Principles of American Government',
    question: 'What is the supreme law of the land?',
    answer: 'The U.S. Constitution',
  },
  {
    number: 3,
    category: 'Principles of American Government',
    question: 'Name one thing the U.S. Constitution does.',
    answer: 'Forms the government, or protects the rights of the people',
  },
  {
    number: 1,
    category: 'Principles of American Government',
    question: 'What is the form of government of the United States?',
    answer: 'A republic, or a representative democracy',
  },
]

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

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        seen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function TryOneCard() {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const q = sampleQuestions[index]

  function next() {
    setRevealed(false)
    setIndex((i) => (i + 1) % sampleQuestions.length)
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-foreground sm:p-8">
      <p className="text-sm font-medium text-muted-foreground">
        Try one · Question {q.number} of 128
      </p>
      <p className="mt-1 text-sm font-medium text-brand-red">{q.category}</p>
      <p aria-live="polite" className="mt-5 min-h-[4.5rem] text-2xl leading-tight font-semibold tracking-tight">
        {q.question}
      </p>

      <div
        aria-live="polite"
        className={`mt-5 rounded-xl px-4 py-3 text-base ${
          revealed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {revealed ? (
          <>
            <span className="block text-sm text-primary-foreground/75">Accepted answer</span>
            {q.answer}
          </>
        ) : (
          'Say your answer out loud, then check it.'
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button
          type="button"
          aria-expanded={revealed}
          onClick={() => setRevealed((r) => !r)}
          className="h-11! rounded-lg! px-5 text-base transition-transform active:scale-[0.98]"
        >
          {revealed ? 'Hide answer' : 'Check answer'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={next}
          className="h-11! rounded-lg! px-4 text-base"
        >
          Another question
        </Button>
      </div>
    </div>
  )
}

function QuizFragment() {
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

function FeedbackFragment() {
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

function ProgressFragment() {
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

const steps = [
  {
    title: 'Answer like it is the real interview',
    text: 'The officer asks up to 10 questions out loud and you answer in your own words. We ask them the same way: pick a topic, take a 10-question practice exam, or run a full mock test.',
    fragment: <QuizFragment />,
  },
  {
    title: 'See the right answer right away',
    text: 'Every answer is checked against the official USCIS wording, and you see what was accepted. Questions you miss come back until they stick.',
    fragment: <FeedbackFragment />,
  },
  {
    title: 'Know when you are ready',
    text: 'Progress is tracked for each question and each topic, so you can see what you have mastered and what still needs work before your interview.',
    fragment: <ProgressFragment />,
  },
]

export default function LandingPage() {
  const { user, loading } = useAuth()

  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-dvh bg-white">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Wordmark className="text-white" />
          <nav aria-label="Account" className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="h-10! rounded-lg! px-4 text-base text-white hover:bg-white/10! hover:text-white!"
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="h-10! rounded-lg! bg-white px-4 text-base text-primary hover:bg-white/90!"
            >
              <Link to="/signup">Sign up free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: the real photograph fills the field, a real question sits on top of it. */}
        <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
          <img
            src="/images/statue-of-liberty.jpg"
            alt="The Statue of Liberty seen from below against a blue sky"
            width={1400}
            height={2112}
            className="absolute inset-0 -z-20 size-full object-cover object-[50%_8%] opacity-30 lg:left-[38%] lg:w-[62%] lg:opacity-100 lg:[mask-image:linear-gradient(to_right,transparent,black_35%)]"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-36 pb-20 sm:pt-44 sm:pb-28 lg:grid-cols-12 lg:gap-8">
            <div className="min-w-0 lg:col-span-7">
              <p className="text-base font-medium text-white/80 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
                Free practice for the 2025 naturalization test
              </p>
              <h1 className="mt-5 text-[2.75rem] leading-[0.98] font-semibold tracking-[-0.035em] sm:text-7xl lg:text-[5.25rem] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-100 motion-safe:duration-700">
                Walk into your interview <span className="text-white/60">ready.</span>
              </h1>
              <p className="mt-6 max-w-xl text-xl text-white/90 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-200 motion-safe:duration-700">
                Practice all 128 civics questions out loud, get instant feedback in the official USCIS
                wording, and watch your progress build.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-300 motion-safe:duration-700">
                <Button
                  asChild
                  className="h-12! rounded-lg! bg-brand-red px-6 text-base text-white transition-transform hover:bg-brand-red/90! active:scale-[0.98]"
                >
                  <Link to="/signup">
                    Start practicing for free
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12! rounded-lg! border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10! hover:text-white!"
                >
                  <Link to="/login">Log in</Link>
                </Button>
              </div>
            </div>
            <div className="flex min-w-0 lg:col-span-5 lg:justify-end motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 motion-safe:delay-500 motion-safe:duration-700">
              <TryOneCard />
            </div>
          </div>
        </section>

        {/* Facts band */}
        <section>
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3 sm:py-24">
            {[
              ['128', 'questions on the 2025 civics test, from USCIS'],
              ['10', 'asked at the interview, and 6 right answers pass'],
              ['Free', 'to practice, with no credit card'],
            ].map(([figure, label]) => (
              <Reveal key={figure}>
                <p className="text-6xl font-semibold tracking-[-0.04em] text-primary sm:text-7xl">
                  {figure}
                </p>
                <p className="mt-3 max-w-xs text-lg text-foreground">{label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works, each step shown as a piece of the real app. */}
        <section className="bg-muted">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <Reveal>
              <h2 className="max-w-2xl text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-5xl">
                Practice a little each day.
              </h2>
            </Reveal>
            <ol className="mt-16 grid gap-20 sm:gap-28">
              {steps.map((step, i) => (
                <li key={step.title} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-16">
                  <Reveal className={`lg:col-span-5 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <h3 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-lg text-foreground">{step.text}</p>
                  </Reveal>
                  <Reveal className={`lg:col-span-7 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    {step.fragment}
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing call to action over the photograph again, cropped to the torch. */}
        <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
          <img
            src="/images/statue-of-liberty.jpg"
            alt=""
            width={1400}
            height={2112}
            className="absolute inset-0 -z-20 size-full object-cover object-[50%_0%] opacity-40"
          />
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-24 sm:py-32 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <h2 className="max-w-2xl text-4xl leading-[1.02] font-semibold tracking-[-0.035em] sm:text-6xl">
                Start practicing today.
              </h2>
              <p className="mt-5 max-w-xl text-xl text-white/85">
                Make a free account and take your first practice quiz in under a minute.
              </p>
            </Reveal>
            <Button
              asChild
              className="h-14! shrink-0 rounded-lg! bg-brand-red px-8 text-lg text-white transition-transform hover:bg-brand-red/90! active:scale-[0.98]"
            >
              <Link to="/signup">
                Create your account
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark />
        <p className="text-sm text-muted-foreground sm:max-w-xl sm:text-right">
          CitizenReady is an independent study tool and is not affiliated with USCIS. Photo: Daniel
          Schwen, public domain, via Wikimedia Commons.
        </p>
      </footer>
    </div>
  )
}
