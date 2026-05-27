import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { api } from '../shared/api/base'

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

const createStore = (preloadedState?: Partial<RootState>) => configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

export const store = createStore()

const getDevStore = (preloadedState?: Partial<RootState>) => {
  const globalStore = globalThis as typeof globalThis & { __shishaGuidStore?: ReturnType<typeof createStore> }
  if (import.meta.env.PROD || import.meta.env.SSR) return createStore(preloadedState)
  if (!globalStore.__shishaGuidStore) {
    globalStore.__shishaGuidStore = createStore(preloadedState)
  }
  return globalStore.__shishaGuidStore
}

export const createAppStore = (preloadedState?: Partial<RootState>) => getDevStore(preloadedState)

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
