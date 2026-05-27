const appName = 'ShishaGuid'

type Translate = (key: string) => string

const routeTitleKeys: Record<string, string> = {
  '/': 'feed.title',
  '/bowls': 'routes.bowls',
  '/bowls/create': 'routes.createBowl',
  '/tobaccos': 'routes.tobaccos',
  '/tobaccos/create': 'routes.createTobacco',
  '/coals': 'routes.coals',
  '/coals/create': 'routes.createCoal',
  '/kalouds': 'routes.kalouds',
  '/kalouds/create': 'routes.createKaloud',
  '/admin/coal-placements': 'routes.coalPlacements',
  '/admin/coal-placements/create': 'routes.createCoalPlacement',
  '/admin/bowl-setup-types': 'routes.setupTypes',
  '/admin/bowl-setup-types/create': 'routes.createSetupType',
  '/setups/create': 'setupForm.newSetup',
  '/profile': 'profile.title',
}

const fallbackTitles: Record<string, string> = {
  'feed.title': 'Feed',
  'routes.bowls': 'Bowls',
  'routes.createBowl': 'Create bowl',
  'routes.editBowl': 'Edit bowl',
  'routes.tobaccos': 'Tobaccos',
  'routes.createTobacco': 'Create tobacco',
  'routes.editTobacco': 'Edit tobacco',
  'routes.coals': 'Coals',
  'routes.createCoal': 'Create coal',
  'routes.editCoal': 'Edit coal',
  'routes.kalouds': 'Kalouds',
  'routes.createKaloud': 'Create kaloud',
  'routes.editKaloud': 'Edit kaloud',
  'routes.coalPlacements': 'Coal placements',
  'routes.createCoalPlacement': 'Create coal placement',
  'routes.editCoalPlacement': 'Edit coal placement',
  'routes.setupTypes': 'Setup types',
  'routes.createSetupType': 'Create setup type',
  'routes.editSetupType': 'Edit setup type',
  'setupForm.newSetup': 'New setup',
  'setupForm.editSetup': 'Edit setup',
  'setupDetail.setup': 'Setup',
  'profile.title': 'Profile',
}

export const getRouteTitleKey = (pathname: string) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const exactTitleKey = routeTitleKeys[normalizedPath]

  if (exactTitleKey) return exactTitleKey
  if (/^\/bowls\/[^/]+\/edit$/.test(normalizedPath)) return 'routes.editBowl'
  if (/^\/bowls\/[^/]+$/.test(normalizedPath)) return 'routes.bowls'
  if (/^\/tobaccos\/[^/]+\/edit$/.test(normalizedPath)) return 'routes.editTobacco'
  if (/^\/tobaccos\/[^/]+$/.test(normalizedPath)) return 'routes.tobaccos'
  if (/^\/coals\/[^/]+\/edit$/.test(normalizedPath)) return 'routes.editCoal'
  if (/^\/coals\/[^/]+$/.test(normalizedPath)) return 'routes.coals'
  if (/^\/kalouds\/[^/]+\/edit$/.test(normalizedPath)) return 'routes.editKaloud'
  if (/^\/kalouds\/[^/]+$/.test(normalizedPath)) return 'routes.kalouds'
  if (/^\/admin\/coal-placements\/[^/]+\/edit$/.test(normalizedPath)) return 'routes.editCoalPlacement'
  if (/^\/admin\/coal-placements\/[^/]+$/.test(normalizedPath)) return 'routes.coalPlacements'
  if (/^\/admin\/bowl-setup-types\/[^/]+\/edit$/.test(normalizedPath)) return 'routes.editSetupType'
  if (/^\/admin\/bowl-setup-types\/[^/]+$/.test(normalizedPath)) return 'routes.setupTypes'
  if (/^\/setups\/[^/]+\/edit$/.test(normalizedPath)) return 'setupForm.editSetup'
  if (/^\/setups\/[^/]+$/.test(normalizedPath)) return 'setupDetail.setup'

  return null
}

export const getFallbackPageTitle = (pathname: string) => {
  const titleKey = getRouteTitleKey(pathname)
  const pageTitle = titleKey ? fallbackTitles[titleKey] : 'Not found'
  return pageTitle && pageTitle !== appName ? `${pageTitle} | ${appName}` : appName
}

export const getPageTitle = (pathname: string, t: Translate) => {
  const titleKey = getRouteTitleKey(pathname)
  const pageTitle = titleKey ? t(titleKey) : t('common.notFound')

  return pageTitle && pageTitle !== appName ? `${pageTitle} | ${appName}` : appName
}
