import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-accent text-brand-red' : 'text-muted-foreground hover:text-foreground'
  }`

// Top bar for every signed-in page. Add new pages to the nav below.
export function AppShell() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const name = profile?.full_name || user?.email

  return (
    <div className="min-h-dvh bg-muted">
      <header className="bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" aria-label="CitizenReady home">
              <Wordmark />
            </Link>
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/practice" className={navClass}>
                Practice
              </NavLink>
              <NavLink to="/resources" className={navClass}>
                Resources
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                Settings
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:inline">
              {name}
            </span>
            <Button
              variant="outline"
              className="h-9! rounded-lg!"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
