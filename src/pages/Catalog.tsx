import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { Modal } from '../shared/ui/Modal'
import { Skeleton } from '../shared/ui/Skeleton'
import { useGetProfileQuery, useGetSetupsQuery } from '../shared/api'
import { CatalogIcon, type CatalogIconName, EditIcon, EmptyIcon, PlusIcon, TrashIcon } from '../shared/ui/Icons'
import { getTobaccoStrength } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'
import { hasAuthToken } from '../shared/authToken'
import { getTobaccoRatingMap } from '../shared/tobaccoRatings'
import { SafeImage } from '../shared/ui/SafeImage'

type CatalogItemKind = 'default' | 'bowl' | 'tobacco' | 'coal' | 'kaloud' | 'placement' | 'setupType'
type StrengthFilter = 'all' | 'light' | 'medium' | 'strong' | 'heavy'

interface CatalogProps {
  title: string
  listHook: (params?: any) => any
  deleteHook: () => any
  onCreatePath: string
  onEditPath: (id: string) => string
  itemKind?: CatalogItemKind
}

const strengthOptions: StrengthFilter[] = ['all', 'light', 'medium', 'strong', 'heavy']

const getSearchStrength = (value: string | null): StrengthFilter => (
  strengthOptions.includes(value as StrengthFilter) ? value as StrengthFilter : 'all'
)

const GridSkeleton = () => (
  <div tw="bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border-muted))] shadow-sm overflow-hidden">
    <div tw="aspect-square">
      <Skeleton w="100%" h="100%" />
    </div>
    <div tw="p-3.5">
      <Skeleton w="70%" h="16px" />
    </div>
  </div>
)

const formatPrice = (value: unknown, currency?: string) => (
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString()} ${currency === 'UAH' || !currency ? 'грн' : currency}`
    : null
)

const iconByKind: Record<CatalogItemKind, CatalogIconName> = {
  default: 'feed',
  bowl: 'bowl',
  tobacco: 'tobacco',
  coal: 'coal',
  kaloud: 'kaloud',
  placement: 'placement',
  setupType: 'setupType',
}

const CatalogImageFallback = ({ itemKind }: { itemKind: CatalogItemKind }) => (
  <div tw="flex h-full w-full items-center justify-center">
    <div tw="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.82),transparent_40%),linear-gradient(180deg,rgba(255,248,241,0.72),rgba(229,218,207,0.42))]" />
    <div tw="relative flex h-16 w-16 items-center justify-center rounded-xl border border-white/70 bg-[rgb(var(--color-surface))]/70 text-[rgb(var(--color-accent))] shadow-[0_18px_42px_-28px_rgba(83,48,31,0.7)]">
      <CatalogIcon name={iconByKind[itemKind]} size={34} />
    </div>
  </div>
)

const pickFirst = (item: any, keys: string[]) => {
  const key = keys.find((entry) => item?.[entry] !== undefined && item?.[entry] !== null && item?.[entry] !== '')
  return key ? item[key] : undefined
}

const formatFactValue = (value: unknown) => {
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(1)
  return typeof value === 'string' ? value : null
}

const getCatalogFacts = (item: any, itemKind: CatalogItemKind, t: any) => {
  const facts: Array<{ label: string; value: string }> = []
  const pushFact = (labelKey: string, value: unknown, suffix = '') => {
    const formatted = formatFactValue(value)
    if (!formatted) return
    facts.push({ label: t(labelKey), value: `${formatted}${suffix}` })
  }

  if (itemKind === 'tobacco') {
    pushFact('catalog.factBrand', pickFirst(item, ['brand', 'manufacturer']))
    pushFact('catalog.factFlavor', pickFirst(item, ['flavor', 'taste', 'line']))
  }

  return facts.slice(0, 2)
}

const formatCoalPackageLine = (item: any, t: any) => (
  typeof item?.coals_per_package === 'number' && Number.isFinite(item.coals_per_package)
    ? `${t('catalog.factCoalsPerPackage')} ${item.coals_per_package} ${t('catalog.coalPieces')}`
    : null
)

const formatBowlCapacityLine = (item: any, t: any) => (
  typeof item?.capacity_grams === 'number' && Number.isFinite(item.capacity_grams)
    ? `${t('catalog.factCapacityGrams')} ${t('detail.capacityGramsValue', { count: item.capacity_grams })}`
    : null
)

const formatTobaccoPackageLine = (item: any, t: any) => (
  typeof item?.package_grams === 'number' && Number.isFinite(item.package_grams)
    ? `${t('catalog.factPackageGrams')} ${t('detail.packageGramsValue', { count: item.package_grams })}`
    : null
)

const formatRatingLine = (rating: number | undefined, t: any) => (
  typeof rating === 'number' && Number.isFinite(rating)
    ? `${t('catalog.factRating')} ${rating.toFixed(1)}`
    : null
)

const getHeroMetric = (item: any, itemKind: CatalogItemKind, t: any) => {
  if (itemKind === 'bowl') return formatBowlCapacityLine(item, t)
  if (itemKind === 'tobacco') return formatTobaccoPackageLine(item, t)
  if (itemKind === 'coal') return formatCoalPackageLine(item, t)
  if (itemKind === 'placement') {
    return typeof item?.coal_count === 'number' && Number.isFinite(item.coal_count)
      ? `${item.coal_count} ${t('catalog.coalPieces')}`
      : null
  }
  if (itemKind === 'kaloud' || itemKind === 'setupType') return null
  return formatPrice(item.price, item.price_currency)
}

export const Catalog = ({
  title, listHook, deleteHook, onCreatePath, onEditPath, itemKind = 'default',
}: CatalogProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const strength = getSearchStrength(searchParams.get('strength'))
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const tobaccoQueryParams = itemKind === 'tobacco' ? {
    min_price: minPrice || undefined,
    max_price: maxPrice || undefined,
    strength,
  } : undefined
  const { data, isLoading } = listHook(tobaccoQueryParams)
  const { data: setupsForRatings } = useGetSetupsQuery(
    itemKind === 'tobacco' ? { limit: 50, sort: 'rating' } : undefined,
    { skip: itemKind !== 'tobacco' },
  )
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasAuthToken() })
  const [deleteItem, { isLoading: deleting }] = deleteHook()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAdmin = profile?.role === 'admin'
  const hasActiveFilters = strength !== 'all' || minPrice.trim() !== '' || maxPrice.trim() !== ''
  const showTobaccoFilters = itemKind === 'tobacco' && (Boolean(data?.length) || hasActiveFilters)
  const tobaccoRatings = useMemo(() => getTobaccoRatingMap(setupsForRatings), [setupsForRatings])

  const updateSearch = useCallback((updater: (next: URLSearchParams) => void) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      updater(next)
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setStrengthFilter = (value: StrengthFilter) => {
    updateSearch((next) => {
      if (value === 'all') next.delete('strength')
      else next.set('strength', value)
    })
  }

  const setPriceFilter = (key: 'minPrice' | 'maxPrice', value: string) => {
    updateSearch((next) => {
      if (value.trim() === '') next.delete(key)
      else next.set(key, value)
    })
  }

  const resetFilters = () => {
    updateSearch((next) => {
      next.delete('strength')
      next.delete('minPrice')
      next.delete('maxPrice')
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    try {
      await deleteItem(deleteTarget.id).unwrap()
      setDeleteTarget(null)
    } catch {
      // The API layer owns the exact error shape; keep the dialog open so the admin can retry.
    }
  }

  return (
    <div>
      <div tw="flex items-center justify-between mb-6">
        <div>
          <h1 tw="text-xl font-semibold text-[rgb(var(--color-text))]">{title}</h1>
          <p tw="text-sm text-[rgb(var(--color-text-subtle))] mt-0.5">
            {data?.length
              ? showTobaccoFilters
                ? t('catalog.filterCount', { shown: data.length, total: data.length })
                : t('catalog.count', { count: data.length })
              : t('common.browseItems')}
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => navigate(onCreatePath)}>
            <PlusIcon />
            {t('common.create')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div tw="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => <GridSkeleton key={n} />)}
        </div>
      ) : !data?.length && !showTobaccoFilters ? (
        <div tw="flex flex-col items-center justify-center py-20 text-center">
          <div tw="w-16 h-16 bg-[rgb(var(--color-surface-muted))] rounded-2xl flex items-center justify-center mb-5">
            <EmptyIcon tw="text-[rgb(var(--color-text-subtle))]" />
          </div>
          <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))] mb-1">{t('common.noItemsYet')}</h2>
          <p tw="text-sm text-[rgb(var(--color-text-subtle))]">{t('catalog.createFirst')}</p>
        </div>
      ) : (
        <>
          {showTobaccoFilters && (
            <div tw="-mx-2 mb-5 border-y border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))]/95 px-2 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:bg-[rgb(var(--color-surface))] sm:p-3 sm:shadow-[0_18px_42px_-36px_rgba(83,48,31,0.45)] lg:sticky lg:top-[var(--sticky-filter-top)] lg:z-30">
              <div tw="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_240px_auto]">
                <div tw="flex gap-1 overflow-x-auto rounded-lg bg-[rgb(var(--color-surface-subtle))] p-1">
                  {strengthOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStrengthFilter(option)}
                      tw="h-[34px] shrink-0 rounded-md px-3 text-[12px] font-bold transition-all"
                      css={strength === option ? { backgroundColor: 'rgb(var(--color-surface-inverse))', color: 'rgb(var(--color-text-inverse))', boxShadow: '0 12px 22px -18px rgba(0,0,0,0.75)' } : { color: 'rgb(var(--color-text-muted))' }}
                    >
                      {option === 'all' ? t('catalog.filters.allStrength') : t(`metrics.heaviness.${option}`)}
                    </button>
                  ))}
                </div>

                <div tw="grid grid-cols-2 gap-2">
                  <label tw="min-w-0">
                    <span tw="sr-only">{t('catalog.filters.minPrice')}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={minPrice}
                      onChange={(event) => setPriceFilter('minPrice', event.target.value)}
                      placeholder={t('catalog.filters.minPrice')}
                      tw="h-[42px] w-full rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 text-[13px] font-bold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)]"
                    />
                  </label>
                  <label tw="min-w-0">
                    <span tw="sr-only">{t('catalog.filters.maxPrice')}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={maxPrice}
                      onChange={(event) => setPriceFilter('maxPrice', event.target.value)}
                      placeholder={t('catalog.filters.maxPrice')}
                      tw="h-[42px] w-full rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 text-[13px] font-bold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)]"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  tw="h-[42px] rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 text-[13px] font-bold text-[rgb(var(--color-text-muted))] transition-all hover:bg-[rgb(var(--color-accent-muted))] disabled:cursor-default disabled:opacity-45 disabled:hover:bg-[rgb(var(--color-surface))]"
                >
                  {t('feed.controls.reset')}
                </button>
              </div>
            </div>
          )}

          {!data?.length && showTobaccoFilters ? (
            <div tw="mb-5 rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] px-4 py-8 text-center">
              <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">{t('catalog.filters.empty')}</h2>
              <p tw="mt-1 text-sm text-[rgb(var(--color-text-subtle))]">{t('catalog.filters.emptyHint')}</p>
              <button type="button" onClick={resetFilters} tw="mt-4 rounded-lg bg-[rgb(var(--color-surface-inverse))] px-4 py-2 text-[13px] font-bold text-white">
                {t('feed.controls.reset')}
              </button>
            </div>
          ) : (
            <div tw="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(data || []).map((item: any) => {
                const facts = getCatalogFacts(item, itemKind, t)
                const tobaccoRating = itemKind === 'tobacco' ? tobaccoRatings.get(item.id) : undefined
                const heroMetric = itemKind === 'tobacco'
                  ? formatRatingLine(tobaccoRating, t)
                  : getHeroMetric(item, itemKind, t)
                const packageLine = itemKind === 'tobacco' ? formatTobaccoPackageLine(item, t) : null
                const price = formatPrice(item.price, item.price_currency)

                return (
                  <Card key={item.id} className="h-full">
                    <div tw="flex h-full flex-col bg-[rgb(var(--color-surface))]">
                      <div tw="relative aspect-square overflow-hidden border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))]">
                        {item.photo_urls?.length > 0 ? (
                          <SafeImage
                            src={item.photo_urls[0]}
                            alt={item.name}
                            tw="h-full w-full object-cover transition-transform duration-200"
                            fallback={<CatalogImageFallback itemKind={itemKind} />}
                          />
                        ) : (
                          <CatalogImageFallback itemKind={itemKind} />
                        )}
                        <div tw="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(23,19,18,0.03)_35%,rgba(23,19,18,0.34))]" />
                        <div tw="pointer-events-none absolute left-2.5 top-2.5 flex max-w-[calc(100%-1.25rem)] items-center gap-1.5 rounded-md border border-white/75 bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[10px] font-bold text-[rgb(var(--color-text-muted))] shadow-[0_10px_24px_-18px_rgba(83,48,31,0.55)] backdrop-blur">
                          <CatalogIcon name={iconByKind[itemKind]} size={12} />
                          <span tw="max-w-[120px] truncate">{packageLine || title}</span>
                        </div>
                        {!isAdmin && item.photo_urls?.length > 1 && (
                          <span tw="absolute right-2 top-2 rounded-md bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text))] shadow-sm ring-1 ring-black/5">
                            {t('catalog.photos', { count: item.photo_urls.length })}
                          </span>
                        )}
                        {isAdmin && (
                          <div tw="absolute right-2 top-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(onEditPath(item.id))}
                              aria-label={t('common.edit')}
                              title={t('common.edit')}
                              tw="flex h-8 w-8 items-center justify-center rounded-lg border border-white/75 bg-[rgb(var(--color-surface))]/95 text-[rgb(var(--color-text-muted))] shadow-[0_12px_24px_-18px_rgba(83,48,31,0.7)] transition-colors hover:bg-[rgb(var(--color-accent-muted))] hover:text-[rgb(var(--color-text))]"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              aria-label={t('common.delete')}
                              title={t('common.delete')}
                              tw="flex h-8 w-8 items-center justify-center rounded-lg border border-white/75 bg-[rgb(var(--color-surface))]/95 text-[rgb(var(--color-danger))] shadow-[0_12px_24px_-18px_rgba(83,48,31,0.7)] transition-colors hover:bg-[rgb(var(--color-danger-surface))]"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                        {heroMetric && (
                          <div tw="pointer-events-none absolute bottom-2.5 right-2.5 max-w-[calc(100%-1.25rem)] rounded-md border border-white/60 bg-[rgb(var(--color-surface-inverse))]/90 px-2 py-1.5 text-[11px] font-black text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.75)] backdrop-blur">
                            <span tw="block truncate">{heroMetric}</span>
                          </div>
                        )}
                      </div>

                      <div tw="flex flex-1 flex-col gap-3 px-3.5 py-3.5">
                        <div tw="min-w-0">
                          <div tw="mb-2 flex min-w-0 items-center gap-2">
                            {price && (
                              <span tw="shrink-0 rounded-md bg-[rgb(var(--color-surface-inverse))] px-2 py-1 text-[11px] font-black text-white">
                                {price}
                              </span>
                            )}
                            {itemKind === 'kaloud' && (
                              <span tw="min-w-0 truncate rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))]">
                                {t('itemForm.heatManagement')}
                              </span>
                            )}
                          </div>
                          <h3 tw="text-[13px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2 sm:text-sm">{item.name}</h3>
                          {itemKind === 'tobacco' && (
                            <div tw="mt-2">
                              <StrengthIndicator label={t('catalog.factStrength')} value={getTobaccoStrength(item)} compact />
                            </div>
                          )}
                        </div>

                        {facts.length > 0 && (
                          <div tw="mt-auto grid grid-cols-2 gap-2 border-t border-[rgb(var(--color-border))] pt-3">
                            {facts.map((fact) => (
                              <div key={`${fact.label}-${fact.value}`} tw="min-w-0 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-2.5 py-2">
                                <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{fact.label}</p>
                                <p tw="mt-0.5 truncate text-[12px] font-black text-[rgb(var(--color-text))]">{fact.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={t('catalog.deleteTitle')}>
        <div tw="space-y-4">
          <div>
            <p tw="text-sm font-semibold text-[rgb(var(--color-text))]">{deleteTarget?.name}</p>
            <p tw="mt-1 text-sm text-[rgb(var(--color-text-muted))]">{t('catalog.deleteWarning')}</p>
          </div>
          <div tw="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={confirmDelete} disabled={deleting}>
              {deleting ? t('common.saving') : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
