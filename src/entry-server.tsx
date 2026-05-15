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
    const preloadedState = store.getState()
    const stateScript = `<script>window.__PRELOADED_STATE__=${escapeJson(preloadedState)}</script>`

    return { html, styles, stateScript }
  } finally {
    sheet.seal()
  }
}
