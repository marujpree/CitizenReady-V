import { TEST_FORMAT, type TestVersion } from '@/quiz/format'

// Which naturalization test the user will take depends on when their N-400 was filed.
const options: { version: TestVersion; title: string; when: string; detail: string }[] = [
  {
    version: 2025,
    title: '2025 test',
    when: 'I filed my N-400 on or after October 20, 2025',
    detail: '128 questions in the bank',
  },
  {
    version: 2008,
    title: '2008 test',
    when: 'I filed my N-400 before October 20, 2025',
    detail: '100 questions in the bank',
  },
]

// Two radio cards. Used on sign-up and in settings.
export function TestVersionPicker({
  value,
  onChange,
  disabled,
}: {
  value: TestVersion
  onChange: (version: TestVersion) => void
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Which test are you preparing for?</legend>
      {options.map((o) => {
        const selected = value === o.version
        const format = TEST_FORMAT[o.version]
        return (
          <label
            key={o.version}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              selected ? 'border-primary bg-accent' : 'border-border hover:bg-muted'
            }`}
          >
            <input
              type="radio"
              name="testVersion"
              value={o.version}
              checked={selected}
              onChange={() => onChange(o.version)}
              className="mt-1 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-semibold">{o.title}</span>
              <span className="block text-sm">{o.when}</span>
              <span className="block text-sm text-muted-foreground">
                {o.detail}. {format.questions} asked at the interview, {format.passMark} right to pass.
              </span>
            </span>
          </label>
        )
      })}
      <p className="text-sm text-muted-foreground">
        Not sure? Check the date on your USCIS receipt notice. You can change this later in Settings.
      </p>
    </fieldset>
  )
}
