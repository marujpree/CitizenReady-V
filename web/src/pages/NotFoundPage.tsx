import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/Wordmark'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-muted px-4 pt-16">
      <Wordmark className="mb-10" />
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">That page does not exist or has moved.</p>
      <Link to="/" className="mt-6 text-sm font-medium underline underline-offset-4">
        Back to the home page
      </Link>
    </main>
  )
}
