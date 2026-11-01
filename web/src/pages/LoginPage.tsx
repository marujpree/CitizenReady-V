import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { AuthShell } from '@/auth/AuthShell'
import { useAuth } from '@/auth/auth-context'
import { Field } from '@/auth/Field'
import { GoogleButton, OrDivider } from '@/auth/GoogleButton'
import { loginSchema, type LoginValues } from '@/auth/schemas'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { user } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })

  if (user) return <Navigate to="/" replace />

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) setFormError('Email or password is incorrect')
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Log in to pick up where you left off.</p>
      <div className="mt-6 flex flex-col gap-5">
        <GoogleButton onError={setFormError} />
        <OrDivider />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-4">
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <Button type="submit" className="mt-2 h-11! w-full rounded-lg! text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthShell>
  )
}
