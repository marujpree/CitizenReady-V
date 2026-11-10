import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/auth-context'
import { apiPost } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { TestVersion } from './format'
import type { AnswerResponse, QuizMode, StartResponse } from './types'

// The user's test settings: which test (2008 or 2025) and whether 65/20 special consideration is on.
export type TestSettings = { testVersion: TestVersion; special: boolean }

export function useTestSettings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['test-settings', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TestSettings> => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('test_version, special_consideration')
        .single()
      if (error) throw error
      return { testVersion: data.test_version as TestVersion, special: data.special_consideration }
    },
  })
}

// Saves a change to the settings. Questions, topics and dashboard numbers all depend on them.
export function useUpdateSettings() {
  const client = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (changes: Partial<TestSettings>) => {
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...(changes.testVersion !== undefined && { test_version: changes.testVersion }),
          ...(changes.special !== undefined && { special_consideration: changes.special }),
        })
        .eq('user_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['test-settings'] })
      void client.invalidateQueries({ queryKey: ['categories'] })
      void client.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Topics and how many active questions each has, for the picker.
export function useCategories() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['categories', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const settings = await supabase
        .from('user_settings')
        .select('test_version, special_consideration')
        .single()
      if (settings.error) throw settings.error
      let query = supabase
        .from('civics_questions')
        .select('category')
        .eq('test_version', settings.data.test_version)
        .eq('is_active', true)
      // 65/20: only the starred questions.
      if (settings.data.special_consideration) query = query.eq('is_65_20', true)
      const { data, error } = await query
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
