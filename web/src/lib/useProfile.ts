import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth/auth-context'
import { supabase } from '@/lib/supabase'

// The signed-in user's profile row (RLS only lets them read their own).
export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .single()
      if (error) throw error
      return data
    },
  })
}
