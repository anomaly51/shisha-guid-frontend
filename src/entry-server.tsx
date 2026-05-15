import React from 'react'
import { renderToString } from 'react-dom/server'
import * as ReactRouter from 'react-router-dom'
import { ServerStyleSheet } from 'styled-components'
import { AppProviders } from './app/providers'
import { AppRoutes } from './app/routes'
import { createAppStore } from './app/store'
import { prefetchRouteData } from './app/prefetch'
import { NavigationProgress } from './widgets/NavigationProgress'

const escapeJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

const StaticRouter = ReactRouter.StaticRouter

const isEmptySetupsQuery = (query: { endpointName?: string; originalArgs?: unknown; data?: unknown }) => {
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

export const render = async (url: string) => {
  const store = createAppStore()

  try {
    await prefetchRouteData(store, url)
  } catch (error) {
    console.error('SSR prefetch failed:', error)
  }

  const sheet = new ServerStyleSheet()

  try {
    const app = sheet.collectStyles(
      <React.StrictMode>
        <AppProviders store={store}>
          <StaticRouter location={url}>
            <NavigationProgress />
            <AppRoutes />
          </StaticRouter>
        </AppProviders>
      </React.StrictMode>,
    )

    const html = renderToString(app)
    const styles = sheet.getStyleTags()
    const preloadedState = getSerializableState(store.getState())
    const stateScript = `<script>window.__PRELOADED_STATE__=${escapeJson(preloadedState)}</script>`

    return { html, styles, stateScript }
  } finally {
    sheet.seal()
  }
}
