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
      const settings = await supabase.from('user_settings').select('test_version').single()
      if (settings.error) throw settings.error
      const testVersion = settings.data.test_version

      const [total, progress, attempts] = await Promise.all([
        supabase
          .from('civics_questions')
          .select('id', { count: 'exact', head: true })
          .eq('test_version', testVersion)
          .eq('is_active', true),
        supabase.from('user_question_progress').select('mastery_score, times_seen'),
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
        totalQuestions: total.count ?? 0,
        masteredCount: progress.data.filter((p) => Number(p.mastery_score) >= MASTERED_AT).length,
        seenCount: progress.data.filter((p) => p.times_seen > 0).length,
        recentAttempts: attempts.data,
      }
    },
  })
}
