import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Wordmark } from '@/components/Wordmark'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
    isActive
      ? 'border border-border bg-white text-brand-red'
      : 'border border-transparent text-muted-foreground hover:text-foreground'
  }`

// Switches between the two auth routes.
function AuthTabs() {
  return (
    <nav aria-label="Account" className="flex gap-1 rounded-xl bg-accent p-1">
      <NavLink to="/login" className={tabClass}>
        Log in
      </NavLink>
      <NavLink to="/signup" className={tabClass}>
        Create account
      </NavLink>
    </nav>
  )
}

// Content is top-aligned, so the wordmark and tabs stay put when you switch pages.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-muted px-4 pt-10 pb-12 sm:pt-16">
      <div className="mb-8 flex w-full max-w-md items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>
        <Wordmark className="text-foreground" />
      </div>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <AuthTabs />
        <div className="mt-8">{children}</div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Just looking?{' '}
        <Link to="/preview" className="font-semibold text-foreground underline underline-offset-4">
          Continue as guest
        </Link>
      </p>
    </main>
  )
}
