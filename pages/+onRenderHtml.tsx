import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { dangerouslySkipEscape, escapeInject } from 'vike/server'
import type { PageContextServer } from 'vike/types'
import { ServerStyleSheet } from 'styled-components'
import { AppProviders } from '../src/app/providers'
import { createAppStore } from '../src/app/store'
import { prefetchRouteData } from '../src/app/prefetch'

type ServerPageContext = PageContextServer & {
  Page: React.ComponentType
}

type QueryState = {
  endpointName?: string
  originalArgs?: unknown
  data?: unknown
  status?: string
}

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

const getSerializableState = (state: ReturnType<ReturnType<typeof createAppStore>['getState']>) => {
  const queries = Object.fromEntries(
    Object.entries(state.api.queries).filter(([, query]) => (
      query?.status === 'fulfilled' && !isEmptySetupsQuery(query)
    )),
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

    const documentHtml = escapeInject`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="theme-color" content="#FAFAFA" />
          <meta name="description" content="ShishaGuid - share and discover shisha setups" />
          <title>ShishaGuid</title>
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
