import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/auth-context'
import { apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { AnswerResponse, QuizMode, StartResponse } from './types'

// Topics and how many active questions each has, for the picker.
export function useCategories() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['categories', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const settings = await supabase.from('user_settings').select('test_version').single()
      if (settings.error) throw settings.error
      const { data, error } = await supabase
        .from('civics_questions')
        .select('category')
        .eq('test_version', settings.data.test_version)
        .eq('is_active', true)
      if (error) throw error
      const counts = new Map<string, number>()
      for (const row of data) counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
      return [...counts].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
    },
  })
}

export function useStartQuiz() {
  return useMutation({
    mutationFn: (input: { mode: QuizMode; category?: string; count?: number }) =>
      apiPost<StartResponse>('/quiz/start', input),
  })
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: (input: {
      attemptId: string
      questionId: string
      answer: string
      inputMode: 'typed' | 'spoken'
      responseTimeMs: number
    }) => apiPost<AnswerResponse>('/quiz/answer', input),
  })
}

// Refresh the dashboard numbers after a quiz.
export function useRefreshDashboard() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ['dashboard'] })
}
