import { SPECIAL_CONSIDERATION } from '@/quiz/format'

// 65/20 special consideration: 65 or older and a permanent resident for 20 or more years.
// One checkbox, used on sign-up and in settings.
export function SpecialConsiderationToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
        checked ? 'border-primary bg-accent' : 'border-border hover:bg-muted'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 accent-[var(--primary)]"
      />
      <span>
        <span className="block font-semibold">65/20 special consideration</span>
        <span className="block text-sm">
          I am 65 or older and have been a permanent resident for 20 or more years.
        </span>
        <span className="block text-sm text-muted-foreground">
          You study only the 20 starred questions. The real test asks {SPECIAL_CONSIDERATION.questions} of
          them and you need {SPECIAL_CONSIDERATION.passMark} right.
        </span>
      </span>
    </label>
  )
}
