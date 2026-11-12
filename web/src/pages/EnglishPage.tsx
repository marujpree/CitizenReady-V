// English practice: pick reading or writing, answer up to three sentences, see the result.
// The test lives in state, so refreshing the page returns to the picker (same as the civics quiz).
import { useState } from 'react'
import { EnglishPicker } from '@/english/EnglishPicker'
import { EnglishResults } from '@/english/EnglishResults'
import { SentenceView } from '@/english/SentenceView'
import type { EnglishAnswerResponse, EnglishRound, EnglishSentence, EnglishTestType } from '@/english/types'
import { useNextSentence, useStartEnglish } from '@/english/useEnglish'
import { ApiError } from '@/lib/api'

type Phase = 'pick' | 'test' | 'done'

const friendly = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback)

export default function EnglishPage() {
  const [phase, setPhase] = useState<Phase>('pick')
  const [test, setTest] = useState<EnglishTestType>('reading')
  const [attemptId, setAttemptId] = useState('')
  const [max, setMax] = useState(3)
  const [sentence, setSentence] = useState<EnglishSentence | null>(null)
  const [rounds, setRounds] = useState<EnglishRound[]>([])
  const [passed, setPassed] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [nextError, setNextError] = useState<string | null>(null)
  const start = useStartEnglish()
  const nextSentence = useNextSentence()

  async function begin(choice: EnglishTestType) {
    setStartError(null)
    try {
      const attempt = await start.mutateAsync(choice)
      const first = await nextSentence.mutateAsync(attempt.attemptId)
      setTest(choice)
      setAttemptId(attempt.attemptId)
      setMax(attempt.maxSentences)
      setSentence(first)
      setRounds([])
      setPassed(false)
      setNextError(null)
      setPhase('test')
    } catch (e) {
      setStartError(friendly(e, 'Could not start the test. Try again.'))
    }
  }

  function onAnswered(answer: string, result: EnglishAnswerResponse) {
    if (!sentence) return
    setRounds((prev) => [...prev, { sentence, answer, result }])
    if (result.attemptCompleted) setPassed(result.passed === true)
  }

  async function next() {
    const last = rounds[rounds.length - 1]
    if (last?.result.attemptCompleted) {
      setPhase('done')
      return
    }
    setNextError(null)
    try {
      setSentence(await nextSentence.mutateAsync(attemptId))
    } catch (e) {
      setNextError(friendly(e, 'Could not load the next sentence. Try again.'))
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {phase === 'pick' && (
        <EnglishPicker
          onStart={begin}
          starting={start.isPending || nextSentence.isPending ? (start.variables ?? null) : null}
          error={startError}
        />
      )}
      {phase === 'test' && sentence && (
        <SentenceView
          key={sentence.id}
          attemptId={attemptId}
          sentence={sentence}
          number={rounds.length + 1}
          max={max}
          onAnswered={onAnswered}
          onNext={next}
          loadingNext={nextSentence.isPending}
          nextError={nextError}
        />
      )}
      {phase === 'done' && (
        <EnglishResults test={test} passed={passed} rounds={rounds} onAgain={() => setPhase('pick')} />
      )}
    </main>
  )
}
