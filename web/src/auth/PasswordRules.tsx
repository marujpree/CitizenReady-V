import { Check, Circle } from 'lucide-react'
import { passwordRules } from './schemas'

// Live checklist. The icon and the text carry the state, not just the colour.
export function PasswordRules({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} className="flex flex-col gap-1 text-sm">
      {passwordRules.map((rule) => {
        const met = rule.test(value)
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 ${met ? 'text-[#247b50]' : 'text-muted-foreground'}`}
          >
            {met ? <Check className="size-4" /> : <Circle className="size-4" />}
            <span>
              {rule.label}
              <span className="sr-only">{met ? ' (done)' : ' (not yet)'}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
