import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { GlobalStyles } from './GlobalStyles'
import type { AppStore } from './store'
import { ThemeProvider } from './theme'

interface AppProvidersProps {
  children: ReactNode
  store: AppStore
}

export const AppProviders = ({ children, store }: AppProvidersProps) => (
  <Provider store={store}>
    <ThemeProvider>
      <GlobalStyles />
      {children}
    </ThemeProvider>
  </Provider>
)
