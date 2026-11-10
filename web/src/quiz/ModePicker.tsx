import { useState } from 'react'
import { ListChecks, Mic, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVoiceSupport, voiceTip } from '@/lib/voiceSupport'
import type { QuizMode } from './types'
import { SPECIAL_CONSIDERATION, TEST_FORMAT } from './format'
import { useCategories, useTestSettings } from './useQuiz'
import { useSpeechStatus } from './useSpeech'

type Choice = { mode: QuizMode; category?: string; count?: number }

const modes = [
  {
    mode: 'mock_test' as const,
    icon: Mic,
    title: 'Mock interview',
  },
  {
    mode: 'practice_exam' as const,
    count: 20,
    icon: Timer,
    title: 'Practice exam',
  },
]

export function ModePicker({
  onStart,
  starting,
  error,
}: {
  onStart: (choice: Choice) => void
  starting: boolean
  error: string | null
}) {
  const { data: categories, isPending, isError } = useCategories()
  const [category, setCategory] = useState<string | null>(null)
  const { data: settings } = useTestSettings()
  const special = settings?.special ?? false
  const format = special ? SPECIAL_CONSIDERATION : TEST_FORMAT[settings?.testVersion ?? 2025]
  // The mock interview matches the real test for the user's version and special consideration.
  const modeText = {
    mock_test: special
      ? `${format.questions} of your 20 starred questions, like the real 65/20 test. Get ${format.passMark} right to pass.`
      : `${format.questions} random questions, like the real civics test. Get ${format.passMark} right to pass.`,
    practice_exam: special
      ? 'All 20 starred questions, in a random order.'
      : '20 random questions for a longer workout.',
  }
  const { data: speechStatus } = useSpeechStatus()
  const tip = voiceTip(getVoiceSupport(), speechStatus?.transcription === true)

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Choose how to practice</h1>
      <p className="mt-2 text-muted-foreground">
        Type your answers or tap the microphone and say them out loud.
      </p>

      {tip && (
        <p role="note" className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-muted-foreground">
          {tip}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {modes.map((m) => (
          <section key={m.mode} className="flex flex-col rounded-3xl bg-white p-8">
            <m.icon className="size-7 text-brand-red" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold tracking-tight">{m.title}</h2>
            <p className="mt-2 flex-1 text-muted-foreground">{modeText[m.mode]}</p>
            <Button
              disabled={starting}
              onClick={() => onStart({ mode: m.mode, count: 'count' in m ? m.count : undefined })}
              className="mt-6 h-11! rounded-lg! px-6 text-base"
            >
              {starting ? 'Starting…' : 'Start'}
            </Button>
          </section>
        ))}
      </div>

      <section className="mt-4 rounded-3xl bg-white p-8">
        <ListChecks className="size-7 text-brand-red" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Practice by topic</h2>
        <p className="mt-2 text-muted-foreground">Work through every question in one topic.</p>

        {isPending && <p className="mt-6 text-muted-foreground">Loading topics…</p>}
        {isError && (
          <p role="alert" className="mt-6 text-destructive">
            We could not load the topics. Refresh the page to try again.
          </p>
        )}

        {categories && (
          <>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Topics">
              {categories.map((c) => {
                const selected = category === c.name
                return (
                  <li key={c.name}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCategory(c.name)}
                      className={`flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className={selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                        {c.total}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <Button
              disabled={!category || starting}
              onClick={() => category && onStart({ mode: 'category', category })}
              className="mt-6 h-11! rounded-lg! px-6 text-base"
            >
              {starting ? 'Starting…' : category ? `Start ${category}` : 'Pick a topic first'}
            </Button>
          </>
        )}
      </section>
    </div>
  )
}
