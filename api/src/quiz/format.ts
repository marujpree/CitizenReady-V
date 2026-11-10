// How many questions each version of the civics test asks, and how many you need right.
// 2008 test: 10 questions, 6 to pass. 2025 test: up to 20 questions, 12 to pass.
// Both are 60%, which is the pass line record_answer already uses.
export const TEST_FORMAT = {
  2008: { questions: 10, passMark: 6 },
  2025: { questions: 20, passMark: 12 },
} as const

// 65/20 special consideration (65 or older, 20+ years a permanent resident): the officer
// asks 10 of the 20 starred questions and the applicant needs 6. Same for both versions.
export const SPECIAL_CONSIDERATION = { questions: 10, passMark: 6 } as const

export type TestVersion = keyof typeof TEST_FORMAT
export type QuizMode = 'category' | 'practice_exam' | 'mock_test'

const PRACTICE_EXAM_COUNT = 20

// The server decides the length of a mock test so it always matches the real
// interview. Other modes may ask for a length; a topic quiz defaults to the whole topic.
export function questionCountFor(
  mode: QuizMode,
  testVersion: number,
  requested: number | undefined,
  poolSize: number,
  special = false,
): number {
  if (mode === 'mock_test') {
    if (special) return SPECIAL_CONSIDERATION.questions
    return (TEST_FORMAT[testVersion as TestVersion] ?? TEST_FORMAT[2025]).questions
  }
  if (mode === 'category') return requested ?? poolSize
  return requested ?? PRACTICE_EXAM_COUNT
}
