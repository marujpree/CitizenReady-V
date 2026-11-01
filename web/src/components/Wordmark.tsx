export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-sm bg-brand-red text-sm font-semibold text-white"
      >
        CR
      </span>
      <span className="text-lg font-semibold tracking-tight">CitizenReady</span>
    </div>
  )
}
