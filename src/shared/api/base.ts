import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { clearAuthSession, getAuthToken, getRefreshToken, setAuthToken } from '../authToken'

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

let authRedirectInProgress = false

if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', () => {
    authRedirectInProgress = false
  })
}

export const api = createApi({
  reducerPath: 'api',
  refetchOnMountOrArgChange: true,
  baseQuery: async (args, baseQueryApi, extraOptions) => {
    const result = await rawBaseQuery(args, baseQueryApi, extraOptions)
    if (result.error?.status === 401) {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refresh_token: refreshToken },
          },
          baseQueryApi,
          extraOptions,
        )

        if (refreshResult.data && typeof refreshResult.data === 'object') {
          const tokenData = refreshResult.data as { access_token?: string; expires_in?: number; refresh_token?: string }
          if (tokenData.access_token) {
            authRedirectInProgress = false
            setAuthToken(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in)
            return rawBaseQuery(args, baseQueryApi, extraOptions)
          }
        }
      }

      if (typeof window !== 'undefined') {
        if (authRedirectInProgress) return result
        authRedirectInProgress = true
        clearAuthSession()
        const next = `${window.location.pathname}${window.location.search}`
        window.location.assign(`/profile?next=${encodeURIComponent(next)}`)
      } else {
        clearAuthSession()
      }
    }
    return result
  },
  tagTypes: ['Setups', 'SetupReviews', 'SetupComments', 'SetupReviewReplies', 'Bowls', 'Tobaccos', 'Coals', 'Kalouds', 'CoalPlacements', 'BowlSetupTypes', 'Profile', 'Collections', 'AdminUsers', 'Reports'],
  endpoints: () => ({}),
})
