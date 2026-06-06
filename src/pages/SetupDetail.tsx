import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  useCreateSetupReviewMutation,
  useCreateSetupCommentMutation,
  useAddSetupContributorMutation,
  useAddSetupToCollectionMutation,
  useBookmarkSetupMutation,
  useCloneSetupMutation,
  useCreateCollectionMutation,
  useCreateReportMutation,
  useCreateReviewReplyMutation,
  useDeleteSetupCommentMutation,
  useDeleteSetupReviewMutation,
  useGetCollectionsQuery,
  useGetReviewRepliesQuery,
  useGetBowlSetupTypesQuery,
  useGetBowlsQuery,
  useGetCoalPlacementsQuery,
  useGetCoalsQuery,
  useGetKaloudsQuery,
  useGetProfileQuery,
  useGetSetupReviewsQuery,
  useGetSetupCommentsQuery,
  useGetSetupQuery,
  useLazyGetSetupsQuery,
  useGetSetupVersionsQuery,
  useDeleteSetupMutation,
  useRecordSetupViewMutation,
  useLikeSetupMutation,
  useSetSetupFeaturedMutation,
  useRemoveSetupContributorMutation,
  useUnbookmarkSetupMutation,
  useUnlikeSetupMutation,
  useUpdateSetupReviewMutation,
} from '../shared/api'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { Textarea } from '../shared/ui/Input'
import { Modal } from '../shared/ui/Modal'
import { Skeleton } from '../shared/ui/Skeleton'
import { AlertIcon, CatalogIcon, CommentIcon, EyeIcon, HeartIcon, ShareIcon, type CatalogIconName } from '../shared/ui/Icons'
import { MIX_COLORS, detectBowlModel, detectSetupKind, type MixBowlItem } from '../shared/ui/mixBowlModel'
import { MixBowlPreview } from '../shared/ui/MixBowlPreview'
import { TobaccoPhotoStack } from '../shared/ui/TobaccoPhotoStack'
import { AuthorChip } from '../shared/ui/AuthorChip'
import {
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  REVIEW_RATING_STEP,
  getReviewAverage,
  normalizeReviewRating,
  type SetupReview,
} from '../shared/reviews'
import { getSetupHeaviness } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'
import { calculateSetupCost, formatMoney } from '../shared/setupCost'
import { hasAuthToken } from '../shared/authToken'

const Label = tw.p`text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]`
const SectionTitle = tw.h2`text-[18px] font-semibold leading-tight text-[rgb(var(--color-text))]`
const MutedText = tw.p`text-[13px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]`

const getItem = (items: any[] | undefined, id: string | undefined | null) => {
  if (!items || !id) return undefined
  const needle = String(id)
  return items.find((item) => {
    const candidate = item?.id
    return candidate != null && String(candidate) === needle
  })
}

const buildMixItems = (setup: any, tobaccos: any[] | undefined, fallbackName: (index: number) => string): MixBowlItem[] => (
  setup.tobaccos?.map((item: any, index: number) => {
    const tobacco = item.tobacco || getItem(tobaccos, item.tobacco_id)

    return {
      id: item.tobacco_id || item.id || `${setup.id}-${index}`,
      name: tobacco?.name || fallbackName(index),
      percentage: Number(item.percentage || 0),
      color: item.color || MIX_COLORS[index % MIX_COLORS.length],
      photo_url: tobacco?.photo_urls?.[0],
    }
  }) || []
)

const formatReviewDate = (value: string | undefined, language: string) => {
  if (!value) return ''
  return new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, year: 'numeric' }).format(new Date(value))
}

const isReviewAuthor = (review: SetupReview, profile: any) => {
  if (!profile?.id) return false
  const profileId = String(profile.id)
  return String(review.creator_id) === profileId || String(review.creator?.id) === profileId
}

const isSetupAuthor = (setup: any, profile: any) => {
  if (!setup || !profile?.id) return false
  const profileId = String(profile.id)
  return (
    String(setup.creator_id) === profileId ||
    String(setup.creator?.id) === profileId ||
    String(setup.user_id) === profileId
  )
}

const Visual = ({ item, icon }: { item: any; icon: CatalogIconName }) => {
  const photo = item?.photo_urls?.[0]

  return (
    <div tw="relative aspect-square overflow-hidden rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))]">
      {photo ? (
        <img src={photo} alt={item?.name || ''} tw="h-full w-full object-cover" />
      ) : (
        <div tw="flex h-full items-center justify-center text-[rgb(var(--color-text-subtle))]">
          <CatalogIcon name={icon} size={34} />
        </div>
      )}
    </div>
  )
}

const CostSummary = ({ cost }: { cost: ReturnType<typeof calculateSetupCost> }) => {
  const { t } = useTranslation()
  const tobaccoValue = formatMoney(cost.tobaccoCost, cost.currency) || '-'
  const coalValue = formatMoney(cost.coalCost, cost.currency) || '-'
  const totalValue = formatMoney(cost.total, cost.currency) || t('setupDetail.costIncomplete')
  const tobaccoAmount = cost.tobaccoGrams ? t('setupDetail.gramsShort', { value: cost.tobaccoGrams.toFixed(1) }) : null
  const coalAmount = cost.coalCount ? t('setupDetail.coalCountShort', { count: cost.coalCount }) : null

  return (
    <div tw="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-inverse))] p-3 text-white shadow-[0_18px_36px_-30px_rgba(23,19,18,0.75)]">
      <div tw="flex items-start justify-between gap-2">
        <div>
          <Label tw="text-[rgb(var(--color-text-subtle))]">{t('setupDetail.costTitle')}</Label>
          <p tw="mt-1 text-[22px] font-black leading-none tabular-nums">
            {cost.isComplete ? totalValue : '—'}
          </p>
        </div>
        <span tw="rounded-md bg-[rgb(var(--color-surface))]/10 px-2 py-1 text-[10px] font-bold text-white/85">
          {cost.isComplete ? t('setupDetail.costReady') : t('setupDetail.costNeedsData')}
        </span>
      </div>

      <div tw="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.1fr)] items-stretch gap-1.5">
        <div tw="min-w-0 rounded-lg border border-white/10 bg-[rgb(var(--color-surface))]/10 px-2 py-2">
          <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
            {t('setupDetail.tobaccoCost')}
            {tobaccoAmount && <span tw="normal-case text-white/55"> ({tobaccoAmount})</span>}
          </p>
          <p tw="mt-0.5 truncate text-[12px] font-black tabular-nums">{tobaccoValue}</p>
        </div>
        <span tw="flex items-center justify-center text-[16px] font-black text-white/45">+</span>
        <div tw="min-w-0 rounded-lg border border-white/10 bg-[rgb(var(--color-surface))]/10 px-2 py-2">
          <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
            {t('setupDetail.coalCost')}
            {coalAmount && <span tw="normal-case text-white/55"> ({coalAmount})</span>}
          </p>
          <p tw="mt-0.5 truncate text-[12px] font-black tabular-nums">{coalValue}</p>
        </div>
        <span tw="flex items-center justify-center text-[16px] font-black text-white/45">=</span>
        <div tw="min-w-0 rounded-lg bg-[rgb(var(--color-surface))] px-2 py-2 text-[rgb(var(--color-text))]">
          <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">{t('setupDetail.totalCost')}</p>
          <p tw="mt-0.5 truncate text-[12px] font-black tabular-nums">{totalValue}</p>
        </div>
      </div>

    </div>
  )
}

const CompactSetupSummary = ({ kind, typeName, heaviness }: { kind: ReturnType<typeof detectSetupKind>; typeName: string; heaviness: number | null }) => {
  const { t } = useTranslation()

  return (
    <div tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3">
      <div tw="flex items-center justify-between gap-3">
        <div tw="min-w-0">
          <Label>{t('setupDetail.mix')}</Label>
          <p tw="mt-1 truncate text-[13px] font-bold text-[rgb(var(--color-text))]">{t(`setupDetail.kind.${kind}`)}</p>
          <p tw="mt-0.5 truncate text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">{typeName}</p>
        </div>
        <div tw="shrink-0 min-w-0 flex flex-col gap-2 text-right">
          <Label>{t('setupDetail.heaviness')}</Label>
          <p tw="rounded-lg bg-[rgb(var(--color-surface-inverse))] px-2.5 py-1.5 text-[14px] font-black text-white tabular-nums">
            {heaviness === null ? '-' : `${heaviness.toFixed(1)}/10`}
          </p>
          <StrengthIndicator value={heaviness} compact activeColor="rgb(var(--color-accent))" />
        </div>
      </div>
    </div>
  )
}

const MixRatioBar = ({ items }: { items: MixBowlItem[] }) => {
  const total = items.reduce((sum, item) => sum + item.percentage, 0) || 100

  return (
    <div tw="overflow-hidden rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-subtle))]">
      <div tw="flex h-3">
        {items.map((item) => (
          <div
            key={item.id}
            style={{ width: `${Math.max(3, item.percentage / total * 100)}%`, backgroundColor: item.color }}
          />
        ))}
      </div>
    </div>
  )
}

const StepHeader = ({ number, title, caption }: { number: number; title: string; caption: string }) => (
  <div tw="mb-4 flex items-start gap-3">
    <span tw="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-accent))] text-[13px] font-bold text-white">
      {number}
    </span>
    <div tw="min-w-0">
      <SectionTitle>{title}</SectionTitle>
      <MutedText tw="mt-1">{caption}</MutedText>
    </div>
  </div>
)

const getSnapshotLabel = (snapshot: any, key: string) => {
  const value = snapshot?.[key]
  if (Array.isArray(value)) {
    if (key === 'tobaccos') return `${value.length} табаков`
    return value.length ? value.join(', ') : '-'
  }
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

const VersionHistory = ({ current, setupId }: { current: any; setupId: string }) => {
  const hasToken = hasAuthToken()
  if (!hasToken) return null

  const { data: versions = [] } = useGetSetupVersionsQuery(setupId, { skip: !hasToken })
  const rows = useMemo(() => {
    const currentSnapshot = {
      name: current.name,
      description: current.description,
      photo_urls: current.photo_urls || [],
      tags: current.tags || [],
      tobaccos: current.tobaccos || [],
    }
    const all = [
      ...versions.map((version: any) => ({ ...version, label: `v${version.version}`, snapshot: version.snapshot || {} })),
      { id: 'current', label: `v${current.version || versions.length + 1}`, snapshot: currentSnapshot },
    ].sort((left: any, right: any) => Number(left.version || 999999) - Number(right.version || 999999))

    return all.map((entry: any, index: number) => {
      const previous = all[index - 1]?.snapshot
      const changed = ['name', 'description', 'tags', 'photo_urls', 'tobaccos'].filter((key) => (
        previous ? JSON.stringify(previous[key] ?? null) !== JSON.stringify(entry.snapshot?.[key] ?? null) : true
      ))
      return { ...entry, changed }
    }).reverse()
  }, [current, versions])

  return (
    <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-4 sm:p-5">
      <div tw="flex items-center justify-between gap-3">
        <div>
          <Label>История</Label>
          <SectionTitle tw="mt-1">Изменения забивки</SectionTitle>
        </div>
        <span tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] px-3 py-1.5 text-[12px] font-black text-[rgb(var(--color-text-muted))] tabular-nums">
          {rows.length}
        </span>
      </div>
      <div tw="mt-4 grid gap-3">
        {rows.map((row: any) => (
          <article key={row.id} tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-3">
            <div tw="flex flex-wrap items-center justify-between gap-2">
              <p tw="text-[13px] font-black text-[rgb(var(--color-text))]">{row.label}</p>
              <div tw="flex flex-wrap gap-1">
                {row.changed.map((key: string) => (
                  <span key={key} tw="rounded-md bg-[rgb(var(--color-accent-muted))] px-2 py-1 text-[10px] font-black text-[rgb(var(--color-accent))]">
                    {key}
                  </span>
                ))}
              </div>
            </div>
            <div tw="mt-3 grid gap-2 sm:grid-cols-2">
              {row.changed.slice(0, 4).map((key: string) => (
                <div key={key} tw="min-w-0 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2.5 py-2">
                  <p tw="text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{key}</p>
                  <p tw="mt-0.5 truncate text-[12px] font-semibold text-[rgb(var(--color-text-muted))]">{getSnapshotLabel(row.snapshot, key)}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const SimilarSetups = ({ currentId, tobaccoIds }: { currentId: string; tobaccoIds: string[] }) => {
  const [sectionRef, setSectionRef] = useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [triggerSetups, { data }] = useLazyGetSetupsQuery()

  useEffect(() => {
    if (!sectionRef || isVisible || tobaccoIds.length === 0) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(sectionRef)
    return () => observer.disconnect()
  }, [isVisible, sectionRef, tobaccoIds.length])

  useEffect(() => {
    if (!isVisible || tobaccoIds.length === 0) return
    const request = triggerSetups({ tobacco_ids: tobaccoIds, limit: 6 })
    return () => request.abort()
  }, [isVisible, tobaccoIds, triggerSetups])

  const items = useMemo(() => (data?.items || []).filter((setup: any) => setup.id !== currentId).slice(0, 4), [currentId, data])
  if (!items.length) return null

  return (
    <section ref={setSectionRef} tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-4 sm:p-5">
      <div>
        <Label>Рекомендации</Label>
        <SectionTitle tw="mt-1">Похожие забивки</SectionTitle>
      </div>
      <div tw="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((setup: any) => (
          <Link key={setup.id} to={`/setups/${setup.id}`} tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3 transition-colors hover:bg-[rgb(var(--color-accent-muted))]">
            <p tw="truncate text-[13px] font-black text-[rgb(var(--color-text))]">{setup.name}</p>
            <p tw="mt-1 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">{Number(setup.views_count || 0)} просмотров</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

const EquipmentCard = ({
  item,
  icon,
  label,
  loading = false,
}: {
  item: any
  icon: CatalogIconName
  label: string
  loading?: boolean
}) => {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div tw="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3 shadow-[0_1px_2px_rgba(24,24,27,0.03)]">
        <Skeleton w="100%" h="112px" />
        <div tw="min-w-0 grid gap-1">
          <Skeleton w="44%" h="10px" />
          <Skeleton w="70%" h="16px" />
        </div>
      </div>
    )
  }

  return (
  <div tw="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3 shadow-[0_1px_2px_rgba(24,24,27,0.03)]">
    <Visual item={item} icon={icon} />
    <div tw="min-w-0">
      <Label>{label}</Label>
      <p tw="mt-0.5 truncate text-[13px] font-semibold text-[rgb(var(--color-text))]">{item?.name || t('common.unknown')}</p>
    </div>
  </div>
  )
}

const TobaccoMeasureCard = ({ count, kind, mix, index }: { count: number; kind: ReturnType<typeof detectSetupKind>; mix: MixBowlItem; index: number }) => {
  const { t } = useTranslation()
  const position = kind === 'layers'
    ? index === 0 ? t('setupDetail.layerPosition.bottom') : index === count - 1 ? t('setupDetail.layerPosition.top') : t('setupDetail.layerPosition.middle', { number: index + 1 })
    : kind === 'sectors' ? t('setupDetail.layerPosition.sector') : t('setupDetail.layerPosition.compot')

  return (
  <div tw="grid grid-cols-[86px_minmax(0,1fr)] gap-3 rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-3 shadow-[0_1px_2px_rgba(24,24,27,0.03)]">
    <div tw="relative aspect-square overflow-hidden rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))]">
      {mix.photo_url ? (
        <img src={mix.photo_url} alt={mix.name} tw="h-full w-full object-cover" />
      ) : (
        <div tw="flex h-full w-full items-center justify-center" style={{ backgroundColor: mix.color }}>
          <CatalogIcon name="tobacco" size={28} tw="text-white/90" />
        </div>
      )}
      <span tw="absolute bottom-1.5 right-1.5 rounded-md bg-[rgb(var(--color-surface))]/90 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[rgb(var(--color-text))] shadow-sm">
        {mix.percentage}%
      </span>
    </div>
    <div tw="min-w-0 self-center">
      <p tw="truncate text-[14px] font-semibold text-[rgb(var(--color-text))]">{mix.name}</p>
      <p tw="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
        {position}
      </p>
      <div tw="mt-3 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-subtle))]">
        <div tw="h-full rounded-full" style={{ width: `${Math.max(4, mix.percentage)}%`, backgroundColor: mix.color }} />
      </div>
    </div>
  </div>
  )
}

const RatingPill = ({ rating, large = false }: { rating: number | null; large?: boolean }) => (
  <span
    tw="inline-flex min-w-[54px] items-baseline justify-center rounded-lg bg-[rgb(var(--color-surface-inverse))] px-2.5 py-1.5 text-[15px] font-black text-white tabular-nums"
    css={large ? tw`min-w-[74px] gap-0.5 px-3 py-2 text-[22px]` : undefined}
  >
    {rating === null ? '-' : Number(rating).toFixed(1)}
    {rating !== null && <span tw="ml-0.5 text-[9px] font-bold text-white/65" css={large ? tw`text-[11px]` : undefined}>/10</span>}
  </span>
)

const RatingPicker = ({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled: boolean
  onChange: (value: number) => void
}) => (
  <div tw="grid gap-2">
    <div tw="grid grid-cols-5 gap-1.5">
      {Array.from({ length: (REVIEW_RATING_MAX - REVIEW_RATING_MIN) / REVIEW_RATING_STEP + 1 }).map((_, index) => {
        const option = REVIEW_RATING_MIN + index * REVIEW_RATING_STEP
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={disabled}
            aria-pressed={active}
            css={[
              tw`h-8 rounded-lg border px-1 text-[11px] font-black tabular-nums transition-colors`,
              active
                ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))] text-white`
                : tw`border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-accent))]`,
              disabled && tw`cursor-not-allowed opacity-45`,
            ]}
          >
            {Number.isInteger(option) ? option : option.toFixed(1)}
          </button>
        )
      })}
    </div>
    <input
      min={REVIEW_RATING_MIN}
      max={REVIEW_RATING_MAX}
      step={REVIEW_RATING_STEP}
      type="range"
      value={value}
      onChange={(event) => onChange(normalizeReviewRating(Number(event.target.value)))}
      disabled={disabled}
      tw="w-full accent-[rgb(var(--color-accent))]"
    />
  </div>
)

const ReviewReplies = ({ review, setupId, canReply }: { review: any; setupId: string; canReply: boolean }) => {
  const { data: replies = [] } = useGetReviewRepliesQuery({ setupId, reviewId: review.id })
  const [createReply, { isLoading }] = useCreateReviewReplyMutation()
  const [body, setBody] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    await createReply({ setupId, reviewId: review.id, body: text }).unwrap()
    setBody('')
  }

  return (
    <div tw="mt-3 border-t border-[rgb(var(--color-border-muted))] pt-3">
      {replies.length > 0 && (
        <div tw="grid gap-2">
          {replies.map((reply: any) => (
            <div key={reply.id} tw="rounded-lg bg-[rgb(var(--color-surface))] px-3 py-2">
              <AuthorChip author={reply.creator} compact />
              <p tw="mt-2 whitespace-pre-wrap text-[12px] font-medium text-[rgb(var(--color-text-muted))]">{reply.body}</p>
            </div>
          ))}
        </div>
      )}
      {canReply && (
        <form onSubmit={submit} tw="mt-2 grid gap-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Ответить на отзыв"
            rows={2}
            maxLength={1000}
            disabled={isLoading}
          />
          <div tw="flex justify-end">
            <Button type="submit" size="sm" disabled={!body.trim() || isLoading}>
              {isLoading ? 'Отправка...' : 'Ответить'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

const SetupReviews = ({ setupId, setupCreatorId }: { setupId: string; setupCreatorId?: string }) => {
  const { i18n, t } = useTranslation()
  const hasToken = hasAuthToken()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const { data: reviews = [], isLoading } = useGetSetupReviewsQuery(setupId)
  const [createReview, { isLoading: saving }] = useCreateSetupReviewMutation()
  const [updateReview, { isLoading: updating }] = useUpdateSetupReviewMutation()
  const [deleteReview, { isLoading: deletingReview }] = useDeleteSetupReviewMutation()
  const [rating, setRating] = useState(8)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const reviewFormRef = useRef<HTMLFormElement>(null)

  const average = getReviewAverage(reviews)
  const ownReview = profile ? reviews.find((review: SetupReview) => isReviewAuthor(review, profile)) : undefined
  const sortedReviews = useMemo(() => (
    profile
      ? [...reviews].sort((left: SetupReview, right: SetupReview) => Number(isReviewAuthor(right, profile)) - Number(isReviewAuthor(left, profile)))
      : reviews
  ), [profile, reviews])
  const isSetupOwner = Boolean(profile?.id && setupCreatorId && String(profile.id) === String(setupCreatorId))
  const isSaving = saving || updating || deletingReview
  const formTitle = ownReview ? t('reviews.editTitle') : t('reviews.writeTitle')
  const formHint = profile
    ? ownReview
      ? t('reviews.ownHint')
      : t('reviews.authorHint', { name: profile.nickname || profile.email })
    : t('reviews.signInHint')

  useEffect(() => {
    setError('')
    if (ownReview) {
      setRating(normalizeReviewRating(Number(ownReview.rating || 8)))
      setDescription(ownReview.description || '')
      return
    }
    setRating(8)
    setDescription('')
  }, [ownReview?.id, setupId])

  const focusReviewForm = () => {
    reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => {
      reviewFormRef.current?.querySelector('textarea')?.focus()
    }, 250)
  }

  const handleDeleteReview = async (reviewId: string) => {
    setError('')
    try {
      await deleteReview({ setupId, reviewId }).unwrap()
      setDescription('')
      setRating(8)
    } catch {
      setError(t('reviews.saveFailed'))
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (isSetupOwner) {
      setError('Автор не может оставить отзыв на свою забивку.')
      return
    }
    const text = description.trim()
    if (text.length < 3) {
      setError(t('reviews.tooShort'))
      return
    }

    const normalizedRating = normalizeReviewRating(rating)
    setRating(normalizedRating)

    try {
      if (ownReview) {
        await updateReview({ setupId, reviewId: ownReview.id, rating: normalizedRating, description: text }).unwrap()
      } else {
        await createReview({ setupId, rating: normalizedRating, description: text }).unwrap()
        setDescription('')
        setRating(8)
      }
    } catch (requestError: any) {
      setError(requestError?.status === 409 ? t('reviews.duplicate') : t('reviews.saveFailed'))
    }
  }

  return (
    <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-4 sm:p-5">
      <div tw="flex flex-wrap items-start justify-between gap-2">
        <div tw="min-w-0">
          <Label>{t('reviews.titleLabel')}</Label>
          <SectionTitle tw="mt-1">{t('reviews.title')}</SectionTitle>
          <div tw="mt-2 inline-flex items-center gap-2">
            <Label>{t('reviews.average')}</Label>
            <RatingPill rating={average} large />
          </div>
        </div>
      </div>

      <div tw="mt-4 grid gap-3">
        {isLoading && <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-4 text-[13px] font-medium text-[rgb(var(--color-text-muted))]">{t('reviews.loading')}</div>}
        {!isLoading && reviews.length === 0 && (
          <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] p-4 text-[13px] font-medium text-[rgb(var(--color-text-muted))]">
            {t('reviews.empty')}
          </div>
        )}
        {sortedReviews.map((review: SetupReview) => {
          const isOwnReview = isReviewAuthor(review, profile)

          return (
          <article
            key={review.id}
            css={[
              tw`rounded-lg border bg-[rgb(var(--color-surface-raised))] p-3`,
              isOwnReview ? tw`border-[rgb(var(--color-border-strong))]` : tw`border-[rgb(var(--color-border-muted))]`,
            ]}
          >
            <div tw="flex items-center justify-between gap-3">
              <div tw="flex min-w-0 items-center gap-3">
                <AuthorChip author={review.creator} compact />
                <div tw="min-w-0">
                  <p tw="text-[11px] font-medium text-[rgb(var(--color-text-subtle))]">{formatReviewDate(review.created_at, i18n.language)}</p>
                  {isOwnReview && (
                    <div tw="mt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={focusReviewForm}
                        tw="text-[11px] font-bold text-[rgb(var(--color-accent))] underline-offset-2 hover:underline"
                      >
                        {t('reviews.editReviewLink')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={isSaving}
                        tw="text-[11px] font-bold text-[rgb(var(--color-danger))] underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <RatingPill rating={review.rating} />
            </div>
            <p tw="mt-3 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]">{review.description}</p>
            <ReviewReplies review={review} setupId={setupId} canReply={isSetupOwner} />
          </article>
          )
        })}
      </div>

      <form ref={reviewFormRef} onSubmit={handleSubmit} tw="mt-4 border-t border-[rgb(var(--color-border-muted))] pt-4">
        <div tw="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div>
            <p tw="text-[14px] font-semibold text-[rgb(var(--color-text))]">{formTitle}</p>
            <p tw="mt-1 text-[12px] font-medium text-[rgb(var(--color-text-subtle))]">
              {formHint}
            </p>
            <div tw="mt-3">
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={ownReview ? t('reviews.updatePlaceholder') : t('reviews.createPlaceholder')}
                rows={4}
                maxLength={2000}
                disabled={!profile || isSetupOwner || isSaving}
              />
            </div>
            <p tw="mt-1 text-right text-[11px] font-medium text-[rgb(var(--color-text-subtle))]">{description.length}/2000</p>
          </div>
          <div tw="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-raised))] p-3">
            <div tw="mb-3 flex items-center justify-between">
              <Label>{t('reviews.rating')}</Label>
              <RatingPill rating={rating} />
            </div>
            <RatingPicker
              value={rating}
              disabled={!profile || isSetupOwner || isSaving}
              onChange={(value) => setRating(normalizeReviewRating(value))}
            />
          </div>
        </div>
        {error && <p tw="mt-3 rounded-lg border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-surface))] px-3 py-2 text-[13px] font-medium text-[rgb(var(--color-danger))]">{error}</p>}
        <div tw="mt-3 flex justify-end">
          <Button type="submit" disabled={!profile || isSetupOwner || isSaving}>
            {isSaving ? t('reviews.saving') : ownReview ? t('reviews.saveChanges') : t('reviews.save')}
          </Button>
        </div>
      </form>
    </section>
  )
}

const SetupComments = ({ setupId }: { setupId: string }) => {
  const { t } = useTranslation()
  const hasToken = hasAuthToken()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const { data: comments = [], isLoading } = useGetSetupCommentsQuery(setupId)
  const [createComment, { isLoading: creating }] = useCreateSetupCommentMutation()
  const [deleteComment, { isLoading: deleting }] = useDeleteSetupCommentMutation()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    setError('')
    if (text.length < 1) return
    try {
      await createComment({ setupId, body: text }).unwrap()
      setBody('')
    } catch {
      setError(t('common.failedSave'))
    }
  }

  return (
    <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-4 sm:p-5">
      <div tw="flex items-center justify-between gap-3">
        <div>
          <Label>Обсуждение</Label>
          <SectionTitle tw="mt-1">Комментарии</SectionTitle>
        </div>
        <span tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] px-3 py-1.5 text-[12px] font-black text-[rgb(var(--color-text-muted))] tabular-nums">
          {comments.length}
        </span>
      </div>

      <form onSubmit={submitComment} tw="mt-4 grid gap-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={profile ? 'Написать короткий комментарий' : 'Войдите, чтобы комментировать'}
          rows={3}
          maxLength={500}
          disabled={!profile || creating}
        />
        <div tw="flex items-center justify-between gap-3">
          <span tw="text-[11px] font-medium text-[rgb(var(--color-text-subtle))]">{body.length}/500</span>
          <Button type="submit" size="sm" disabled={!profile || creating || !body.trim()}>
            {creating ? t('common.saving') : 'Отправить'}
          </Button>
        </div>
        {error && <p tw="rounded-lg border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-surface))] px-3 py-2 text-[13px] font-medium text-[rgb(var(--color-danger))]">{error}</p>}
      </form>

      <div tw="mt-4 grid gap-3">
        {isLoading && <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-4 text-[13px] font-medium text-[rgb(var(--color-text-muted))]">{t('common.loading')}</div>}
        {!isLoading && !comments.length && (
          <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] p-4 text-[13px] font-medium text-[rgb(var(--color-text-muted))]">
            Пока нет комментариев.
          </div>
        )}
        {comments.map((comment: any) => {
          const ownComment = profile?.id && String(profile.id) === String(comment.creator_id)
          return (
            <article key={comment.id} tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-3">
              <div tw="flex items-start justify-between gap-3">
                <AuthorChip author={comment.creator} compact />
                {ownComment && (
                  <button
                    type="button"
                    onClick={() => deleteComment({ setupId, commentId: comment.id })}
                    disabled={deleting}
                    tw="text-[11px] font-bold text-[rgb(var(--color-danger))] underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
              <p tw="mt-3 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]">{comment.body}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export const SetupDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: item, isLoading } = useGetSetupQuery(id!)
  const hasToken = hasAuthToken()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const [deleteSetup, { isLoading: deleting }] = useDeleteSetupMutation()
  const [setSetupFeatured, { isLoading: featuring }] = useSetSetupFeaturedMutation()
  const [cloneSetup, { isLoading: cloning }] = useCloneSetupMutation()
  const [bookmarkSetup, { isLoading: bookmarking }] = useBookmarkSetupMutation()
  const [unbookmarkSetup, { isLoading: unbookmarking }] = useUnbookmarkSetupMutation()
  const [likeSetup, { isLoading: liking }] = useLikeSetupMutation()
  const [unlikeSetup, { isLoading: unliking }] = useUnlikeSetupMutation()
  const [addContributor, { isLoading: addingContributor }] = useAddSetupContributorMutation()
  const [removeContributor] = useRemoveSetupContributorMutation()
  const [createReport, { isLoading: reporting }] = useCreateReportMutation()
  const [createCollection, { isLoading: creatingCollection }] = useCreateCollectionMutation()
  const [addToCollection, { isLoading: addingToCollection }] = useAddSetupToCollectionMutation()
  const [recordSetupView] = useRecordSetupViewMutation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [contributorNick, setContributorNick] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const { data: collections = [] } = useGetCollectionsQuery(undefined, { skip: !hasToken })
  const { data: bowls } = useGetBowlsQuery()
  const { data: coals } = useGetCoalsQuery()
  const { data: kalouds } = useGetKaloudsQuery()
  const { data: placements } = useGetCoalPlacementsQuery()
  const { data: types } = useGetBowlSetupTypesQuery()

  const bowl = getItem(bowls, item?.bowl_id)
  const kaloud = getItem(kalouds, item?.kaloud_id)
  const coal = getItem(coals, item?.coal_id)
  const placement = getItem(placements, item?.coal_placement_id)
  const setupType = getItem(types, item?.bowl_setup_type_id)
  const shouldShowEquipmentSkeleton = !item || !bowls || !coals || !kalouds || !placements
  const typeName = setupType?.name || 'Compot'
  const kind = detectSetupKind(typeName)
  const bowlModel = detectBowlModel(bowl)
  const mixItems = useMemo(() => (item ? buildMixItems(item, undefined, (index) => t('common.tobaccoFallback', { number: index + 1 })) : []), [item, t])
  const tobaccoIds = useMemo(() => (
    item?.tobaccos?.map((entry: any) => entry.tobacco_id).filter(Boolean) || []
  ), [item?.tobaccos])
  const heaviness = useMemo(() => (item ? getSetupHeaviness(item, undefined) : null), [item])
  const setupCost = useMemo(() => calculateSetupCost({
    bowl,
    coal,
    mix: item?.tobaccos,
    placement,
  }), [bowl, coal, item?.tobaccos, placement])
  const isAdmin = profile?.role === 'admin'
  const canManageSetup = isAdmin || isSetupAuthor(item, profile)
  const feedSearch = (location.state as { feedSearch?: string } | null)?.feedSearch || ''
  const feedPath = `/${feedSearch}`

  useEffect(() => {
    if (!id || !item) return
    if (hasToken && !profile) return
    if (isSetupAuthor(item, profile)) return
    recordSetupView(id).catch(() => undefined)
  }, [hasToken, id, item, profile, recordSetupView])

  useEffect(() => {
    if (!item?.id || typeof window === 'undefined') return
    const key = 'shisha-guid:viewed-setups'
    const entry = { id: item.id, name: item.name, viewed_at: new Date().toISOString() }
    try {
      const current = JSON.parse(window.localStorage.getItem(key) || '[]')
      const next = [entry, ...current.filter((stored: any) => stored.id !== item.id)].slice(0, 10)
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      window.localStorage.setItem(key, JSON.stringify([entry]))
    }
  }, [item?.id, item?.name])

  const handleDelete = async () => {
    if (!item?.id) return
    setDeleteError('')

    try {
      await deleteSetup(item.id).unwrap()
      navigate(feedPath)
    } catch {
      setDeleteError(t('setupDetail.deleteFailed'))
    }
  }

  const handleClone = async () => {
    if (!item?.id) return
    const cloned = await cloneSetup(item.id).unwrap()
    navigate(`/setups/${cloned.id}/edit`, { state: { prefetchedSetup: cloned } })
  }

  const handleBookmark = async () => {
    if (!item?.id) return
    if (item.is_bookmarked) await unbookmarkSetup(item.id).unwrap()
    else await bookmarkSetup(item.id).unwrap()
  }

  const handleLike = async () => {
    if (!item?.id || !profile) return
    if (item.is_liked) await unlikeSetup(item.id).unwrap()
    else await likeSetup(item.id).unwrap()
  }

  const handleFeatured = async () => {
    if (!item?.id) return
    await setSetupFeatured({ id: item.id, featured: !item.is_featured }).unwrap()
  }

  const handleAddContributor = async () => {
    if (!item?.id || !contributorNick.trim()) return
    await addContributor({ setupId: item.id, nickname: contributorNick.trim() }).unwrap()
    setContributorNick('')
  }

  const handleReport = async () => {
    if (!item?.id || !reportReason.trim()) return
    await createReport({ target_type: 'setup', target_id: item.id, reason: reportReason.trim() }).unwrap()
    setReportReason('')
    setReportOpen(false)
  }

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) return
    const collection = await createCollection({ name: collectionName.trim() }).unwrap()
    if (item?.id) await addToCollection({ collectionId: collection.id, setupId: item.id }).unwrap()
    setCollectionName('')
  }

  const handleShare = async () => {
    const url = window.location.href
    const shareData = { title: item?.name || 'Shishiguid', text: item?.description || item?.name || 'Shishiguid setup', url }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        setShareMessage('')
        return
      }
      await navigator.clipboard.writeText(url)
      setShareMessage('Ссылка скопирована.')
    } catch {
      setShareMessage('Не удалось поделиться ссылкой.')
    }
  }

  useEffect(() => {
    if (!shareMessage) return undefined
    const timeout = window.setTimeout(() => setShareMessage(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [shareMessage])

  if (isLoading) {
    return (
      <div tw="mx-auto grid w-full max-w-5xl gap-4">
        <Skeleton w="100%" h="420px" />
        <Skeleton w="100%" h="260px" />
        <Skeleton w="100%" h="360px" />
      </div>
    )
  }

  if (!item) {
    return (
      <div tw="flex flex-col items-center justify-center py-20 text-center">
        <div tw="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--color-surface-muted))]">
          <AlertIcon tw="text-[rgb(var(--color-text-subtle))]" />
        </div>
        <h2 tw="mb-1 text-[15px] font-semibold text-[rgb(var(--color-text))]">{t('common.notFound')}</h2>
        <p tw="mb-4 text-sm text-[rgb(var(--color-text-subtle))]">{t('setupDetail.notFoundHint')}</p>
        <Link to="/"><Button variant="secondary">{t('common.backToFeed')}</Button></Link>
      </div>
    )
  }

  return (
    <>
      <div tw="relative mx-auto w-full max-w-5xl">
        <div tw="flex min-w-0 flex-col gap-4">
          <nav tw="flex min-w-0 items-center gap-1.5 text-[12px] font-bold text-[rgb(var(--color-text-subtle))]">
            <Link to="/" tw="hover:text-[rgb(var(--color-text))]">Лента</Link>
            <span>/</span>
            <span tw="truncate text-[rgb(var(--color-text-muted))]">{item.name}</span>
          </nav>

      <Card>
        <div tw="grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(430px,480px)]">
          <div tw="relative h-[220px] bg-[rgb(var(--color-surface-muted))] sm:h-[260px] lg:h-auto lg:min-h-[340px]">
            <MixBowlPreview
              bowlModel={bowlModel}
              kind={kind}
              items={mixItems}
              style={{ width: '100%', height: '100%' }}
            />
            <TobaccoPhotoStack items={mixItems} variant="detail" />
          </div>

          <div tw="flex flex-col border-t border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-4 lg:border-l lg:border-t-0">
            <Label>{t('setupDetail.setup')}</Label>
            <h1 tw="mt-1 text-[24px] font-semibold leading-tight text-[rgb(var(--color-text))]">{item.name}</h1>
            <div tw="mt-2">
              <AuthorChip author={item.creator} />
            </div>
            {item.is_featured && (
              <span tw="mt-3 inline-flex w-fit rounded-lg bg-[rgb(var(--color-accent))] px-2.5 py-1 text-[11px] font-black text-white">
                В подборке
              </span>
            )}
            {item.tags?.length > 0 && (
              <div tw="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((tag: string) => (
                  <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-black text-[rgb(var(--color-text-subtle))] hover:bg-[rgb(var(--color-accent-muted))]">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            <div tw="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2.5 py-1.5 text-[12px] font-black text-[rgb(var(--color-text-muted))]">
              <EyeIcon size={14} />
              <span tw="tabular-nums">{Number(item.views_count || 0)}</span>
              <span tw="font-semibold text-[rgb(var(--color-text-subtle))]">{t('setupDetail.views')}</span>
            </div>
            <div tw="mt-2 flex flex-wrap gap-2">
              <span tw="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2.5 py-1.5 text-[12px] font-black text-[rgb(var(--color-text-muted))]">
                <HeartIcon size={14} />
                <span tw="tabular-nums">{Number(item.likes_count || 0)}</span>
              </span>
              <span tw="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2.5 py-1.5 text-[12px] font-black text-[rgb(var(--color-text-muted))]">
                <CommentIcon size={14} />
                <span tw="tabular-nums">{Number(item.comments_count || 0)}</span>
              </span>
              <span tw="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2.5 py-1.5 text-[12px] font-black text-[rgb(var(--color-text-muted))]">
                <CatalogIcon name="setupType" size={14} />
                <span tw="tabular-nums">{Number(item.clones_count || 0)}</span>
                <span tw="font-semibold text-[rgb(var(--color-text-subtle))]">клонов</span>
              </span>
            </div>
            {profile && (
              <div tw="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={item.is_liked ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={handleLike}
                  disabled={liking || unliking}
                >
                  <HeartIcon />
                  {item.is_liked ? 'Нравится' : 'Лайк'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={bookmarking || unbookmarking}
                >
                  {item.is_bookmarked ? 'В избранном' : 'В избранное'}
                </Button>
                {!canManageSetup && (
                  <Button type="button" variant="outline" size="sm" onClick={handleClone} disabled={cloning}>
                    {cloning ? t('common.saving') : 'Копировать'}
                  </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => setReportOpen(true)}>
                  Пожаловаться
                </Button>
              </div>
            )}
            {profile && (
              <div tw="mt-3 grid gap-2 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3">
                <Label>Коллекции</Label>
                <div tw="flex flex-wrap gap-2">
                  {collections.map((collection: any) => (
                    <Button
                      key={collection.id}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => addToCollection({ collectionId: collection.id, setupId: item.id })}
                      disabled={addingToCollection || collection.setup_ids?.includes(item.id)}
                    >
                      {collection.name}
                    </Button>
                  ))}
                </div>
                <div tw="flex gap-2">
                  <input
                    value={collectionName}
                    onChange={(event) => setCollectionName(event.target.value)}
                    placeholder="Новая коллекция"
                    tw="h-9 min-w-0 flex-1 rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 text-[12px] font-semibold outline-none"
                  />
                  <Button type="button" size="sm" onClick={handleCreateCollection} disabled={creatingCollection || addingToCollection || !collectionName.trim()}>
                    Создать
                  </Button>
                </div>
              </div>
            )}
            <div tw="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={handleShare}>
                <ShareIcon />
                Поделиться
              </Button>
            </div>
            {shareMessage && <p tw="mt-2 text-[12px] font-medium text-[rgb(var(--color-text-subtle))]">{shareMessage}</p>}
            {canManageSetup && (
              <div tw="mt-3 flex flex-wrap gap-2">
                {isAdmin && (
                  <Button type="button" variant="outline" size="sm" onClick={handleFeatured} disabled={featuring}>
                    {item.is_featured ? 'Убрать из подборки' : 'В подборку'}
                  </Button>
                )}
                <Link to={`/setups/${item.id}/edit`}>
                  <Button variant="secondary" size="sm">{t('setupDetail.editSetup')}</Button>
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setDeleteError('')
                    setDeleteOpen(true)
                  }}
                >
                  {t('setupDetail.deleteSetup')}
                </Button>
              </div>
            )}
            {canManageSetup && (
              <div tw="mt-3 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3">
                <Label>Соавторы</Label>
                {item.contributors?.length > 0 && (
                  <div tw="mt-2 flex flex-wrap gap-2">
                    {item.contributors.map((contributor: any) => (
                      <button
                        key={contributor.id}
                        type="button"
                        onClick={() => removeContributor({ setupId: item.id, userId: contributor.id })}
                        tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))]"
                      >
                        {contributor.display_name || contributor.nickname} ×
                      </button>
                    ))}
                  </div>
                )}
                <div tw="mt-2 flex gap-2">
                  <input
                    value={contributorNick}
                    onChange={(event) => setContributorNick(event.target.value)}
                    placeholder="Никнейм соавтора"
                    tw="h-9 min-w-0 flex-1 rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 text-[12px] font-semibold outline-none"
                  />
                  <Button type="button" size="sm" onClick={handleAddContributor} disabled={addingContributor || !contributorNick.trim()}>
                    Добавить
                  </Button>
                </div>
              </div>
            )}
            {item.description && (
              <p tw="mt-3 line-clamp-3 text-[13px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]">{item.description}</p>
            )}

            {item.photo_urls?.length > 0 && (
              <div tw="mt-4 grid grid-cols-3 gap-2">
                {item.photo_urls.slice(0, 6).map((url: string, index: number) => (
                  <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" tw="block overflow-hidden rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))]">
                    <img
                      src={url}
                      alt=""
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      tw="aspect-square h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}

            <div tw="mt-4">
              <CostSummary cost={setupCost} />
            </div>

            <div tw="mt-3">
              <CompactSetupSummary kind={kind} typeName={typeName} heaviness={heaviness} />
            </div>
          </div>
        </div>
      </Card>

      <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-4 sm:p-5">
        <StepHeader
          number={1}
          title={t('setupDetail.prepareEquipment')}
          caption={t('setupDetail.prepareEquipmentHint')}
        />
        <div tw="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <EquipmentCard item={bowl} icon="bowl" label={t('setupDetail.bowl')} loading={shouldShowEquipmentSkeleton} />
          <EquipmentCard item={kaloud} icon="kaloud" label={t('setupDetail.kaloud')} loading={shouldShowEquipmentSkeleton} />
          <EquipmentCard item={coal} icon="coal" label={t('setupDetail.coal')} loading={shouldShowEquipmentSkeleton} />
          <EquipmentCard item={placement} icon="placement" label={t('setupDetail.coalPlacement')} loading={shouldShowEquipmentSkeleton} />
        </div>
      </section>

      <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-4 sm:p-5">
        <StepHeader
          number={2}
          title={t('setupDetail.measureTobaccos')}
          caption={t('setupDetail.measureTobaccosHint')}
        />
        <MixRatioBar items={mixItems} />
        <div tw="mt-4 grid gap-3 sm:grid-cols-2">
          {mixItems.map((mix, index) => (
            <TobaccoMeasureCard key={mix.id} count={mixItems.length} kind={kind} mix={mix} index={index} />
          ))}
        </div>
      </section>

      <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-4 sm:p-5">
        <StepHeader
          number={3}
          title={t('setupDetail.packBowl')}
          caption={t('setupDetail.packBowlHint')}
        />
        <div tw="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-center">
          <div tw="overflow-hidden rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))]">
            <MixBowlPreview
              bowlModel={bowlModel}
              cameraPosition={[0, 2.08, 3.85]}
              fov={43}
              kind={kind}
              items={mixItems}
              sceneScale={1.08}
              style={{ aspectRatio: 'auto', height: 400 }}
            />
          </div>
          <div tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-4">
            <Label>{typeName}</Label>
            <p tw="mt-2 text-[15px] font-semibold leading-relaxed text-[rgb(var(--color-text))]">{t(`setupDetail.packInstructions.${kind}`)}</p>
            <div tw="mt-4 grid gap-2">
              {mixItems.map((mix, index) => (
                <div key={mix.id} tw="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-2 text-[12px] font-semibold text-[rgb(var(--color-text-muted))]">
                  <span tw="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: mix.color }} />
                  <span tw="truncate">
                    {kind === 'layers' ? `${index + 1}. ${mix.name}` : `${mix.name} · ${mix.percentage}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-4 sm:p-5">
        <StepHeader
          number={4}
          title={t('setupDetail.heatAndCoals')}
          caption={t('setupDetail.heatAndCoalsHint')}
        />
        <div tw="grid gap-4 lg:grid-cols-3">
          <EquipmentCard item={kaloud} icon="kaloud" label={t('setupDetail.kaloud')} loading={shouldShowEquipmentSkeleton} />
          <EquipmentCard item={coal} icon="coal" label={t('setupDetail.coal')} loading={shouldShowEquipmentSkeleton} />
          <EquipmentCard item={placement} icon="placement" label={t('setupDetail.coalPlacement')} loading={shouldShowEquipmentSkeleton} />
        </div>
      </section>

      <SetupReviews setupId={item.id} setupCreatorId={item.creator_id || item.creator?.id} />
      <SetupComments setupId={item.id} />
      <VersionHistory current={item} setupId={item.id} />
      <SimilarSetups currentId={item.id} tobaccoIds={tobaccoIds} />

        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('setupDetail.deleteTitle')}>
        <div tw="grid gap-4">
          <div>
            <p tw="text-sm font-semibold text-[rgb(var(--color-text))]">{item.name}</p>
            <p tw="mt-1 text-sm text-[rgb(var(--color-text-muted))]">{t('setupDetail.deleteWarning')}</p>
          </div>
          {deleteError && (
            <p tw="rounded-lg border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-surface))] px-3 py-2 text-[13px] font-medium text-[rgb(var(--color-danger))]">
              {deleteError}
            </p>
          )}
          <div tw="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? t('common.saving') : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Пожаловаться">
        <div tw="grid gap-3">
          <Textarea
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            placeholder="Что не так с этой забивкой?"
            rows={4}
            maxLength={1000}
          />
          <div tw="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setReportOpen(false)} disabled={reporting}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="danger" onClick={handleReport} disabled={reporting || reportReason.trim().length < 3}>
              {reporting ? t('common.saving') : 'Отправить'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
