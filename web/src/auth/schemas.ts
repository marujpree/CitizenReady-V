import { z } from 'zod'

// Letters from any language, then letters, spaces, apostrophes, periods and hyphens.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u

// 72 is the most characters Supabase's password hashing (bcrypt) reads.
export const PASSWORD_MAX = 72

// Each rule is shown as a live checklist on sign-up and enforced by the schema.
export const passwordRules = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'letter', label: 'A letter', test: (v: string) => /\p{L}/u.test(v) },
  { id: 'number', label: 'A number', test: (v: string) => /\d/.test(v) },
] as const

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .max(254, 'Email is too long')
  .pipe(z.email('Enter a valid email address'))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
})

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your name')
      .max(80, 'Use 80 characters or fewer')
      .regex(NAME_PATTERN, 'Use letters, spaces, hyphens, apostrophes or periods'),
    email,
    password: z
      .string()
      .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer`)
      .refine((v) => passwordRules.every((rule) => rule.test(v)), 'Password is too weak'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
