import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  useCreateSetupReviewMutation,
  useGetBowlSetupTypesQuery,
  useGetBowlsQuery,
  useGetCoalPlacementsQuery,
  useGetCoalsQuery,
  useGetKaloudsQuery,
  useGetProfileQuery,
  useGetSetupReviewsQuery,
  useGetSetupQuery,
  useGetTobaccosQuery,
  useDeleteSetupMutation,
  useRecordSetupViewMutation,
  useUpdateSetupReviewMutation,
} from '../shared/api'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { Textarea } from '../shared/ui/Input'
import { Modal } from '../shared/ui/Modal'
import { Skeleton } from '../shared/ui/Skeleton'
import { AlertIcon, BackIcon, CatalogIcon, EyeIcon, type CatalogIconName } from '../shared/ui/Icons'
import { MIX_COLORS, MixBowlPreview, detectBowlModel, detectSetupKind, type MixBowlItem } from '../shared/ui/MixBowlPreview'
import { AuthorChip } from '../shared/ui/AuthorChip'
import { getReviewAverage, type SetupReview } from '../shared/reviews'
import { getSetupHeaviness } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'
import { calculateSetupCost, formatMoney } from '../shared/setupCost'

const Label = tw.p`text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]`
const SectionTitle = tw.h2`text-[18px] font-semibold leading-tight text-[rgb(var(--color-text))]`
const MutedText = tw.p`text-[13px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]`

const getItem = (items: any[] | undefined, id: string | undefined) => (
  items?.find((item) => item.id === id)
)

const buildMixItems = (setup: any, tobaccos: any[] | undefined, fallbackName: (index: number) => string): MixBowlItem[] => (
  setup.tobaccos?.map((item: any, index: number) => {
    const tobacco = getItem(tobaccos, item.tobacco_id)

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
  return new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
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

  return (
    <div tw="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-inverse))] p-3 text-white shadow-[0_18px_36px_-30px_rgba(23,19,18,0.75)]">
      <div tw="flex items-start justify-between gap-2">
        <div>
          <Label tw="text-[rgb(var(--color-text-subtle))]">{t('setupDetail.costTitle')}</Label>
          <p tw="mt-1 text-[22px] font-black leading-none tabular-nums">
            {totalValue}
          </p>
        </div>
        <span tw="rounded-md bg-[rgb(var(--color-surface))]/10 px-2 py-1 text-[10px] font-bold text-white/85">
          {cost.isComplete ? t('setupDetail.costReady') : t('setupDetail.costNeedsData')}
        </span>
      </div>

      <div tw="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.1fr)] items-stretch gap-1.5">
        <div tw="min-w-0 rounded-lg border border-white/10 bg-[rgb(var(--color-surface))]/10 px-2 py-2">
          <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('setupDetail.tobaccoCost')}</p>
          <p tw="mt-0.5 truncate text-[12px] font-black tabular-nums">{tobaccoValue}</p>
        </div>
        <span tw="flex items-center justify-center text-[16px] font-black text-white/45">+</span>
        <div tw="min-w-0 rounded-lg border border-white/10 bg-[rgb(var(--color-surface))]/10 px-2 py-2">
          <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('setupDetail.coalCost')}</p>
          <p tw="mt-0.5 truncate text-[12px] font-black tabular-nums">{coalValue}</p>
        </div>
        <span tw="flex items-center justify-center text-[16px] font-black text-white/45">=</span>
        <div tw="min-w-0 rounded-lg bg-[rgb(var(--color-surface))] px-2 py-2 text-[rgb(var(--color-text))]">
          <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">{t('setupDetail.totalCost')}</p>
          <p tw="mt-0.5 truncate text-[12px] font-black tabular-nums">{totalValue}</p>
        </div>
      </div>

      <div tw="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-white/60">
        <div tw="truncate">
          {cost.tobaccoGrams ? t('setupDetail.gramsValue', { value: cost.tobaccoGrams.toFixed(1) }) : t('setupDetail.noGrams')}
        </div>
        <div tw="truncate text-right">
          {cost.coalCount ? t('setupDetail.coalCountValue', { count: cost.coalCount }) : t('setupDetail.noCoalCount')}
        </div>
      </div>
    </div>
  )
}

const CompactSetupSummary = ({ kind, typeName, heaviness }: { kind: ReturnType<typeof detectSetupKind>; typeName: string; heaviness: number }) => {
  const { t } = useTranslation()

  return (
    <div tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3">
      <div tw="flex items-center justify-between gap-3">
        <div tw="min-w-0">
          <Label>{t('setupDetail.mix')}</Label>
          <p tw="mt-1 truncate text-[13px] font-bold text-[rgb(var(--color-text))]">{t(`setupDetail.kind.${kind}`)}</p>
          <p tw="mt-0.5 truncate text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">{typeName}</p>
        </div>
        <div tw="shrink-0 text-right">
          <Label>{t('setupDetail.heaviness')}</Label>
          <p tw="mt-1 rounded-lg bg-[rgb(var(--color-surface-inverse))] px-2.5 py-1.5 text-[14px] font-black text-white tabular-nums">
            {heaviness.toFixed(1)}/10
          </p>
        </div>
      </div>
      <div tw="mt-3">
        <StrengthIndicator value={heaviness} compact />
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

const EquipmentCard = ({ item, icon, label }: { item: any; icon: CatalogIconName; label: string }) => {
  const { t } = useTranslation()

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

const RatingPill = ({ rating }: { rating: number }) => (
  <span
    tw="inline-flex min-w-[54px] items-baseline justify-center rounded-lg bg-[rgb(var(--color-surface-inverse))] px-2.5 py-1.5 text-[15px] font-black text-white tabular-nums"
  >
    {Number(rating).toFixed(1)}
    <span tw="ml-0.5 text-[9px] font-bold text-white/65">/10</span>
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
    <div tw="flex flex-wrap gap-1.5">
      {Array.from({ length: 10 }).map((_, index) => {
        const option = index + 1
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={disabled}
            css={[
              tw`h-8 w-8 rounded-lg border text-[12px] font-black tabular-nums transition-colors`,
              value === option
                ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))] text-white`
                : tw`border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-accent))]`,
              disabled && tw`cursor-not-allowed opacity-45`,
            ]}
          >
            {option}
          </button>
        )
      })}
    </div>
    <input
      min={1}
      max={10}
      type="range"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      disabled={disabled}
      tw="w-full accent-[rgb(var(--color-accent))]"
    />
  </div>
)

const SetupReviews = ({ setupId }: { setupId: string }) => {
  const { i18n, t } = useTranslation()
  const hasToken = typeof window !== 'undefined' && Boolean(window.localStorage.getItem('token'))
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const { data: reviews = [], isLoading } = useGetSetupReviewsQuery(setupId)
  const [createReview, { isLoading: saving }] = useCreateSetupReviewMutation()
  const [updateReview, { isLoading: updating }] = useUpdateSetupReviewMutation()
  const [rating, setRating] = useState(8)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const reviewFormRef = useRef<HTMLFormElement>(null)

  const average = getReviewAverage(reviews)
  const ownReview = profile ? reviews.find((review: SetupReview) => isReviewAuthor(review, profile)) : undefined
  const isSaving = saving || updating
  const formTitle = ownReview ? t('reviews.editTitle') : t('reviews.writeTitle')
  const formHint = profile
    ? ownReview
      ? t('reviews.ownHint')
      : t('reviews.authorHint', { name: profile.nickname || profile.email })
    : t('reviews.signInHint')

  useEffect(() => {
    setError('')
    if (ownReview) {
      setRating(Number(ownReview.rating || 8))
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const text = description.trim()
    if (text.length < 3) {
      setError(t('reviews.tooShort'))
      return
    }

    try {
      if (ownReview) {
        await updateReview({ setupId, reviewId: ownReview.id, rating, description: text }).unwrap()
      } else {
        await createReview({ setupId, rating, description: text }).unwrap()
        setDescription('')
        setRating(8)
      }
    } catch (requestError: any) {
      setError(requestError?.status === 409 ? t('reviews.duplicate') : t('reviews.saveFailed'))
    }
  }

  return (
    <section tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-4 sm:p-5">
      <div tw="flex flex-wrap items-start justify-between gap-3">
        <div tw="min-w-0">
          <Label>{t('reviews.titleLabel')}</Label>
          <SectionTitle tw="mt-1">{t('reviews.title')}</SectionTitle>
        </div>
        <div tw="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] px-3 py-2">
          <Label>{t('reviews.average')}</Label>
          <RatingPill rating={average} />
        </div>
      </div>

      <div tw="mt-4 grid gap-3">
        {isLoading && <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-4 text-[13px] font-medium text-[rgb(var(--color-text-muted))]">{t('reviews.loading')}</div>}
        {!isLoading && reviews.length === 0 && (
          <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] p-4 text-[13px] font-medium text-[rgb(var(--color-text-muted))]">
            {t('reviews.empty')}
          </div>
        )}
        {reviews.map((review: SetupReview) => {
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
                    <button
                      type="button"
                      onClick={focusReviewForm}
                      tw="mt-1 text-[11px] font-bold text-[rgb(var(--color-accent))] underline-offset-2 hover:underline"
                    >
                      {t('reviews.editReviewLink')}
                    </button>
                  )}
                </div>
              </div>
              <RatingPill rating={review.rating} />
            </div>
            <p tw="mt-3 whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]">{review.description}</p>
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
                disabled={!profile || isSaving}
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
              disabled={!profile || isSaving}
              onChange={(value) => setRating(Math.min(10, Math.max(1, value)))}
            />
          </div>
        </div>
        {error && <p tw="mt-3 rounded-lg border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-surface))] px-3 py-2 text-[13px] font-medium text-[rgb(var(--color-danger))]">{error}</p>}
        <div tw="mt-3 flex justify-end">
          <Button type="submit" disabled={!profile || isSaving}>
            {isSaving ? t('reviews.saving') : ownReview ? t('reviews.saveChanges') : t('reviews.save')}
          </Button>
        </div>
      </form>
    </section>
  )
}

export const SetupDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading } = useGetSetupQuery(id!)
  const hasToken = typeof window !== 'undefined' && Boolean(window.localStorage.getItem('token'))
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const [deleteSetup, { isLoading: deleting }] = useDeleteSetupMutation()
  const [recordSetupView] = useRecordSetupViewMutation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const { data: bowls } = useGetBowlsQuery()
  const { data: tobaccos } = useGetTobaccosQuery()
  const { data: coals } = useGetCoalsQuery()
  const { data: kalouds } = useGetKaloudsQuery()
  const { data: placements } = useGetCoalPlacementsQuery()
  const { data: types } = useGetBowlSetupTypesQuery()

  const bowl = getItem(bowls, item?.bowl_id)
  const kaloud = getItem(kalouds, item?.kaloud_id)
  const coal = getItem(coals, item?.coal_id)
  const placement = getItem(placements, item?.coal_placement_id)
  const setupType = getItem(types, item?.bowl_setup_type_id)
  const typeName = setupType?.name || 'Compot'
  const kind = detectSetupKind(typeName)
  const bowlModel = detectBowlModel(bowl)
  const mixItems = useMemo(() => (item ? buildMixItems(item, tobaccos, (index) => t('common.tobaccoFallback', { number: index + 1 })) : []), [item, t, tobaccos])
  const heaviness = useMemo(() => (item ? getSetupHeaviness(item, tobaccos) : 0), [item, tobaccos])
  const setupCost = useMemo(() => calculateSetupCost({
    bowl,
    coal,
    mix: item?.tobaccos,
    placement,
    tobaccos,
  }), [bowl, coal, item?.tobaccos, placement, tobaccos])
  const isAdmin = profile?.role === 'admin'
  const canManageSetup = isAdmin || isSetupAuthor(item, profile)

  useEffect(() => {
    if (!id) return
    recordSetupView(id).catch(() => undefined)
  }, [id, recordSetupView])

  const handleDelete = async () => {
    if (!item?.id) return
    setDeleteError('')

    try {
      await deleteSetup(item.id).unwrap()
      navigate('/')
    } catch {
      setDeleteError(t('setupDetail.deleteFailed'))
    }
  }

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
    <div tw="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <button
        onClick={() => navigate('/')}
        tw="flex w-fit items-center gap-1.5 text-[13px] font-medium text-[rgb(var(--color-text-muted))] transition-colors hover:text-[rgb(var(--color-text))]"
      >
        <BackIcon />
        {t('common.backToFeed')}
      </button>

      <Card>
        <div tw="grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(430px,480px)]">
          <div tw="relative h-[220px] bg-[rgb(var(--color-surface-muted))] sm:h-[260px] lg:h-auto lg:min-h-[340px]">
            <MixBowlPreview
              bowlModel={bowlModel}
              kind={kind}
              items={mixItems}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          <div tw="flex flex-col border-t border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-4 lg:border-l lg:border-t-0">
            <Label>{t('setupDetail.setup')}</Label>
            <h1 tw="mt-1 text-[24px] font-semibold leading-tight text-[rgb(var(--color-text))]">{item.name}</h1>
            <div tw="mt-2">
              <AuthorChip author={item.creator} />
            </div>
            <div tw="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2.5 py-1.5 text-[12px] font-black text-[rgb(var(--color-text-muted))]">
              <EyeIcon size={14} />
              <span tw="tabular-nums">{Number(item.views_count || 0)}</span>
              <span tw="font-semibold text-[rgb(var(--color-text-subtle))]">{t('setupDetail.views')}</span>
            </div>
            {item.description && (
              <p tw="mt-3 line-clamp-3 text-[13px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]">{item.description}</p>
            )}

            <div tw="mt-4">
              <CostSummary cost={setupCost} />
            </div>

            <div tw="mt-3">
              <CompactSetupSummary kind={kind} typeName={typeName} heaviness={heaviness} />
            </div>

            {canManageSetup && (
              <div tw="mt-auto flex flex-wrap gap-2 pt-4">
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
          <EquipmentCard item={bowl} icon="bowl" label={t('setupDetail.bowl')} />
          <EquipmentCard item={kaloud} icon="kaloud" label={t('setupDetail.kaloud')} />
          <EquipmentCard item={coal} icon="coal" label={t('setupDetail.coal')} />
          <EquipmentCard item={placement} icon="placement" label={t('setupDetail.coalPlacement')} />
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
          <EquipmentCard item={kaloud} icon="kaloud" label={t('setupDetail.kaloud')} />
          <EquipmentCard item={coal} icon="coal" label={t('setupDetail.coal')} />
          <EquipmentCard item={placement} icon="placement" label={t('setupDetail.coalPlacement')} />
        </div>
      </section>

      <SetupReviews setupId={item.id} />

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
    </div>
  )
}
