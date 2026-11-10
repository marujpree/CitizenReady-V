// How long the real interview is for each test version. Mirrors api/src/quiz/format.ts,
// where the server decides the real length. This copy only builds the on-screen text.
export const TEST_FORMAT = {
  2008: { questions: 10, passMark: 6 },
  2025: { questions: 20, passMark: 12 },
} as const

export type TestVersion = keyof typeof TEST_FORMAT
