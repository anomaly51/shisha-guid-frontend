export const appName = 'Shishiguid'

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
  '/ai-chat': 'agent.title',
  '/profile': 'profile.title',
  '/authors': 'authors.title',
}

const fallbackTitles: Record<string, string> = {
  'feed.title': 'Лента',
  'routes.bowls': 'Чаши',
  'routes.createBowl': 'Создать чашу',
  'routes.editBowl': 'Редактировать чашу',
  'routes.tobaccos': 'Табаки',
  'routes.createTobacco': 'Создать табак',
  'routes.editTobacco': 'Редактировать табак',
  'routes.coals': 'Угли',
  'routes.createCoal': 'Создать уголь',
  'routes.editCoal': 'Редактировать уголь',
  'routes.kalouds': 'Калауды',
  'routes.createKaloud': 'Создать калауд',
  'routes.editKaloud': 'Редактировать калауд',
  'routes.coalPlacements': 'Размещение угля',
  'routes.createCoalPlacement': 'Создать размещение угля',
  'routes.editCoalPlacement': 'Редактировать размещение угля',
  'routes.setupTypes': 'Типы забивок',
  'routes.createSetupType': 'Создать тип забивки',
  'routes.editSetupType': 'Редактировать тип забивки',
  'setupForm.newSetup': 'Новая забивка',
  'setupForm.editSetup': 'Редактировать забивку',
  'setupDetail.setup': 'Забивка',
  'agent.title': 'AI-чат',
  'profile.title': 'Профиль',
  'authors.title': 'Авторы',
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
  if (/^\/users\/[^/]+$/.test(normalizedPath)) return 'authors.title'

  return null
}

export const getFallbackPageTitle = (pathname: string) => {
  const titleKey = getRouteTitleKey(pathname)
  const pageTitle = titleKey ? fallbackTitles[titleKey] : 'Не найдено'
  return pageTitle && pageTitle !== appName ? `${pageTitle} | ${appName}` : appName
}

export const getPageTitle = (pathname: string, t: Translate) => {
  const titleKey = getRouteTitleKey(pathname)
  const pageTitle = titleKey ? t(titleKey) : t('common.notFound')

  return pageTitle && pageTitle !== appName ? `${pageTitle} | ${appName}` : appName
}
