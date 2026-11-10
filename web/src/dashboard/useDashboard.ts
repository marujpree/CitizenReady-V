import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/auth-context'
import { supabase } from '@/lib/supabase'

// A question counts as mastered at this score (mastery_score runs 0 to 1).
export const MASTERED_AT = 0.8

export function useDashboard() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dashboard', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const settings = await supabase
        .from('user_settings')
        .select('test_version, special_consideration')
        .single()
      if (settings.error) throw settings.error
      const testVersion = settings.data.test_version
      const special = settings.data.special_consideration

      // Count only the questions in the user's test, so switching tests (or turning on
      // 65/20) never shows more mastered than there are questions.
      let totalQuery = supabase
        .from('civics_questions')
        .select('id', { count: 'exact', head: true })
        .eq('test_version', testVersion)
        .eq('is_active', true)
      let progressQuery = supabase
        .from('user_question_progress')
        .select('mastery_score, times_seen, civics_questions!inner(test_version, is_65_20)')
        .eq('civics_questions.test_version', testVersion)
      if (special) {
        totalQuery = totalQuery.eq('is_65_20', true)
        progressQuery = progressQuery.eq('civics_questions.is_65_20', true)
      }

      const [total, progress, attempts] = await Promise.all([
        totalQuery,
        progressQuery,
        supabase
          .from('practice_attempts')
          .select('id, mode, started_at, score_percent, passed')
          .not('completed_at', 'is', null)
          .order('started_at', { ascending: false })
          .limit(5),
      ])
      if (total.error) throw total.error
      if (progress.error) throw progress.error
      if (attempts.error) throw attempts.error

      return {
        testVersion,
        special,
        totalQuestions: total.count ?? 0,
        masteredCount: progress.data.filter((p) => Number(p.mastery_score) >= MASTERED_AT).length,
        seenCount: progress.data.filter((p) => p.times_seen > 0).length,
        recentAttempts: attempts.data,
      }
    },
  })
}
