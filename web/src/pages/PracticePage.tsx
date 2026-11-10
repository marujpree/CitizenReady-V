import { useState } from 'react'
import { ApiError } from '@/lib/api'
import { ModePicker } from '@/quiz/ModePicker'
import { QuestionView } from '@/quiz/QuestionView'
import { Results } from '@/quiz/Results'
import type { AnswerResponse, AnsweredQuestion, StartResponse } from '@/quiz/types'
import { useRefreshDashboard, useStartQuiz } from '@/quiz/useQuiz'

type Phase = 'pick' | 'quiz' | 'results'

// One page, three phases: pick a mode, answer questions, see results.
// The quiz lives in state, so refreshing the page returns to the picker.
export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>('pick')
  const [quiz, setQuiz] = useState<StartResponse | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([])
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const start = useStartQuiz()
  const refreshDashboard = useRefreshDashboard()

  async function begin(choice: Parameters<typeof start.mutateAsync>[0]) {
    setStartError(null)
    try {
      const res = await start.mutateAsync(choice)
      setQuiz(res)
      setIndex(0)
      setAnswers([])
      setFinalScore(null)
      setPhase('quiz')
    } catch (e) {
      setStartError(e instanceof ApiError ? e.message : 'Could not start the quiz. Try again.')
    }
  }

  function onAnswered(typed: string, result: AnswerResponse) {
    if (!quiz) return
    setAnswers((prev) => [...prev, { question: quiz.questions[index], typed, result }])
    if (result.attemptCompleted) {
      setFinalScore(result.scorePercent === null ? null : Number(result.scorePercent))
      void refreshDashboard()
    }
  }

  function next() {
    if (!quiz) return
    if (index + 1 >= quiz.questions.length) setPhase('results')
    else setIndex(index + 1)
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {phase === 'pick' && <ModePicker onStart={begin} starting={start.isPending} error={startError} />}
      {phase === 'quiz' && quiz && (
        <QuestionView
          key={quiz.questions[index].id}
          attemptId={quiz.attemptId}
          question={quiz.questions[index]}
          index={index}
          total={quiz.questions.length}
          onAnswered={onAnswered}
          onNext={next}
        />
      )}
      {phase === 'results' && (
        <Results answers={answers} scorePercent={finalScore} onAgain={() => setPhase('pick')} />
      )}
    </main>
  )
}
