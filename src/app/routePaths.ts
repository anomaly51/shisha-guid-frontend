const exactPaths = new Set([
  '/',
  '/ai-chat',
  '/authors',
  '/profile',
  '/setups/create',
])

const catalogSections = '(?:bowls|tobaccos|coals|kalouds)'
const adminCatalogSections = '(?:coal-placements|bowl-setup-types)'

const routePatterns = [
  new RegExp(`^/${catalogSections}(?:/create|/[^/]+(?:/edit)?)?$`),
  new RegExp(`^/${adminCatalogSections}(?:/create|/[^/]+(?:/edit)?)?$`),
  new RegExp(`^/admin/${adminCatalogSections}(?:/create|/[^/]+(?:/edit)?)?$`),
  /^\/setups\/[^/]+(?:\/edit)?$/,
  /^\/users\/[^/]+$/,
]

export const isKnownAppPath = (url: string) => {
  const pathname = new URL(url, 'http://localhost').pathname
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  return exactPaths.has(normalizedPath) || routePatterns.some((pattern) => pattern.test(normalizedPath))
}
