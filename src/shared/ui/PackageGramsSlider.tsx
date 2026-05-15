import tw from 'twin.macro'

type PackageGramsSliderProps = {
  value: number
  onChange: (value: number) => void
  label: string
  hint?: string
  disabled?: boolean
}

const MIN_GRAMS = 50
const MAX_GRAMS = 500
const STEP_GRAMS = 50
const OPTIONS = Array.from({ length: 10 }, (_, index) => MIN_GRAMS + index * STEP_GRAMS)

const clampPackageGrams = (value: number) => {
  const numeric = Number.isFinite(value) ? value : 100
  const clamped = Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, numeric))
  return Math.round(clamped / STEP_GRAMS) * STEP_GRAMS
}

export const PackageGramsSlider = ({ value, onChange, label, hint, disabled }: PackageGramsSliderProps) => {
  const normalized = clampPackageGrams(value)

  return (
    <fieldset tw="grid gap-2" disabled={disabled}>
      <div tw="flex items-baseline justify-between gap-3">
        <div tw="min-w-0">
          <legend tw="text-[10px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wide">
            {label}
          </legend>
        </div>
        <p tw="shrink-0 text-[13px] font-black tabular-nums text-[rgb(var(--color-text))]">
          {normalized}
          <span tw="ml-1 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]">g</span>
        </p>
      </div>

      {hint && <p tw="text-[11px] font-medium leading-relaxed text-[rgb(var(--color-text-subtle))]">{hint}</p>}

      <div tw="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {OPTIONS.map((option) => {
          const active = option === normalized

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              disabled={disabled}
              aria-pressed={active}
              css={[
                tw`min-h-[44px] rounded-lg border px-3 py-2 text-center text-[13px] font-black tabular-nums transition-all disabled:cursor-not-allowed disabled:opacity-50`,
                active
                  ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent-soft))] text-[rgb(var(--color-text))] shadow-[0_8px_18px_-16px_rgba(0,0,0,0.65)]`
                  : tw`border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-border-strong))] hover:bg-[rgb(var(--color-surface-muted))]`,
              ]}
            >
              {option}
              <span tw="ml-1 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]">g</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export const normalizePackageGrams = clampPackageGrams
