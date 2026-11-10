import { z } from 'zod'

// Letters from any language, then letters, spaces, apostrophes, periods and hyphens.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u

// One name field (first or last): required, trimmed, letters and common punctuation.
const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}`)
    .max(40, 'Use 40 characters or fewer')
    .regex(NAME_PATTERN, 'Use letters, spaces, hyphens, apostrophes or periods')

// 72 is the most characters Supabase's password hashing (bcrypt) reads.
export const PASSWORD_MAX = 72

// Each rule is shown as a live checklist on sign-up and enforced by the schema.
// Keep in step with [auth] in supabase/config.toml, which enforces the same rules on the server.
export const passwordRules = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'lower', label: 'A lowercase letter', test: (v: string) => /\p{Ll}/u.test(v) },
  { id: 'upper', label: 'An uppercase letter', test: (v: string) => /\p{Lu}/u.test(v) },
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
    firstName: nameField('first name'),
    lastName: nameField('last name'),
    email,
    password: z
      .string()
      .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer`)
      .refine((v) => passwordRules.every((rule) => rule.test(v)), 'Password is too weak'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    // 2025 test: filed on or after Oct 20, 2025. 2008 test: filed before.
    testVersion: z.union([z.literal(2025), z.literal(2008)]),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
