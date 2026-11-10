import { TestVersionPicker } from '@/auth/TestVersionPicker'
import { useTestVersion, useUpdateTestVersion } from '@/quiz/useQuiz'

// Account settings. For now: which version of the civics test you are preparing for.
export default function SettingsPage() {
  const { data: testVersion, isPending, isError } = useTestVersion()
  const update = useUpdateTestVersion()

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <section className="mt-8 rounded-3xl bg-white p-6 sm:p-10">
        <h2 className="text-xl font-semibold tracking-tight">Your test</h2>
        <p className="mt-2 text-muted-foreground">
          This sets which questions you practice and how long your mock interview is.
        </p>

        {isPending && <p className="mt-6 text-muted-foreground">Loading…</p>}
        {isError && (
          <p role="alert" className="mt-6 text-destructive">
            We could not load your settings. Refresh the page to try again.
          </p>
        )}
        {testVersion && (
          <div className="mt-6">
            <TestVersionPicker
              value={testVersion}
              disabled={update.isPending}
              onChange={(version) => update.mutate(version)}
            />
            {update.isError && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                We could not save that. Try again.
              </p>
            )}
            {update.isSuccess && !update.isPending && (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                Saved.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
