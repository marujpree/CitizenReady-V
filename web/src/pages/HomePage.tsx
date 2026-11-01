import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/auth-context'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">CitizenReady</h1>
      <p className="mt-2">Signed in as {user?.email}</p>
      <Button className="mt-4" onClick={() => supabase.auth.signOut()}>
        Sign out
      </Button>
    </main>
  )
}
