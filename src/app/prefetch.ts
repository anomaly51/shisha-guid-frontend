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

const setupDetailPrefetch: PrefetchRequest[] = [
  { endpoint: 'getBowls' },
  { endpoint: 'getTobaccos' },
  { endpoint: 'getCoals' },
  { endpoint: 'getKalouds' },
  { endpoint: 'getCoalPlacements' },
  { endpoint: 'getBowlSetupTypes' },
]

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
  }

  if (segments.length === 0) {
    return [{ endpoint: 'getSetups', arg: setupFilters }, { endpoint: 'getTobaccos' }]
  }

  if (segments[0] === 'setups' && segments[1] === 'create') {
    return setupDetailPrefetch
  }

  if (segments[0] === 'setups' && segments[1] && (segments.length === 2 || segments[2] === 'edit')) {
    return [
      { endpoint: 'getSetup', arg: segments[1] },
      { endpoint: 'getSetupReviews', arg: segments[1] },
      ...setupDetailPrefetch,
    ]
  }

  const catalog = catalogRoutes[segments[0]]
  if (!catalog) return []

  if (segments.length === 1) {
    return [{ endpoint: catalog.list, arg: segments[0] === 'tobaccos' ? tobaccoFilters : undefined }]
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

  try {
    await Promise.all(subscriptions.map((subscription) => subscription.unwrap()))
  } finally {
    subscriptions.forEach((subscription) => subscription.unsubscribe())
  }
}
