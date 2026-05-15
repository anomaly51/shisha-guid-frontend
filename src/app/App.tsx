import { useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createAppStore, type RootState } from './store'
import { AppRoutes } from './routes'
import { AppProviders } from './providers'
import { NavigationProgress } from '../widgets/NavigationProgress'
import '../shared/i18n'

interface AppProps {
  preloadedState?: Partial<RootState>
}

export const App = ({ preloadedState }: AppProps) => {
  const store = useMemo(() => createAppStore(preloadedState), [preloadedState])

  return (
    <AppProviders store={store}>
      <BrowserRouter>
        <NavigationProgress />
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
