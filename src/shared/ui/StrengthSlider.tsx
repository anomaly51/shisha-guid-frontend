import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { getHeavinessToneKey } from '../setupMetrics'

type StrengthSliderProps = {
  value: number
  onChange: (value: number) => void
  label: string
  hint?: string
  disabled?: boolean
}

const toneColors = {
  light: '#3B8B63',
  medium: '#C18A2F',
  strong: '#BE7648',
  heavy: '#B33A30',
} as const

const clampStrength = (value: number) => Math.min(10, Math.max(0, Number.isFinite(value) ? value : 5))
const OPTIONS = Array.from({ length: 11 }, (_, index) => index)

export const StrengthSlider = ({ value, onChange, label, hint, disabled }: StrengthSliderProps) => {
  const { t } = useTranslation()
  const normalized = clampStrength(value)
  const tone = getHeavinessToneKey(normalized)
  const color = toneColors[tone]
  const filled = Math.round(normalized)

  return (
    <fieldset tw="grid gap-2" disabled={disabled}>
      <div tw="flex items-baseline justify-between gap-3">
        <div tw="min-w-0">
          <legend tw="text-[10px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wide">
            {label}
          </legend>
        </div>
        <p tw="shrink-0 text-[13px] font-black tabular-nums" style={{ color }}>
          {normalized.toFixed(1)}
          <span tw="ml-1 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]">{t(`metrics.heaviness.${tone}`)}</span>
        </p>
      </div>

      {hint && <p tw="text-[11px] font-medium leading-relaxed text-[rgb(var(--color-text-subtle))]">{hint}</p>}

      <div tw="grid grid-cols-10 gap-1.5" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            tw="h-2 rounded-sm transition-colors"
            style={{
              backgroundColor: index < filled ? color : 'rgb(var(--color-surface-subtle))',
              opacity: index < filled ? 1 : 0.68,
            }}
          />
        ))}
      </div>

      <div tw="grid grid-cols-4 gap-2 sm:grid-cols-6">
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
                  ? tw`bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] shadow-[0_8px_18px_-16px_rgba(0,0,0,0.65)]`
                  : tw`border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-border-strong))] hover:bg-[rgb(var(--color-surface-muted))]`,
              ]}
              style={active ? { borderColor: color, backgroundColor: `${color}1A` } : undefined}
            >
              {option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
