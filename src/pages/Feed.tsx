import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { useGetBowlSetupTypesQuery, useGetBowlsQuery, useGetSetupsQuery, useGetTobaccosQuery } from '../shared/api'
import { CardSkeleton } from '../shared/ui/Skeleton'
import { CatalogIcon, CloseIcon, EyeIcon, PlusIcon } from '../shared/ui/Icons'
import { MIX_COLORS, MixBowlPreview, detectBowlModel, detectSetupKind, type MixBowlItem } from '../shared/ui/MixBowlPreview'
import { AuthorChip } from '../shared/ui/AuthorChip'
import { getSetupHeaviness } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'

type SortValue = 'newest' | 'rating' | 'views' | 'strengthDesc' | 'strengthAsc' | 'name'
type StrengthFilter = 'all' | 'light' | 'medium' | 'strong' | 'heavy'

const SETUP_PAGE_SIZE = 12

const getName = (items: any[] | undefined, id: string | undefined, fallback = 'Tobacco') => (
  items?.find((item) => item.id === id)?.name || fallback
)

const getSetupAggregateRating = (setup: any) => {
  const value = setup.average_rating ?? setup.rating_average ?? setup.reviews_average ?? setup.rating
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

const getSetupRating = (setup: any) => getSetupAggregateRating(setup) ?? 0

const strengthOptions: StrengthFilter[] = ['all', 'light', 'medium', 'strong', 'heavy']

const sortOptions: SortValue[] = ['newest', 'rating', 'views', 'strengthDesc', 'strengthAsc', 'name']

const getSearchStrength = (value: string | null): StrengthFilter => (
  strengthOptions.includes(value as StrengthFilter) ? value as StrengthFilter : 'all'
)

const getSearchSort = (value: string | null): SortValue => (
  sortOptions.includes(value as SortValue) ? value as SortValue : 'newest'
)

const buildMixItems = (setup: any, tobaccos: any[] | undefined, fallbackName: (index: number) => string): MixBowlItem[] => (
  setup.tobaccos?.map((item: any, index: number) => ({
    id: item.tobacco_id || item.id || `${setup.id}-${index}`,
    name: getName(tobaccos, item.tobacco_id, fallbackName(index)),
    percentage: Number(item.percentage || 0),
    color: item.color || MIX_COLORS[index % MIX_COLORS.length],
  })) || []
)

const SetupCard = memo(({
  setup,
  bowl,
  tobaccos,
  typeName,
  rating,
  onOpen,
}: {
  setup: any
  bowl?: any
  tobaccos?: any[]
  typeName: string
  rating: number
  onOpen: (setupId: string) => void
}) => {
  const { t } = useTranslation()
  const mixItems = useMemo(
    () => buildMixItems(setup, tobaccos, (index) => t('common.tobaccoFallback', { number: index + 1 })),
    [setup, t, tobaccos],
  )
  const bowlModel = useMemo(() => detectBowlModel(bowl), [bowl])
  const kind = useMemo(() => detectSetupKind(typeName), [typeName])
  const topItems = useMemo(() => mixItems.slice(0, 2), [mixItems])
  const restCount = Math.max(0, mixItems.length - topItems.length)
  const heaviness = useMemo(() => getSetupHeaviness(setup, tobaccos), [setup, tobaccos])

  return (
    <Card variant="hover" onClick={() => onOpen(setup.id)} className="h-full">
      <div tw="flex h-full flex-col bg-[rgb(var(--color-surface))]">
        <div tw="relative border-b border-[rgb(var(--color-border))]">
          <MixBowlPreview
            autoRotate={false}
            bowlModel={bowlModel}
            interactive={false}
            kind={kind}
            items={mixItems}
            renderMode="snapshot"
            sceneScale={1.02}
          />
          <div tw="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md border border-white/75 bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[10px] font-bold text-[rgb(var(--color-text-muted))] shadow-[0_10px_24px_-18px_rgba(83,48,31,0.55)] backdrop-blur">
            <CatalogIcon name="placement" size={12} />
            {t(`feed.kind.${kind}`)}
          </div>
          <div tw="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-md border border-white/60 bg-[rgb(var(--color-surface-inverse))]/90 px-2 py-1.5 text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.75)] backdrop-blur">
            <span tw="text-[9px] font-bold uppercase tracking-wide text-white/65">{t('feed.rating')}</span>
            <span tw="text-[13px] font-black leading-none tabular-nums">{rating.toFixed(1)}</span>
          </div>
          <div tw="pointer-events-none absolute left-2.5 bottom-2.5 flex items-center gap-1 rounded-md border border-white/60 bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[11px] font-black text-[rgb(var(--color-text-muted))] shadow-[0_12px_26px_-20px_rgba(83,48,31,0.7)] backdrop-blur">
            <EyeIcon size={13} />
            <span tw="tabular-nums">{Number(setup.views_count || 0)}</span>
          </div>
        </div>

        <div tw="flex flex-1 flex-col gap-3 px-3.5 py-3.5">
          <div tw="min-w-0">
            <h3 tw="text-[13px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2 sm:text-sm">{setup.name}</h3>
            <div tw="mt-2">
              <AuthorChip author={setup.creator} compact />
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

          <div tw="mt-auto border-t border-[rgb(var(--color-border))] pt-3">
            <StrengthIndicator label={t('feed.strength')} value={heaviness} compact />
          </div>
        </div>
      </div>
    </Card>
  )
})

SetupCard.displayName = 'SetupCard'

export const Feed = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tobaccoSearch, setTobaccoSearch] = useState('')
  const [tobaccoPickerOpen, setTobaccoPickerOpen] = useState(false)
  const [loadedSetups, setLoadedSetups] = useState<any[]>([])
  const [pageOffset, setPageOffset] = useState(0)
  const [totalSetups, setTotalSetups] = useState(0)
  const [hasMoreSetups, setHasMoreSetups] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const sort = getSearchSort(searchParams.get('sort'))
  const selectedTobaccos = useMemo(() => searchParams.getAll('tobacco'), [searchParams])
  const selectedTobaccoKey = selectedTobaccos.join('\u0001')
  const strength = getSearchStrength(searchParams.get('strength'))
  const setupQueryParams = useMemo(() => ({
    limit: SETUP_PAGE_SIZE,
    offset: pageOffset,
    tobacco_ids: selectedTobaccos,
    strength,
    sort,
  }), [pageOffset, selectedTobaccoKey, selectedTobaccos, sort, strength])
  const {
    data: setupsPage,
    isError: isSetupsError,
    isFetching,
    isLoading,
    refetch: refetchSetups,
  } = useGetSetupsQuery(setupQueryParams)
  const { data: tobaccos } = useGetTobaccosQuery()
  const tobaccoPickerQueryParams = useMemo(() => ({
    search: tobaccoSearch.trim() || undefined,
    limit: tobaccoPickerOpen ? 18 : 8,
  }), [tobaccoPickerOpen, tobaccoSearch])
  const { data: pickerTobaccos = [] } = useGetTobaccosQuery(tobaccoPickerQueryParams)
  const { data: types } = useGetBowlSetupTypesQuery()
  const { data: bowls } = useGetBowlsQuery()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const openSetup = useCallback((setupId: string) => {
    navigate(`/setups/${setupId}`)
  }, [navigate])
  const visibleSetups = loadedSetups
  const canLoadMore = hasMoreSetups
  const bowlsById = useMemo(() => new Map<string, any>((bowls || []).map((bowl: any) => [bowl.id, bowl])), [bowls])
  const typesById = useMemo(() => new Map<string, any>((types || []).map((type: any) => [type.id, type])), [types])

  const updateSearch = useCallback((updater: (next: URLSearchParams) => void) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      updater(next)
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setSortFilter = (value: SortValue) => {
    updateSearch((next) => {
      if (value === 'newest') next.delete('sort')
      else next.set('sort', value)
    })
  }

  const setStrengthFilter = (value: StrengthFilter) => {
    updateSearch((next) => {
      if (value === 'all') next.delete('strength')
      else next.set('strength', value)
    })
  }

  const toggleTobaccoFilter = (id: string) => {
    updateSearch((next) => {
      const current = next.getAll('tobacco')
      next.delete('tobacco')
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
      updated.forEach((item) => next.append('tobacco', item))
    })
  }

  const removeTobaccoFilter = (id: string) => {
    updateSearch((next) => {
      const updated = next.getAll('tobacco').filter((item) => item !== id)
      next.delete('tobacco')
      updated.forEach((item) => next.append('tobacco', item))
    })
  }

  const resetFilters = () => {
    setTobaccoSearch('')
    updateSearch((next) => {
      next.delete('tobacco')
      next.delete('strength')
    })
  }

  useEffect(() => {
    setLoadedSetups([])
    setPageOffset(0)
    setTotalSetups(0)
    setHasMoreSetups(false)
  }, [selectedTobaccoKey, sort, strength])

  useEffect(() => {
    if (!setupsPage) return
    const page = Array.isArray(setupsPage)
      ? {
        items: setupsPage,
        total: setupsPage.length,
        offset: 0,
        has_more: false,
      }
      : setupsPage

    setTotalSetups(page.total)
    setHasMoreSetups(page.has_more)
    setLoadedSetups((current) => {
      if (page.offset === 0) return page.items
      const seen = new Set(current.map((setup) => setup.id))
      return [
        ...current,
        ...page.items.filter((setup) => !seen.has(setup.id)),
      ]
    })
  }, [setupsPage])

  useEffect(() => {
    if (!isSetupsError || loadedSetups.length) return undefined

    const timeout = window.setTimeout(() => {
      refetchSetups()
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [isSetupsError, loadedSetups.length, refetchSetups])

  useEffect(() => {
    if (!canLoadMore) return undefined
    if (isFetching) return undefined
    const node = loadMoreRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setPageOffset((current) => current + SETUP_PAGE_SIZE)
      },
      { rootMargin: '720px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [canLoadMore, isFetching])

  const activeFilterCount = selectedTobaccos.length
    + (strength !== 'all' ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0
  const strengthLabel = strength === 'all' ? '' : t(`metrics.heaviness.${strength}`)

  if (isLoading || (isSetupsError && !loadedSetups.length)) {
    return (
      <div tw="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((n) => <CardSkeleton key={n} />)}
      </div>
    )
  }

  if (!loadedSetups.length && !isFetching && !hasActiveFilters) {
    return (
      <div tw="flex flex-col items-center justify-center py-20 text-center">
        <div tw="w-20 h-20 bg-[rgb(var(--color-surface-muted))] rounded-3xl flex items-center justify-center mb-6">
          <CatalogIcon name="feed" size={34} tw="text-[rgb(var(--color-text-subtle))]" />
        </div>
        <h2 tw="text-lg font-semibold text-[rgb(var(--color-text))] mb-1.5">{t('feed.noSetups')}</h2>
        <p tw="text-sm text-[rgb(var(--color-text-subtle))] mb-6 w-full max-w-xs px-2">
          {t('feed.noSetupsHint')}
        </p>
        <Link to="/setups/create">
          <Button variant="primary" size="lg">
            <PlusIcon />
            {t('feed.createSetup')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div tw="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div tw="min-w-0">
          <h1 tw="text-xl font-semibold text-[rgb(var(--color-text))]">{t('feed.title')}</h1>
          <p tw="text-sm text-[rgb(var(--color-text-subtle))] mt-0.5">{t('feed.subtitle')}</p>
        </div>
        <div tw="inline-flex w-fit items-center gap-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 py-2 text-[12px] font-bold text-[rgb(var(--color-text-muted))]">
          <CatalogIcon name="feed" size={14} />
          <span tw="tabular-nums">{t('feed.controls.count', { shown: visibleSetups.length, total: totalSetups })}</span>
        </div>
      </div>

      <div tw="sticky top-0 z-10 -mx-2 mb-5 border-y border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))]/95 px-2 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-lg sm:border sm:bg-[rgb(var(--color-surface))] sm:p-3 sm:shadow-[0_18px_42px_-36px_rgba(83,48,31,0.45)]">
        <div tw="grid grid-cols-1 gap-2 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
          <label tw="relative block min-w-0">
            <span tw="sr-only">{t('feed.controls.showFirst')}</span>
            <select
              value={sort}
              onChange={(event) => setSortFilter(event.target.value as SortValue)}
              tw="h-[42px] w-full appearance-none rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 pr-8 text-[13px] font-bold text-[rgb(var(--color-text))] outline-none transition-all focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)]"
            >
              <option value="newest">{t('feed.sort.newest')}</option>
              <option value="rating">{t('feed.sort.rating')}</option>
              <option value="views">{t('feed.sort.views')}</option>
              <option value="strengthDesc">{t('feed.sort.strengthDesc')}</option>
              <option value="strengthAsc">{t('feed.sort.strengthAsc')}</option>
              <option value="name">{t('feed.sort.name')}</option>
            </select>
            <span tw="pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-[rgb(var(--color-accent))]" />
          </label>

          <div tw="flex gap-1 overflow-x-auto rounded-lg bg-[rgb(var(--color-surface-subtle))] p-1">
            {strengthOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStrengthFilter(option)}
                tw="h-[34px] shrink-0 rounded-md px-3 text-[12px] font-bold transition-all"
                css={strength === option ? { backgroundColor: 'rgb(var(--color-surface-inverse))', color: 'rgb(var(--color-text-inverse))', boxShadow: '0 12px 22px -18px rgba(0,0,0,0.75)' } : { color: 'rgb(var(--color-text-muted))' }}
              >
                {option === 'all' ? t('feed.filters.allStrength') : t(`metrics.heaviness.${option}`)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setTobaccoPickerOpen((open) => !open)}
            aria-expanded={tobaccoPickerOpen}
            tw="flex h-[42px] items-center justify-between gap-2 rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 text-[13px] font-bold text-[rgb(var(--color-text))] transition-all hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] lg:min-w-[168px]"
          >
            <span tw="inline-flex items-center gap-1.5">
              <CatalogIcon name="tobacco" size={14} />
              {t('feed.filters.tobaccos')}
            </span>
            <span tw="rounded-md bg-[rgb(var(--color-surface-subtle))] px-1.5 py-0.5 text-[11px] text-[rgb(var(--color-text-muted))] tabular-nums">
              {selectedTobaccos.length || t('feed.controls.off')}
            </span>
          </button>
        </div>

        {hasActiveFilters && (
          <div tw="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[rgb(var(--color-border))] pt-2">
            {selectedTobaccos.map((id) => {
              const name = tobaccos?.find((tobacco: any) => tobacco.id === id)?.name || t('common.unknown')
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeTobaccoFilter(id)}
                  tw="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[rgb(var(--color-surface-inverse))] px-2.5 py-1.5 text-[11px] font-bold text-white"
                >
                  <span tw="min-w-0 truncate">{name}</span>
                  <CloseIcon size={10} />
                </button>
              )
            })}
            {strength !== 'all' && (
              <button
                type="button"
                onClick={() => setStrengthFilter('all')}
                tw="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[rgb(var(--color-accent))] px-2.5 py-1.5 text-[11px] font-bold text-white"
              >
                <span tw="min-w-0 truncate">{strengthLabel}</span>
                <CloseIcon size={10} />
              </button>
            )}
            <button
              type="button"
              onClick={resetFilters}
              tw="rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-2.5 py-1.5 text-[11px] font-bold text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-accent-muted))]"
            >
              {t('feed.controls.reset')}
            </button>
          </div>
        )}

        <div
          tw="overflow-hidden transition-all duration-200 ease-out"
          css={{
            maxHeight: tobaccoPickerOpen ? 520 : 0,
            opacity: tobaccoPickerOpen ? 1 : 0,
            transform: tobaccoPickerOpen ? 'translateY(0)' : 'translateY(-6px)',
            pointerEvents: tobaccoPickerOpen ? 'auto' : 'none',
          }}
        >
          <div tw="mt-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-raised))] p-3">
            <div tw="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div tw="min-w-0">
                <div tw="text-[12px] font-black text-[rgb(var(--color-text))]">{t('feed.filters.chooseTobaccos')}</div>
                <div tw="mt-0.5 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">
                  {selectedTobaccos.length
                    ? t('feed.filters.tobaccoSelected', { count: selectedTobaccos.length })
                    : t('feed.filters.tobaccosHint')}
                </div>
              </div>
              <div tw="relative min-w-0 sm:w-[280px]">
                <CatalogIcon name="tobacco" size={14} tw="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-subtle))]" />
                <input
                  value={tobaccoSearch}
                  onChange={(event) => setTobaccoSearch(event.target.value)}
                  placeholder={t('feed.filters.searchTobacco')}
                  tw="h-[40px] w-full rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] pl-9 pr-9 text-[13px] font-semibold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)]"
                />
                {tobaccoSearch && (
                  <button
                    type="button"
                    onClick={() => setTobaccoSearch('')}
                    tw="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[rgb(var(--color-text-subtle))] hover:bg-[rgb(var(--color-surface-muted))] hover:text-[rgb(var(--color-text))]"
                    aria-label={t('feed.controls.clearSearch')}
                  >
                    <CloseIcon size={11} />
                  </button>
                )}
              </div>
            </div>

            <div tw="grid max-h-[336px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {pickerTobaccos.map((tobacco: any) => {
                const active = selectedTobaccos.includes(tobacco.id)
                const photo = tobacco.photo_urls?.[0]
                return (
                  <button
                    key={tobacco.id}
                    type="button"
                    onClick={() => toggleTobaccoFilter(tobacco.id)}
                    className="group"
                    tw="overflow-hidden rounded-lg border bg-[rgb(var(--color-surface))] text-left transition-all"
                    css={active ? { borderColor: 'rgb(var(--color-surface-inverse))', boxShadow: '0 14px 28px -22px rgba(0,0,0,0.9)' } : { borderColor: 'rgb(var(--color-border))' }}
                  >
                    <div tw="relative aspect-square overflow-hidden bg-[rgb(var(--color-surface-muted))]">
                      {photo ? (
                        <img src={photo} alt={tobacco.name} tw="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                      ) : (
                        <div tw="flex h-full w-full items-center justify-center text-[rgb(var(--color-text-subtle))]">
                          <CatalogIcon name="tobacco" size={28} />
                        </div>
                      )}
                      <div tw="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(23,19,18,0.28))]" />
                      {active && (
                        <span tw="absolute right-2 top-2 rounded-md bg-[rgb(var(--color-surface-inverse))] px-2 py-1 text-[10px] font-black text-white">
                          {t('feed.filters.selected')}
                        </span>
                      )}
                    </div>
                    <div tw="px-2.5 py-2">
                      <div tw="truncate text-[12px] font-black text-[rgb(var(--color-text))]">{tobacco.name}</div>
                    </div>
                  </button>
                )
              })}
              {!pickerTobaccos.length && (
                <div tw="col-span-full rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 py-6 text-center text-[12px] font-semibold text-[rgb(var(--color-text-subtle))]">
                  {t('common.noOptions')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!visibleSetups.length && (
        <div tw="mb-5 rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] px-4 py-8 text-center">
          <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">{t('feed.filters.empty')}</h2>
          <p tw="mt-1 text-sm text-[rgb(var(--color-text-subtle))]">{t('feed.filters.emptyHint')}</p>
          <button type="button" onClick={resetFilters} tw="mt-4 rounded-lg bg-[rgb(var(--color-surface-inverse))] px-4 py-2 text-[13px] font-bold text-white">
            {t('feed.controls.reset')}
          </button>
        </div>
      )}

      <div tw="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSetups.map((setup) => (
          <SetupCard
            key={setup.id}
            setup={setup}
            bowl={bowlsById.get(setup.bowl_id)}
            tobaccos={tobaccos}
            typeName={typesById.get(setup.bowl_setup_type_id)?.name || ''}
            rating={getSetupRating(setup)}
            onOpen={openSetup}
          />
        ))}
      </div>

      {canLoadMore && (
        <div ref={loadMoreRef} tw="h-16" aria-hidden="true" />
      )}
    </div>
  )
}
