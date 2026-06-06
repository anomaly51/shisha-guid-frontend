import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Card } from '../shared/ui/Card'
import { CatalogIcon, CommentIcon, EyeIcon, HeartIcon } from '../shared/ui/Icons'
import { MIX_COLORS, detectSetupKind, type MixBowlItem } from '../shared/ui/mixBowlModel'
import { TobaccoPhotoStack } from '../shared/ui/TobaccoPhotoStack'
import { AuthorChip } from '../shared/ui/AuthorChip'
import { getSetupHeaviness } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'
import { MixBowlPreview } from '../shared/ui/MixBowlPreview'

const getItem = (items: any[] | undefined, id: string | undefined) => (
  items?.find((item) => item.id === id)
)

const getName = (items: any[] | undefined, id: string | undefined, fallback = 'Tobacco') => (
  items?.find((item) => item.id === id)?.name || fallback
)

const buildMixItems = (setup: any, tobaccos: any[] | undefined, fallbackName: (index: number) => string): MixBowlItem[] => (
  setup.tobaccos?.map((item: any, index: number) => {
    const tobacco = item.tobacco || getItem(tobaccos, item.tobacco_id)

    return {
      id: item.tobacco_id || item.id || `${setup.id}-${index}`,
      name: tobacco?.name || getName(tobaccos, item.tobacco_id, fallbackName(index)),
      percentage: Number(item.percentage || 0),
      color: item.color || MIX_COLORS[index % MIX_COLORS.length],
      photo_url: tobacco?.photo_urls?.[0],
    }
  }) || []
)

export const SetupCard = memo(({
  setup,
  tobaccos,
  typeName,
  rating,
  onOpen,
  onToggleLike,
  canToggleLike = true,
}: {
  setup: any
  tobaccos?: any[]
  typeName: string
  rating: number | null | undefined
  onOpen: (setupId: string) => void
  onToggleLike: (setup: any) => void
  canToggleLike?: boolean
}) => {
  const { t } = useTranslation()
  const ratingValue = (setup?.avg_rating ?? rating) as number | null | undefined
  const ratingText = typeof ratingValue === 'number' && ratingValue > 0 ? ratingValue.toFixed(1) : '—'
  const mixItems = useMemo(
    () => buildMixItems(setup, tobaccos, (index) => t('common.tobaccoFallback', { number: index + 1 })),
    [setup, t, tobaccos],
  )
  const kind = useMemo(() => detectSetupKind(typeName), [typeName])
  const topItems = useMemo(() => mixItems.slice(0, 2), [mixItems])
  const restCount = Math.max(0, mixItems.length - topItems.length)
  const heaviness = useMemo(() => getSetupHeaviness(setup, tobaccos), [setup, tobaccos])

  return (
    <Card variant="hover" onClick={() => onOpen(setup.id)} className="h-full">
      <div tw="flex h-full flex-col bg-[rgb(var(--color-surface))]">
        <div tw="relative border-b border-[rgb(var(--color-border))]">
          <MixBowlPreview
            kind={kind}
            items={mixItems}
            bowlModel={detectBowlModel(setup.bowl)}
            renderMode="snapshot"
            autoRotate={false}
            interactive={false}
            ariaLabel={`${typeName} ${setup.name}`}
          />
          <TobaccoPhotoStack items={mixItems} />
          <div tw="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md border border-white/75 bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[10px] font-bold text-[rgb(var(--color-text-muted))] shadow-[0_10px_24px_-18px_rgba(83,48,31,0.55)] backdrop-blur">
            <CatalogIcon name="placement" size={12} />
            {t(`feed.kind.${kind}`)}
          </div>
          <div tw="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-md border border-white/60 bg-[rgb(var(--color-surface-inverse))]/90 px-2 py-1.5 text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.75)] backdrop-blur">
            <span tw="text-[9px] font-bold uppercase tracking-wide text-white/65">{t('feed.rating')}</span>
            <span tw="text-[13px] font-black leading-none tabular-nums">{ratingText}</span>
          </div>
          <div tw="pointer-events-none absolute left-2.5 bottom-2.5 flex items-center gap-1 rounded-md border border-white/60 bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[11px] font-black text-[rgb(var(--color-text-muted))] shadow-[0_12px_26px_-20px_rgba(83,48,31,0.7)] backdrop-blur">
            <EyeIcon size={13} />
            <span tw="tabular-nums">{Number(setup.views_count || 0)}</span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              if (!canToggleLike) return
              onToggleLike(setup)
            }}
            aria-pressed={Boolean(setup.is_liked)}
            disabled={!canToggleLike}
            tw="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-md border border-white/75 bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[11px] font-black shadow-[0_12px_26px_-20px_rgba(83,48,31,0.7)] backdrop-blur transition-colors hover:bg-[rgb(var(--color-accent-muted))]"
            css={[
              setup.is_liked ? { color: 'rgb(var(--color-danger))' } : { color: 'rgb(var(--color-text-muted))' },
              !canToggleLike ? { cursor: 'not-allowed', opacity: 0.55 } : null,
            ]}
          >
            <HeartIcon size={13} />
            <span tw="tabular-nums">{Number(setup.likes_count || 0)}</span>
          </button>
        </div>

        <div tw="flex flex-1 flex-col gap-3 px-3.5 py-3.5">
          <div tw="min-w-0">
            <h3 tw="text-[13px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2 sm:text-sm">{setup.name}</h3>
            <div tw="mt-2">
              <AuthorChip author={setup.creator} compact quickFollow />
            </div>
          </div>

          <div tw="min-w-0">
            <div tw="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('feed.composition')}</div>
            {topItems.length ? (
              <div tw="flex flex-wrap gap-1.5">
                {topItems.map((item) => (
                  <span key={item.id} tw="inline-flex max-w-full items-center gap-1 rounded-md bg-[rgb(var(--color-surface-muted))] px-1.5 py-1 text-[11px] font-semibold text-[rgb(var(--color-text-muted))]">
                    <span tw="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span tw="min-w-0 truncate">{item.name}</span>
                    <span tw="shrink-0 font-black text-[rgb(var(--color-accent))] tabular-nums">{item.percentage}%</span>
                  </span>
                ))}
                {restCount > 0 && (
                  <span tw="inline-flex items-center rounded-md bg-[rgb(var(--color-surface-subtle))] px-1.5 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))]">
                    +{restCount}
                  </span>
                )}
              </div>
            ) : (
              <div tw="flex items-center gap-1.5 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">
                <CatalogIcon name="tobacco" size={12} />
                {t('feed.noTobacco')}
              </div>
            )}
          </div>

          {setup.tags?.length > 0 && (
            <div tw="flex flex-wrap gap-1">
              {setup.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-1.5 py-1 text-[10px] font-bold text-[rgb(var(--color-text-subtle))]">#{tag}</span>
              ))}
            </div>
          )}

          <div tw="mt-auto border-t border-[rgb(var(--color-border))] pt-3">
            <div tw="mb-2 flex items-center gap-2 text-[11px] font-black text-[rgb(var(--color-text-muted))]">
              <CommentIcon size={13} />
              <span tw="tabular-nums">{Number(setup.comments_count || 0)}</span>
            </div>
            <StrengthIndicator label={t('feed.strength')} value={heaviness} compact />
          </div>
        </div>
      </div>
    </Card>
  )
})

SetupCard.displayName = 'SetupCard'
