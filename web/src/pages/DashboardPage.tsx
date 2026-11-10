import { Check, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '@/dashboard/useDashboard'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/lib/useProfile'

const MODE_LABELS: Record<string, string> = {
  category: 'By topic',
  practice_exam: 'Practice exam',
  review: 'Review',
  passed: 'Passed questions',
  mock_test: 'Mock test',
}

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: profile } = useProfile()
  const { data, isPending, isError } = useDashboard()
  const firstName = profile?.full_name?.trim().split(/\s+/)[0]

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {data ? `Your ${data.testVersion} civics test prep at a glance.` : 'Your civics test prep at a glance.'}
      </p>

      {isError && (
        <p role="alert" className="mt-8 text-destructive">
          We could not load your progress. Refresh the page to try again.
        </p>
      )}

      {isPending && <p className="mt-8 text-muted-foreground">Loading your progress…</p>}

      {data && (
        <>
          <section
            aria-label="Your progress"
            className="mt-8 grid gap-8 rounded-3xl bg-white p-8 sm:grid-cols-3"
          >
            <Stat
              value={`${data.masteredCount} of ${data.totalQuestions}`}
              label="questions mastered"
            />
            <Stat value={String(data.seenCount)} label="questions practiced" />
            <Stat
              value={
                data.totalQuestions > 0
                  ? `${Math.round((data.masteredCount / data.totalQuestions) * 100)}%`
                  : '0%'
              }
              label="ready for the test"
            />
          </section>

          <section className="mt-6 flex flex-col gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Ready for a practice round?</h2>
              <p className="mt-2 text-primary-foreground/85">
                Take a mock interview, a practice exam, or work through one topic.
              </p>
            </div>
            <Button asChild className="h-11! rounded-lg! bg-white! px-6 text-base text-primary!">
              <Link to="/practice">Start practicing</Link>
            </Button>
          </section>

          <section className="mt-6 rounded-3xl bg-white p-8">
            <h2 className="text-xl font-semibold tracking-tight">Recent practice</h2>
            {data.recentAttempts.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                No practice yet. Your first quiz will show up here.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {data.recentAttempts.map((attempt) => (
                  <li key={attempt.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{MODE_LABELS[attempt.mode] ?? attempt.mode}</p>
                      <p className="text-sm text-muted-foreground">
                        {dateFormat.format(new Date(attempt.started_at))}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">
                        {attempt.score_percent === null ? '–' : `${Math.round(Number(attempt.score_percent))}%`}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-sm font-medium ${
                          attempt.passed ? 'text-[#247b50]' : 'text-muted-foreground'
                        }`}
                      >
                        {attempt.passed ? <Check className="size-4" /> : <Circle className="size-4" />}
                        {attempt.passed ? 'Passed' : 'Not yet'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
