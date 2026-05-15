import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { App } from './app/App'
import type { RootState } from './app/store'

declare global {
  interface Window {
    __PRELOADED_STATE__?: Partial<RootState>
  }
}

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element was not found')
}

hydrateRoot(
  root,
  <React.StrictMode>
    <App preloadedState={window.__PRELOADED_STATE__} />
  </React.StrictMode>,
)

delete window.__PRELOADED_STATE__
