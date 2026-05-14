import { api } from './base'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    googleLogin: builder.mutation<any, { code: string; client_id: string; redirect_uri: string }>({
      query: (body) => ({
        url: '/auth/google/token',
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: body.code,
          client_id: body.client_id,
          redirect_uri: body.redirect_uri,
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    }),
    logout: builder.mutation<any, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
})

export const { useGoogleLoginMutation, useLogoutMutation } = authApi
