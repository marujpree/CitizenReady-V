// Shapes of the /english API responses (see api/src/routes/english.ts).
export type EnglishTestType = 'reading' | 'writing'

export type EnglishStart = { attemptId: string; maxSentences: number }

export type EnglishSentence = { id: string; test: EnglishTestType; text: string }

export type EnglishAnswerResponse = {
  isCorrect: boolean
  missing: string[] // content words that were left out or replaced
  heard: string // what the server compared, cleaned up
  note?: string
  attemptCompleted: boolean
  passed: boolean | null // null until the test is over
  sentencesTried: number
  maxSentences: number
}

// One sentence the applicant has finished, kept for the final review.
export type EnglishRound = {
  sentence: EnglishSentence
  answer: string
  result: EnglishAnswerResponse
}
