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

export const createAppStore = (preloadedState?: Partial<RootState>) => createStore(preloadedState)

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
