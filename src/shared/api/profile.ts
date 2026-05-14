import { api } from './base'

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<any, void>({
      query: () => '/profile/me',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<any, { nickname: string }>({
      query: (body) => ({ url: '/profile/me', method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
