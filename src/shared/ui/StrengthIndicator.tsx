import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { getHeavinessToneKey } from '../setupMetrics'

type StrengthIndicatorProps = {
  value: number | null
  compact?: boolean
  label?: ReactNode
  showScore?: boolean
}

const toneStyles = {
  light: {
    text: '#2F8F67',
    fill: '#3B8B63',
  },
  medium: {
    text: '#B7791F',
    fill: '#C18A2F',
  },
  strong: {
    text: '#C07648',
    fill: '#BE7648',
  },
  heavy: {
    text: '#C6473D',
    fill: '#B33A30',
  },
} as const

export const StrengthIndicator = ({ value, compact = false, label, showScore = false }: StrengthIndicatorProps) => {
  const { t } = useTranslation()
  const hasValue = typeof value === 'number' && Number.isFinite(value)
  const normalized = Math.min(10, Math.max(0, hasValue ? value : 0))
  const tone = getHeavinessToneKey(normalized)
  const styles = toneStyles[tone]
  const filled = Math.round(normalized)

  return (
    <div css={[tw`min-w-0`, compact ? tw`py-0.5` : tw`py-1`]}>
      <div tw="flex min-w-0 items-baseline justify-between gap-2">
        <div tw="flex min-w-0 items-baseline gap-1.5">
          {label && (
            <span tw="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
              {label}
            </span>
          )}
          <span
            css={[
              tw`min-w-0 truncate font-bold leading-none`,
              compact ? tw`text-[11px]` : tw`text-[13px]`,
            ]}
            style={{ color: styles.text }}
          >
            {hasValue ? t(`metrics.heaviness.${tone}`) : t('common.notSelected')}
          </span>
        </div>
        {showScore && hasValue && (
          <span tw="shrink-0 text-[11px] font-black leading-none tabular-nums" style={{ color: styles.text }}>
            {Math.round(normalized)}
          </span>
        )}
      </div>
      <div css={[tw`grid grid-cols-10`, compact ? tw`mt-1.5 gap-1` : tw`mt-2 gap-1.5`]}>
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            css={[
              tw`rounded-sm transition-colors`,
              compact ? tw`h-1.5` : tw`h-2`,
            ]}
            style={{
              backgroundColor: index < filled ? styles.fill : 'rgb(var(--color-surface-subtle))',
              opacity: index < filled ? 1 : 0.68,
            }}
          />
        ))}
      </div>
    </div>
  )
}
