import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import type { PageContextClient } from 'vike/types'
import { AppProviders } from '../src/app/providers'
import { createAppStore, type RootState } from '../src/app/store'

type ClientPageContext = PageContextClient & {
  Page: React.ComponentType
  preloadedState?: Partial<RootState>
}

export const onRenderClient = (pageContext: ClientPageContext) => {
  const root = document.getElementById('root')

  if (!root) {
    throw new Error('Root element was not found')
  }

  const store = createAppStore(pageContext.preloadedState)
  const { Page } = pageContext

  hydrateRoot(
    root,
    <React.StrictMode>
      <AppProviders store={store}>
        <BrowserRouter>
          <Page />
        </BrowserRouter>
      </AppProviders>
    </React.StrictMode>,
  )
}
