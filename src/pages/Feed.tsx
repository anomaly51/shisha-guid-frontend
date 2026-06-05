import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Button } from '../shared/ui/Button'
import { useGetBowlSetupTypesQuery, useGetProfileQuery, useGetRecommendedUsersQuery, useGetSetupsQuery, useGetTobaccosQuery, useLikeSetupMutation, useUnlikeSetupMutation } from '../shared/api'
import { CardSkeleton } from '../shared/ui/Skeleton'
import { CatalogIcon, ChevronDownIcon, CloseIcon, PlusIcon } from '../shared/ui/Icons'
import { AuthorChip } from '../shared/ui/AuthorChip'
import { getSetupAggregateRating } from '../shared/tobaccoRatings'
import { hasAuthToken } from '../shared/authToken'
import { SetupCard } from '../widgets/SetupCard'

type SortValue = 'newest' | 'rating' | 'views' | 'strengthDesc' | 'strengthAsc' | 'name'
type StrengthFilter = 'all' | 'light' | 'medium' | 'strong' | 'heavy'
type PeriodFilter = 'all' | 'week'

const SETUP_PAGE_SIZE = 12
const SETUPS_EMPTY_RETRY_LIMIT = 3
const SEARCH_HISTORY_KEY = 'shisha-guid:setup-searches'

const getSetupRating = (setup: any) => getSetupAggregateRating(setup) ?? 0

const strengthOptions: StrengthFilter[] = ['all', 'light', 'medium', 'strong', 'heavy']

const sortOptions: SortValue[] = ['newest', 'rating', 'views', 'strengthDesc', 'strengthAsc', 'name']

const getSearchStrength = (value: string | null): StrengthFilter => (
  strengthOptions.includes(value as StrengthFilter) ? value as StrengthFilter : 'all'
)

const getSearchSort = (value: string | null): SortValue => (
  sortOptions.includes(value as SortValue) ? value as SortValue : 'newest'
)

const normalizeSetupsPage = (setupsPage: any): { items: any[]; total: number; offset: number; has_more: boolean } | null => {
  if (!setupsPage) return null

  return Array.isArray(setupsPage)
    ? {
      items: setupsPage,
      total: setupsPage.length,
      offset: 0,
      has_more: false,
    }
    : setupsPage
}

export const Feed = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tobaccoSearch, setTobaccoSearch] = useState('')
  const [tobaccoPickerOpen, setTobaccoPickerOpen] = useState(false)
  const [loadedSetups, setLoadedSetups] = useState<any[]>([])
  const [pageOffset, setPageOffset] = useState(0)
  const [totalSetups, setTotalSetups] = useState(0)
  const [hasMoreSetups, setHasMoreSetups] = useState(false)
  const [emptyRetryCount, setEmptyRetryCount] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const sort = getSearchSort(searchParams.get('sort'))
  const selectedTobaccos = useMemo(() => searchParams.getAll('tobacco'), [searchParams])
  const selectedTobaccoKey = selectedTobaccos.join('\u0001')
  const selectedTags = useMemo(() => searchParams.getAll('tag'), [searchParams])
  const selectedTagKey = selectedTags.join('\u0001')
  const [tagDraft, setTagDraft] = useState('')
  const strength = getSearchStrength(searchParams.get('strength'))
  const setupSearch = searchParams.get('q') || ''
  const bookmarked = searchParams.get('bookmarked') === '1'
  const following = searchParams.get('following') === '1'
  const period: PeriodFilter = searchParams.get('period') === 'week' ? 'week' : 'all'
  const hasToken = hasAuthToken()
  const unauthRestrictedFilter = (bookmarked || following) && !hasToken
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const { data: recommendedUsers = [] } = useGetRecommendedUsersQuery({ limit: 4 }, { skip: !hasToken || !following })
  const [likeSetup] = useLikeSetupMutation()
  const [unlikeSetup] = useUnlikeSetupMutation()
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(window.sessionStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  })
  const setupQueryParams = useMemo(() => ({
    limit: SETUP_PAGE_SIZE,
    offset: pageOffset,
    tobacco_ids: selectedTobaccos,
    tags: selectedTags,
    strength,
    sort,
    search: setupSearch || undefined,
    bookmarked,
    following,
    period,
  }), [bookmarked, following, pageOffset, period, selectedTagKey, selectedTags, selectedTobaccoKey, selectedTobaccos, setupSearch, sort, strength])
  const {
    data: setupsPage,
    isError: isSetupsError,
    isFetching,
    isLoading,
    refetch: refetchSetups,
  } = useGetSetupsQuery(setupQueryParams, { refetchOnMountOrArgChange: false, skip: unauthRestrictedFilter })
  const normalizedSetupsPage = useMemo(() => normalizeSetupsPage(setupsPage), [setupsPage])
  const { data: tobaccos } = useGetTobaccosQuery(undefined, {
    refetchOnMountOrArgChange: false,
    skip: selectedTobaccos.length === 0 || tobaccoPickerOpen,
  })
  const tobaccoPickerQueryParams = useMemo(() => ({
    search: tobaccoSearch.trim() || undefined,
    limit: 18,
  }), [tobaccoSearch])
  const { data: pickerTobaccos = [] } = useGetTobaccosQuery(tobaccoPickerQueryParams, { skip: !tobaccoPickerOpen })
  const { data: types } = useGetBowlSetupTypesQuery()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const openSetup = useCallback((setupId: string) => {
    navigate(`/setups/${setupId}`, { state: { feedSearch: location.search } })
  }, [location.search, navigate])
  const initialSetups: any[] = normalizedSetupsPage?.offset === 0 ? normalizedSetupsPage.items : []
  const visibleSetups = loadedSetups.length ? loadedSetups : initialSetups
  const visibleTotal = loadedSetups.length ? totalSetups : normalizedSetupsPage?.total || 0
  const canLoadMore = loadedSetups.length ? hasMoreSetups : Boolean(normalizedSetupsPage?.has_more)
  const typesById = useMemo(() => new Map<string, any>((types || []).map((type: any) => [type.id, type])), [types])
  const tobaccoNamesById = useMemo(() => {
    const entries = new Map<string, string>()
    ;(tobaccos || []).forEach((tobacco: any) => entries.set(tobacco.id, tobacco.name))
    ;(pickerTobaccos || []).forEach((tobacco: any) => entries.set(tobacco.id, tobacco.name))
    visibleSetups.forEach((setup) => {
      ;(setup.tobaccos || []).forEach((item: any) => {
        if (item.tobacco?.name) entries.set(item.tobacco_id, item.tobacco.name)
      })
    })
    return entries
  }, [pickerTobaccos, tobaccos, visibleSetups])

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

  const setSetupSearchFilter = (value: string) => {
    const normalized = value.trim()
    updateSearch((next) => {
      if (normalized) next.set('q', normalized)
      else next.delete('q')
    })
    if (!normalized) return
    setSearchHistory((current) => {
      const next = [normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6)
      window.sessionStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }

  const toggleFlagFilter = (key: 'bookmarked' | 'following') => {
    updateSearch((next) => {
      if (next.get(key) === '1') next.delete(key)
      else next.set(key, '1')
    })
  }

  const toggleWeekPeriod = () => {
    updateSearch((next) => {
      if (next.get('period') === 'week') next.delete('period')
      else {
        next.set('period', 'week')
        if (!next.get('sort')) next.set('sort', 'views')
      }
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

  const addTagFilter = () => {
    const clean = tagDraft.trim().toLowerCase()
    if (!clean) return
    updateSearch((next) => {
      const current = next.getAll('tag')
      if (!current.includes(clean)) next.append('tag', clean)
    })
    setTagDraft('')
  }

  const removeTagFilter = (tag: string) => {
    updateSearch((next) => {
      const updated = next.getAll('tag').filter((item) => item !== tag)
      next.delete('tag')
      updated.forEach((item) => next.append('tag', item))
    })
  }

  const resetFilters = () => {
    setTobaccoSearch('')
    updateSearch((next) => {
      next.delete('tobacco')
      next.delete('strength')
      next.delete('q')
      next.delete('bookmarked')
      next.delete('following')
      next.delete('period')
      next.delete('tag')
    })
  }

  useEffect(() => {
    setLoadedSetups([])
    setPageOffset(0)
    setTotalSetups(0)
    setHasMoreSetups(false)
    setEmptyRetryCount(0)
  }, [bookmarked, following, period, selectedTagKey, selectedTobaccoKey, setupSearch, sort, strength])

  useEffect(() => {
    if (!normalizedSetupsPage) return
    const page = normalizedSetupsPage

    setTotalSetups(page.total)
    setHasMoreSetups(page.has_more)
    setEmptyRetryCount(0)
    setLoadedSetups((current) => {
      if (page.offset === 0) return page.items
      const seen = new Set(current.map((setup) => setup.id))
      return [
        ...current,
        ...page.items.filter((setup) => !seen.has(setup.id)),
      ]
    })
  }, [normalizedSetupsPage])

  useEffect(() => {
    if (!isSetupsError || loadedSetups.length || emptyRetryCount >= SETUPS_EMPTY_RETRY_LIMIT) return undefined

    const timeout = window.setTimeout(() => {
      setEmptyRetryCount((current) => current + 1)
      refetchSetups()
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [emptyRetryCount, isSetupsError, loadedSetups.length, refetchSetups])

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
      { rootMargin: '320px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [canLoadMore, isFetching])

  const activeFilterCount = selectedTobaccos.length
    + selectedTags.length
    + (strength !== 'all' ? 1 : 0)
    + (setupSearch ? 1 : 0)
    + (bookmarked ? 1 : 0)
    + (following ? 1 : 0)
    + (period === 'week' ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0
  const strengthLabel = strength === 'all' ? '' : t(`metrics.heaviness.${strength}`)

  if (isLoading || (isSetupsError && !loadedSetups.length && emptyRetryCount < SETUPS_EMPTY_RETRY_LIMIT)) {
    return (
      <div tw="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((n) => <CardSkeleton key={n} />)}
      </div>
    )
  }

  if (unauthRestrictedFilter) {
    return (
      <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] px-4 py-8 text-center">
        <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">Нужен вход</h2>
        <p tw="mt-1 text-sm text-[rgb(var(--color-text-subtle))]">Войди, чтобы увидеть подписки или избранные забивки по этой ссылке.</p>
      </div>
    )
  }

  if (isSetupsError && !loadedSetups.length) {
    return (
      <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] px-4 py-8 text-center">
        <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">{t('feed.filters.loadFailed')}</h2>
        <button type="button" onClick={() => { setEmptyRetryCount(0); refetchSetups() }} tw="mt-4 rounded-lg bg-[rgb(var(--color-surface-inverse))] px-4 py-2 text-[13px] font-bold text-white">
          {t('feed.filters.retry')}
        </button>
      </div>
    )
  }

  if (!visibleSetups.length && !isFetching && !hasActiveFilters) {
    return (
      <div tw="flex flex-col items-center justify-center py-20 text-center">
        <div tw="w-20 h-20 bg-[rgb(var(--color-surface-muted))] rounded-3xl flex items-center justify-center mb-6">
          <CatalogIcon name="feed" size={34} tw="text-[rgb(var(--color-text-subtle))]" />
        </div>
        <h2 tw="text-lg font-semibold text-[rgb(var(--color-text))] mb-1.5">{t('feed.noSetups')}</h2>
        <p tw="text-sm text-[rgb(var(--color-text-subtle))] mb-6 w-full max-w-xs px-2">
          Shishiguid V3 собирает рецепты забивок: оборудование, табаки, пропорции, крепость и отзывы. Начни с первой карточки, чтобы лента ожила.
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
          <span tw="tabular-nums">{t('feed.controls.count', { shown: visibleSetups.length, total: visibleTotal })}</span>
        </div>
      </div>

      <div tw="-mx-2 mb-5 border-y border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))]/95 px-2 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:bg-[rgb(var(--color-surface))] sm:p-3 sm:shadow-[0_18px_42px_-36px_rgba(83,48,31,0.45)] lg:sticky lg:top-[var(--sticky-filter-top)] lg:z-30">
        <div tw="grid grid-cols-1 gap-2 lg:grid-cols-[220px_minmax(240px,1fr)_minmax(0,1fr)_auto]">
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

          <label tw="relative block min-w-0">
            <span tw="sr-only">Поиск забивки</span>
            <CatalogIcon name="feed" size={14} tw="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-subtle))]" />
            <input
              defaultValue={setupSearch}
              onBlur={(event) => setSetupSearchFilter(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  setSetupSearchFilter(event.currentTarget.value)
                }
              }}
              placeholder="Поиск по названию"
              list="setup-search-history"
              tw="h-[42px] w-full rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] pl-9 pr-3 text-[13px] font-bold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)]"
            />
            <datalist id="setup-search-history">
              {searchHistory.map((item) => <option key={item} value={item} />)}
            </datalist>
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
            className="group"
            tw="flex h-[42px] cursor-pointer items-center justify-between gap-3 rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-raised))] px-3 text-[13px] font-black text-[rgb(var(--color-text))] shadow-[inset_0_-1px_0_rgba(0,0,0,0.04),0_14px_28px_-24px_rgba(83,48,31,0.85)] transition-all hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] hover:shadow-[inset_0_-1px_0_rgba(0,0,0,0.04),0_18px_32px_-24px_rgba(83,48,31,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,74,43,0.22)] active:bg-[rgb(var(--color-surface-subtle))] lg:min-w-[168px]"
            css={(tobaccoPickerOpen || selectedTobaccos.length)
              ? { borderColor: 'rgb(var(--color-accent))', backgroundColor: 'rgb(var(--color-accent-muted))' }
              : undefined}
          >
            <span tw="inline-flex min-w-0 items-center gap-2">
              <span tw="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-accent))] transition-colors group-hover:border-[rgb(var(--color-accent))]">
                <CatalogIcon name="tobacco" size={14} tw="block" />
              </span>
              <span tw="truncate">
                {t('feed.filters.tobaccos')}
              </span>
            </span>
            <span tw="inline-flex shrink-0 items-center gap-2">
              {selectedTobaccos.length > 0 && (
                <span tw="rounded-md bg-[rgb(var(--color-surface-inverse))] px-1.5 py-0.5 text-[11px] text-[rgb(var(--color-text-inverse))] tabular-nums">
                  {selectedTobaccos.length}
                </span>
              )}
              <span
                tw="flex h-6 w-6 items-center justify-center rounded-md border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-accent))] transition-colors group-hover:border-[rgb(var(--color-accent))]"
                aria-hidden="true"
              >
                <ChevronDownIcon
                  size={14}
                  tw="block transition-transform"
                  css={{
                    transform: tobaccoPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transformOrigin: 'center',
                  }}
                />
              </span>
            </span>
          </button>
        </div>

        <div tw="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleFlagFilter('following')}
            tw="rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-colors"
            css={following ? { backgroundColor: 'rgb(var(--color-surface-inverse))', borderColor: 'rgb(var(--color-surface-inverse))', color: 'white' } : { backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border-strong))', color: 'rgb(var(--color-text-muted))' }}
          >
            Подписки
          </button>
          <button
            type="button"
            onClick={() => toggleFlagFilter('bookmarked')}
            tw="rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-colors"
            css={bookmarked ? { backgroundColor: 'rgb(var(--color-surface-inverse))', borderColor: 'rgb(var(--color-surface-inverse))', color: 'white' } : { backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border-strong))', color: 'rgb(var(--color-text-muted))' }}
          >
            Избранное
          </button>
          <button
            type="button"
            onClick={toggleWeekPeriod}
            tw="rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-colors"
            css={period === 'week' ? { backgroundColor: 'rgb(var(--color-surface-inverse))', borderColor: 'rgb(var(--color-surface-inverse))', color: 'white' } : { backgroundColor: 'rgb(var(--color-surface))', borderColor: 'rgb(var(--color-border-strong))', color: 'rgb(var(--color-text-muted))' }}
          >
            Топ недели
          </button>
          <label tw="flex min-w-[180px] items-center gap-1 rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-2">
            <span tw="text-[11px] font-black text-[rgb(var(--color-text-subtle))]">#</span>
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTagFilter()
                }
              }}
              placeholder="тег"
              tw="h-[31px] min-w-0 flex-1 bg-transparent text-[12px] font-bold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-subtle))]"
            />
          </label>
        </div>

        {hasActiveFilters && (
          <div tw="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[rgb(var(--color-border))] pt-2">
            {selectedTobaccos.map((id) => {
              const name = tobaccoNamesById.get(id) || t('common.unknown')
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
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTagFilter(tag)}
                tw="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[rgb(var(--color-surface-inverse))] px-2.5 py-1.5 text-[11px] font-bold text-white"
              >
                <span tw="min-w-0 truncate">#{tag}</span>
                <CloseIcon size={10} />
              </button>
            ))}
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
                        <img src={photo} alt={tobacco.name} loading="lazy" decoding="async" tw="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
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
          <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">
            {following ? 'В подписках пока пусто' : t('feed.filters.empty')}
          </h2>
          <p tw="mt-1 text-sm text-[rgb(var(--color-text-subtle))]">
            {following
              ? profile ? 'У авторов, на которых ты подписан, пока нет подходящих забивок.' : 'Войди и подпишись на авторов, чтобы собрать свою ленту.'
              : t('feed.filters.emptyHint')}
          </p>
          <button type="button" onClick={resetFilters} tw="mt-4 rounded-lg bg-[rgb(var(--color-surface-inverse))] px-4 py-2 text-[13px] font-bold text-white">
            {t('feed.controls.reset')}
          </button>
          {following && recommendedUsers.length > 0 && (
            <div tw="mx-auto mt-5 grid max-w-xl gap-2 text-left sm:grid-cols-2">
              {recommendedUsers.map((user: any) => (
                <Link key={user.id} to={`/users/${user.id}`} tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-3 py-2">
                  <AuthorChip author={user} compact />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div tw="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSetups.map((setup) => (
          <SetupCard
            key={setup.id}
            setup={setup}
            tobaccos={tobaccos}
            typeName={typesById.get(setup.bowl_setup_type_id)?.name || ''}
            rating={getSetupRating(setup)}
            onOpen={openSetup}
            onToggleLike={(targetSetup) => {
              if (!profile) return
              if (targetSetup.is_liked) unlikeSetup(targetSetup.id)
              else likeSetup(targetSetup.id)
            }}
          />
        ))}
        {isFetching && visibleSetups.length > 0 && (
          <>
            {[1, 2, 3].map((n) => <CardSkeleton key={`next-${n}`} />)}
          </>
        )}
      </div>

      {canLoadMore && (
        <div ref={loadMoreRef} tw="h-16" aria-hidden="true" />
      )}
    </div>
  )
}
