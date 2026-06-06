import { api } from '../shared/api/base'
import type { AppStore } from './store'
import '../shared/api/catalog'
import '../shared/api/setups'

type EndpointName =
  | 'getSetups'
  | 'getTobaccos'
  | 'getBowls'
  | 'getBowl'
  | 'getTobacco'
  | 'getCoals'
  | 'getCoal'
  | 'getKalouds'
  | 'getKaloud'
  | 'getCoalPlacements'
  | 'getCoalPlacement'
  | 'getBowlSetupTypes'
  | 'getBowlSetupType'
  | 'getSetup'
  | 'getSetupReviews'

interface PrefetchRequest {
  endpoint: EndpointName
  arg?: unknown
}

const catalogRoutes: Record<string, { list: EndpointName; detail: EndpointName }> = {
  bowls: { list: 'getBowls', detail: 'getBowl' },
  tobaccos: { list: 'getTobaccos', detail: 'getTobacco' },
  coals: { list: 'getCoals', detail: 'getCoal' },
  kalouds: { list: 'getKalouds', detail: 'getKaloud' },
  'coal-placements': { list: 'getCoalPlacements', detail: 'getCoalPlacement' },
  'bowl-setup-types': { list: 'getBowlSetupTypes', detail: 'getBowlSetupType' },
}

const setupFormPrefetch: PrefetchRequest[] = [
  { endpoint: 'getBowls' },
  { endpoint: 'getCoals', arg: { limit: 60 } },
  { endpoint: 'getKalouds' },
  { endpoint: 'getCoalPlacements' },
  { endpoint: 'getBowlSetupTypes' },
]

const feedPageSize = 12
const PREFETCH_TIMEOUT_MS = 2000

export const getPrefetchRequests = (url: string): PrefetchRequest[] => {
  const { pathname, searchParams } = new URL(url, 'http://localhost')
  const segments = pathname.split('/').filter(Boolean)
  const setupFilters = {
    tobacco_ids: searchParams.getAll('tobacco'),
    strength: searchParams.get('strength') || undefined,
    sort: searchParams.get('sort') || undefined,
  }
  const tobaccoFilters = {
    min_price: searchParams.get('minPrice') || undefined,
    max_price: searchParams.get('maxPrice') || undefined,
    strength: searchParams.get('strength') || undefined,
    brand: searchParams.get('brand') || undefined,
    limit: feedPageSize * 2,
    offset: Math.max(0, (Number(searchParams.get('page')) || 1) - 1) * feedPageSize * 2,
  }

  if (segments.length === 0) {
    return [
      {
        endpoint: 'getSetups',
        arg: {
          ...setupFilters,
          limit: feedPageSize,
          offset: 0,
          strength: setupFilters.strength || 'all',
          sort: setupFilters.sort || 'newest',
        },
      },
    ]
  }

  if (segments[0] === 'setups' && segments[1] === 'create') {
    return setupFormPrefetch
  }

  if (segments[0] === 'setups' && segments[1] && segments[2] === 'edit') {
    return [
      { endpoint: 'getSetup', arg: segments[1] },
      { endpoint: 'getSetupReviews', arg: segments[1] },
    ]
  }

  if (segments[0] === 'setups' && segments[1] && segments.length === 2) {
    return [
      { endpoint: 'getSetup', arg: segments[1] },
      { endpoint: 'getSetupReviews', arg: segments[1] },
    ]
  }

  const catalog = catalogRoutes[segments[0]]
  if (!catalog) return []

  if (segments.length === 1) {
    if (segments[0] === 'tobaccos') return [{ endpoint: catalog.list, arg: tobaccoFilters }]
    if (segments[0] === 'coals') return [{ endpoint: catalog.list, arg: { limit: feedPageSize * 2, offset: 0 } }]
    return [{ endpoint: catalog.list }]
  }

  if (segments[1] && (segments.length === 2 || segments[2] === 'edit')) {
    return [{ endpoint: catalog.detail, arg: segments[1] }]
  }

  return []
}

interface QuerySubscription {
  unwrap: () => Promise<unknown>
  unsubscribe: () => void
}

export const prefetchRouteData = async (store: AppStore, url: string) => {
  const subscriptions = getPrefetchRequests(url).map(({ endpoint, arg }) => {
    const initiate = (api.endpoints as Record<EndpointName, { initiate: (arg?: unknown) => any }>)[endpoint].initiate
    return store.dispatch(initiate(arg)) as QuerySubscription
  })
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      Promise.all(subscriptions.map((subscription) => subscription.unwrap())),
      new Promise((resolve) => {
        timeoutId = setTimeout(resolve, PREFETCH_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    subscriptions.forEach((subscription) => subscription.unsubscribe())
  }
}
