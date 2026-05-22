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
