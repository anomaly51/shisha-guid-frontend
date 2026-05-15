import { api } from './base'

export interface ProfileUpdatePayload {
  nickname?: string | null
  avatar_url?: string | null
}

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<any, void>({
      query: () => '/profile/me',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<any, ProfileUpdatePayload>({
      query: (body) => ({ url: '/profile/me', method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
