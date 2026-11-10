import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { AuthShell } from '@/auth/AuthShell'
import { useAuth } from '@/auth/auth-context'
import { Field } from '@/auth/Field'
import { GoogleButton, OrDivider } from '@/auth/GoogleButton'
import { PasswordRules } from '@/auth/PasswordRules'
import { signupSchema, type SignupValues } from '@/auth/schemas'
import { TestVersionPicker } from '@/auth/TestVersionPicker'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const { user } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    trigger,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { testVersion: 2025 },
    // Checks a field when you leave it, then on every keystroke after that.
    mode: 'onTouched',
  })

  const password = useWatch({ control, name: 'password' }) ?? ''

  // The match check depends on the password, so re-run it when the password changes.
  const passwordField = register('password', {
    onChange: () => {
      if (getFieldState('confirmPassword').isTouched) void trigger('confirmPassword')
    },
  })

  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit(values: SignupValues) {
    setFormError(null)
    // handle_new_user (migrations 003 and 012) copies full_name into profiles
    // and test_version into user_settings.
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: `${values.firstName} ${values.lastName}`, test_version: values.testVersion },
      },
    })
    if (error) {
      setFormError(error.message)
      return
    }
    // With email confirmation on, there is no session until the link is clicked.
    if (!data.session) setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <AuthShell>
        <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-4 text-base">
          We sent a confirmation link. Open it to finish creating your account, then log in.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
        >
          Back to log in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-muted-foreground">Start practicing for free today.</p>
      <div className="mt-6 flex flex-col gap-5">
        <GoogleButton onError={setFormError} />
        <OrDivider />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="firstName"
            label="First name"
            type="text"
            autoComplete="given-name"
            maxLength={40}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Field
            id="lastName"
            label="Last name"
            type="text"
            autoComplete="family-name"
            maxLength={40}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
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
          autoComplete="new-password"
          maxLength={72}
          rulesId="password-rules"
          rules={<PasswordRules id="password-rules" value={password} />}
          error={errors.password?.message}
          {...passwordField}
        />
        <Field
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          maxLength={72}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Controller
          control={control}
          name="testVersion"
          render={({ field }) => (
            <TestVersionPicker value={field.value} onChange={field.onChange} />
          )}
        />
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <Button type="submit" className="mt-2 h-11! w-full rounded-lg! text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
