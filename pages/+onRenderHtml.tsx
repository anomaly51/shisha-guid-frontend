import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { dangerouslySkipEscape, escapeInject } from 'vike/server'
import type { PageContextServer } from 'vike/types'
import { ServerStyleSheet } from 'styled-components'
import { AppProviders } from '../src/app/providers'
import { createAppStore } from '../src/app/store'
import { prefetchRouteData } from '../src/app/prefetch'
import { getFallbackPageTitle } from '../src/app/pageMeta'

type ServerPageContext = PageContextServer & {
  Page: React.ComponentType
}

type QueryState = {
  endpointName?: string
  originalArgs?: unknown
  data?: unknown
  status?: string
}

type PageMeta = {
  canonicalUrl: string
  description: string
  image?: string
  title: string
}

const listEndpoints = new Set([
  'getSetups',
  'getTobaccos',
  'getBowls',
  'getCoals',
  'getKalouds',
  'getCoalPlacements',
  'getBowlSetupTypes',
])

const themeScript = `
(() => {
  try {
    const key = 'shisha-guid-theme'
    const saved = localStorage.getItem(key)
    const preference = saved === 'dark' || saved === 'system' || saved === 'light' ? saved : 'light'
    const resolved = preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : preference === 'dark' ? 'dark' : 'light'
    document.documentElement.dataset.themePreference = preference
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  } catch {
    document.documentElement.dataset.theme = 'light'
    document.documentElement.dataset.themePreference = 'light'
  }
})()
`

const assetReloadScript = `
(() => {
  const reloadKey = 'shisha-guid-asset-reload'
  const reloadWithCacheBust = () => {
    try {
      const lastReload = Number(sessionStorage.getItem(reloadKey) || 0)
      if (Date.now() - lastReload < 10000) return
      sessionStorage.setItem(reloadKey, String(Date.now()))
      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.set('_r', String(Date.now()))
      window.location.replace(nextUrl.toString())
    } catch {
      window.location.reload()
    }
  }

  window.addEventListener('error', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const assetUrl = target.getAttribute('src') || target.getAttribute('href') || ''
    if (assetUrl.includes('/assets/')) reloadWithCacheBust()
  }, true)

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadWithCacheBust()
  })
})()
`

const isEmptySetupsQuery = (query: QueryState) => {
  if (query.endpointName !== 'getSetups') return false

  const data = query.data
  const items = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && 'items' in data && Array.isArray(data.items)
      ? data.items
      : null

  if (!items || items.length) return false

  const args = query.originalArgs
  if (!args || typeof args !== 'object') return true

  const { tobacco_ids: tobaccoIds, strength, sort } = args as {
    tobacco_ids?: unknown[]
    strength?: string
    sort?: string
  }

  return !tobaccoIds?.length && (!strength || strength === 'all') && (!sort || sort === 'newest')
}

const compactCatalogItem = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(compactCatalogItem)
  if (!value || typeof value !== 'object') return value

  const item = value as Record<string, unknown>
  const next = { ...item }
  if ('description' in next) delete next.description
  if (Array.isArray(next.photo_urls)) next.photo_urls = next.photo_urls.slice(0, 1)
  return next
}

const compactListData = (data: unknown): unknown => {
  if (Array.isArray(data)) return data.map(compactCatalogItem)
  if (data && typeof data === 'object' && 'items' in data) {
    const page = data as Record<string, unknown>
    return {
      ...page,
      items: Array.isArray(page.items) ? page.items.map(compactCatalogItem) : [],
    }
  }
  return data
}

const compactQuery = (query: QueryState): QueryState => (
  query.endpointName && listEndpoints.has(query.endpointName)
    ? { ...query, data: compactListData(query.data) }
    : query
)

const getSerializableState = (state: ReturnType<ReturnType<typeof createAppStore>['getState']>) => {
  const queries = Object.fromEntries(
    Object.entries(state.api.queries)
      .filter(([, query]) => query?.status === 'fulfilled' && !isEmptySetupsQuery(query))
      .map(([key, query]) => [key, compactQuery(query as QueryState)]),
  )
  const queryKeys = new Set(Object.keys(queries))

  return {
    ...state,
    api: {
      ...state.api,
      queries,
      mutations: {},
      provided: {
        tags: Object.fromEntries(
          Object.entries(state.api.provided.tags).map(([tag, ids]) => [
            tag,
            Object.fromEntries(
              Object.entries(ids).map(([id, keys]) => [
                id,
                keys.filter((key) => queryKeys.has(key)),
              ]).filter(([, keys]) => keys.length),
            ),
          ]).filter(([, ids]) => Object.keys(ids).length),
        ),
        keys: Object.fromEntries(
          Object.entries(state.api.provided.keys).filter(([key]) => queryKeys.has(key)),
        ),
      },
      subscriptions: {},
    },
  }
}

const getPublicSiteUrl = () => (
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  ((globalThis as any).process?.env?.PUBLIC_SITE_URL as string | undefined) ||
  ((globalThis as any).process?.env?.SITE_URL as string | undefined) ||
  'http://localhost:5173'
).replace(/\/+$/, '')

const findFulfilledQueryData = (
  state: ReturnType<ReturnType<typeof createAppStore>['getState']>,
  endpointName: string,
  originalArg?: unknown,
) => Object.values(state.api.queries).find((query) => (
  query?.status === 'fulfilled' &&
  query.endpointName === endpointName &&
  (originalArg === undefined || query.originalArgs === originalArg)
))?.data as any

const truncateMeta = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}…` : normalized
}

const buildPageMeta = (
  url: string,
  state: ReturnType<ReturnType<typeof createAppStore>['getState']>,
): PageMeta => {
  const parsedUrl = new URL(url, getPublicSiteUrl())
  const canonicalUrl = `${getPublicSiteUrl()}${parsedUrl.pathname}`
  const setupMatch = parsedUrl.pathname.match(/^\/setups\/([^/]+)$/)
  const defaultDescription = 'ShishaGuid - share and discover shisha setups'

  if (setupMatch) {
    const setup = findFulfilledQueryData(state, 'getSetup', setupMatch[1])
    if (setup?.name) {
      const tobaccoNames = (setup.tobaccos || [])
        .map((item: any) => item.tobacco?.name)
        .filter(Boolean)
      const description = truncateMeta(
        setup.description ||
        (tobaccoNames.length ? `Shisha setup with ${tobaccoNames.join(', ')}.` : defaultDescription),
        180,
      )
      return {
        canonicalUrl,
        description,
        image: setup.photo_urls?.[0] || setup.tobaccos?.find((item: any) => item.tobacco?.photo_urls?.[0])?.tobacco.photo_urls[0],
        title: `${setup.name} | ShishaGuid`,
      }
    }
  }

  return {
    canonicalUrl,
    description: defaultDescription,
    title: getFallbackPageTitle(parsedUrl.pathname),
  }
}

export const onRenderHtml = async (pageContext: ServerPageContext) => {
  const store = createAppStore()
  const url = pageContext.urlOriginal

  try {
    await prefetchRouteData(store, url)
  } catch (error) {
    console.error('SSR prefetch failed:', error)
  }

  const sheet = new ServerStyleSheet()

  try {
    const { Page } = pageContext
    const app = sheet.collectStyles(
      <React.StrictMode>
        <AppProviders store={store}>
          <StaticRouter location={url}>
            <Page />
          </StaticRouter>
        </AppProviders>
      </React.StrictMode>,
    )
    const pageHtml = renderToString(app)
    const styles = sheet.getStyleTags()
    const preloadedState = getSerializableState(store.getState())
    const pageMeta = buildPageMeta(url, store.getState())

    const documentHtml = escapeInject`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="theme-color" content="#FAFAFA" />
          <meta name="description" content="${pageMeta.description}" />
          <link rel="canonical" href="${pageMeta.canonicalUrl}" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="ShishaGuid" />
          <meta property="og:title" content="${pageMeta.title}" />
          <meta property="og:description" content="${pageMeta.description}" />
          <meta property="og:url" content="${pageMeta.canonicalUrl}" />
          ${pageMeta.image ? escapeInject`<meta property="og:image" content="${pageMeta.image}" />` : ''}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <title>${pageMeta.title}</title>
          <script>${dangerouslySkipEscape(themeScript)}</script>
          <script>${dangerouslySkipEscape(assetReloadScript)}</script>
          ${dangerouslySkipEscape(styles)}
        </head>
        <body>
          <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
        </body>
      </html>`

    return {
      documentHtml,
      pageContext: {
        preloadedState,
      },
    }
  } finally {
    sheet.seal()
  }
}
