import { useEffect, useLayoutEffect } from 'react'
import 'twin.macro'

export type SetupKind = 'sectors' | 'layers' | 'compot'
export type BowlModel = 'traditional' | 'phunnel'

export interface MixBowlItem {
  id: string
  name: string
  percentage: number
  color: string
  photo_url?: string
}

export const MIX_COLORS = ['#9F1D24', '#1F1716', '#B96A18', '#5F2D22', '#7A171E', '#3E251B', '#C18A2F']

export const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export const BowlPreviewFallback = ({ hidden = false }: { hidden?: boolean }) => (
  <div
    aria-hidden="true"
    tw="pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200"
    style={{ opacity: hidden ? 0 : 1 }}
  >
    <svg
      viewBox="0 0 48 48"
      tw="h-10 w-10 text-[rgb(var(--color-text-subtle))]/70"
      fill="none"
    >
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="4" opacity="0.22" />
      <path d="M40 24a16 16 0 0 0-16-16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  </div>
)

export const StaticMixBowlPreview = ({
  kind,
  items,
}: {
  kind: SetupKind
  items: MixBowlItem[]
}) => {
  const total = items.reduce((sum, item) => sum + Number(item.percentage || 0), 0) || 100
  const normalizedItems = items.length
    ? items
    : [{ id: 'empty', name: '', percentage: 100, color: '#B8A99B' }]
  let cursor = 0

  return (
    <div tw="relative aspect-square overflow-hidden bg-[rgb(var(--color-surface-muted))]">
      <svg viewBox="0 0 120 120" tw="h-full w-full" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="static-bowl-rim" cx="50%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="52%" stopColor="#E8DDD3" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#8F8174" stopOpacity="0.35" />
          </radialGradient>
          <filter id="static-bowl-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#2B211C" floodOpacity="0.18" />
          </filter>
        </defs>
        <ellipse cx="60" cy="61" rx="43" ry="35" fill="url(#static-bowl-rim)" filter="url(#static-bowl-shadow)" />
        <ellipse cx="60" cy="55" rx="34" ry="26" fill="#2B211C" opacity="0.16" />
        {kind === 'layers' ? (
          normalizedItems.map((item, index) => {
            const height = Math.max(4, Number(item.percentage || 0) / total * 48)
            const y = 79 - cursor - height
            cursor += height
            return (
              <rect
                key={`${item.id}-${index}`}
                x="28"
                y={y}
                width="64"
                height={height}
                rx="3"
                fill={item.color}
                opacity="0.96"
              />
            )
          })
        ) : kind === 'sectors' ? (
          normalizedItems.map((item, index) => {
            const angle = Number(item.percentage || 0) / total * 360
            const start = cursor
            const end = cursor + angle
            cursor = end
            const largeArc = angle > 180 ? 1 : 0
            const startRad = (start - 90) * Math.PI / 180
            const endRad = (end - 90) * Math.PI / 180
            const x1 = 60 + 30 * Math.cos(startRad)
            const y1 = 55 + 23 * Math.sin(startRad)
            const x2 = 60 + 30 * Math.cos(endRad)
            const y2 = 55 + 23 * Math.sin(endRad)
            return (
              <path
                key={`${item.id}-${index}`}
                d={`M60 55 L${x1.toFixed(2)} ${y1.toFixed(2)} A30 23 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
                fill={item.color}
                opacity="0.96"
              />
            )
          })
        ) : (
          <>
            <ellipse cx="60" cy="55" rx="31" ry="23" fill={normalizedItems[0]?.color || MIX_COLORS[0]} opacity="0.92" />
            {normalizedItems.slice(1, 7).map((item, index) => (
              <circle
                key={`${item.id}-${index}`}
                cx={39 + (index % 4) * 14}
                cy={47 + Math.floor(index / 4) * 13}
                r={8 + (Number(item.percentage || 0) / total) * 8}
                fill={item.color}
                opacity="0.78"
              />
            ))}
          </>
        )}
        <ellipse cx="60" cy="55" rx="34" ry="26" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" />
        <ellipse cx="60" cy="61" rx="43" ry="35" fill="none" stroke="#6F6258" strokeOpacity="0.22" strokeWidth="4" />
      </svg>
    </div>
  )
}

const normalizeName = (value: string) => value.toLowerCase().replace(/\s+/g, '')

export const detectSetupKind = (name?: string | null): SetupKind => {
  const normalized = normalizeName(name || '')
  if (normalized.includes('sector') || normalized.includes('сектор') || normalized.includes('полов')) return 'sectors'
  if (normalized.includes('layer') || normalized.includes('сло')) return 'layers'
  return 'compot'
}

export const detectBowlModel = (bowl?: { bowl_type?: string | null; name?: string | null; description?: string | null } | null): BowlModel => {
  if (bowl?.bowl_type === 'phunnel' || bowl?.bowl_type === 'traditional') return bowl.bowl_type
  const normalized = normalizeName(`${bowl?.name || ''} ${bowl?.description || ''}`)
  if (normalized.includes('phunnel') || normalized.includes('funnel') || normalized.includes('фаннел')) return 'phunnel'
  return 'traditional'
}
