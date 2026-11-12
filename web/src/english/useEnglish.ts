// API hooks for the English reading and writing tests. The server owns the test: it picks the
// sentences, grades each answer and decides when the test is over.
import { useMutation } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import type { EnglishAnswerResponse, EnglishSentence, EnglishStart, EnglishTestType } from './types'

export function useStartEnglish() {
  return useMutation({
    mutationFn: (test: EnglishTestType) => apiPost<EnglishStart>('/english/start', { test }),
  })
}

// A mutation (not a query) because every call must return a NEW sentence.
export function useNextSentence() {
  return useMutation({
    mutationFn: (attemptId: string) =>
      apiGet<EnglishSentence>(`/english/sentence?attemptId=${encodeURIComponent(attemptId)}`),
  })
}

export function useSubmitEnglishAnswer() {
  return useMutation({
    mutationFn: (input: { attemptId: string; sentenceId: string; answer: string }) =>
      apiPost<EnglishAnswerResponse>('/english/answer', input),
  })
}
