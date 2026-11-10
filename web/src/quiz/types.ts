export type QuizMode = 'category' | 'practice_exam' | 'mock_test'

export type QuizQuestion = {
  id: string
  question_number: number
  question_text: string
  required_count: number
  category: string
  is_65_20: boolean
}

export type StartResponse = {
  attemptId: string
  questionCount: number
  questions: QuizQuestion[]
}

export type AnswerResponse = {
  isCorrect: boolean
  requiredCount: number
  acceptedAnswers: string[]
  attemptCompleted: boolean
  scorePercent: number | null
  passed: boolean | null
}

export type AnsweredQuestion = {
  question: QuizQuestion
  typed: string
  result: AnswerResponse
}
