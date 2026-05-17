import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { clearAuthSession, getAuthToken } from '../authToken'

const apiBaseUrl = import.meta.env.SSR
  ? import.meta.env.VITE_SSR_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  : import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers) => {
    const token = getAuthToken()
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const api = createApi({
  reducerPath: 'api',
  refetchOnMountOrArgChange: true,
  baseQuery: async (args, baseQueryApi, extraOptions) => {
    const result = await rawBaseQuery(args, baseQueryApi, extraOptions)
    if (result.error?.status === 401) {
      clearAuthSession()
      baseQueryApi.dispatch(api.util.resetApiState())
    }
    return result
  },
  tagTypes: ['Setups', 'SetupReviews', 'Bowls', 'Tobaccos', 'Coals', 'Kalouds', 'CoalPlacements', 'BowlSetupTypes', 'Profile', 'AdminUsers'],
  endpoints: () => ({}),
})
