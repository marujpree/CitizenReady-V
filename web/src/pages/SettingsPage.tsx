import { SpecialConsiderationToggle } from '@/auth/SpecialConsiderationToggle'
import { TestVersionPicker } from '@/auth/TestVersionPicker'
import { useTestSettings, useUpdateSettings } from '@/quiz/useQuiz'

// Account settings: which civics test you are preparing for, and 65/20 special consideration.
export default function SettingsPage() {
  const { data: settings, isPending, isError } = useTestSettings()
  const update = useUpdateSettings()

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
        {settings && (
          <div className="mt-6 flex flex-col gap-6">
            <TestVersionPicker
              value={settings.testVersion}
              disabled={update.isPending}
              onChange={(testVersion) => update.mutate({ testVersion })}
            />
            <SpecialConsiderationToggle
              checked={settings.special}
              disabled={update.isPending}
              onChange={(special) => update.mutate({ special })}
            />
            {update.isError && (
              <p role="alert" className="text-sm text-destructive">
                We could not save that. Try again.
              </p>
            )}
            {update.isSuccess && !update.isPending && (
              <p role="status" className="text-sm text-muted-foreground">
                Saved.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
