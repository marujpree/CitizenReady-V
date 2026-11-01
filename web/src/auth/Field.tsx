import { useState, type ComponentProps, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

type FieldProps = ComponentProps<'input'> & {
  label: string
  error?: string
  hint?: string
  // Extra content under the input, e.g. a live checklist. Pass its element id as rulesId.
  rules?: ReactNode
  rulesId?: string
}

// Label above the field. Hint and error are tied to the input for screen readers.
// Password fields get a show/hide button.
export function Field({ label, error, hint, rules, rulesId, id, type, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && visible ? 'text' : type}
          className={`h-11! rounded-lg! bg-muted! px-3 text-base ${isPassword ? 'pr-11' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, rulesId, errorId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:text-foreground"
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {rules}
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
