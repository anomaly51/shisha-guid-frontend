import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const apiBaseUrl = import.meta.env.SSR
  ? import.meta.env.VITE_SSR_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  : import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = createApi({
  reducerPath: 'api',
  refetchOnMountOrArgChange: 30,
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Setups', 'SetupReviews', 'Bowls', 'Tobaccos', 'Coals', 'Kalouds', 'CoalPlacements', 'BowlSetupTypes', 'Profile', 'AdminUsers'],
  endpoints: () => ({}),
})
