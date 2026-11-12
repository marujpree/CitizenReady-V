// First screen of the English practice: choose the reading test or the writing test.
import { BookOpen, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVoiceSupport, voiceTip } from '@/lib/voiceSupport'
import { useSpeechStatus } from '@/quiz/useSpeech'
import type { EnglishTestType } from './types'

const tests = [
  {
    test: 'reading' as const,
    icon: BookOpen,
    title: 'Reading test',
    text: 'Read a sentence out loud. You pass by reading one of up to three sentences correctly.',
  },
  {
    test: 'writing' as const,
    icon: PenLine,
    title: 'Writing test',
    text: 'Listen to a sentence and write it. You pass by writing one of up to three sentences correctly.',
  },
]

export function EnglishPicker({
  onStart,
  starting,
  error,
}: {
  onStart: (test: EnglishTestType) => void
  starting: EnglishTestType | null
  error: string | null
}) {
  const { data: speechStatus } = useSpeechStatus()
  const tip = voiceTip(getVoiceSupport(), speechStatus?.transcription === true)

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">English practice</h1>
      <p className="mt-2 text-muted-foreground">
        The naturalization interview has a short reading test and a short writing test.
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
        {tests.map((t) => (
          <section key={t.test} className="flex flex-col rounded-3xl bg-white p-8">
            <t.icon className="size-7 text-brand-red" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold tracking-tight">{t.title}</h2>
            <p className="mt-2 flex-1 text-muted-foreground">{t.text}</p>
            <Button
              disabled={starting !== null}
              onClick={() => onStart(t.test)}
              className="mt-6 h-11! rounded-lg! px-6 text-base"
            >
              {starting === t.test ? 'Starting…' : 'Start'}
            </Button>
          </section>
        ))}
      </div>
    </div>
  )
}
