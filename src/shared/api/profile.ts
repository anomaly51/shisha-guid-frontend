import { api } from './base'
import { clearAuthSession, setCachedProfile } from '../authToken'

export interface ProfileUpdatePayload {
  nickname?: string | null
  avatar_url?: string | null
}

const isUnauthorizedQueryError = (error: unknown) => (
  typeof error === 'object' &&
  error !== null &&
  'error' in error &&
  typeof error.error === 'object' &&
  error.error !== null &&
  'status' in error.error &&
  error.error.status === 401
)

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<any, void>({
      query: () => '/profile/me',
      providesTags: ['Profile'],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          setCachedProfile(data)
        } catch (error) {
          if (isUnauthorizedQueryError(error)) {
            clearAuthSession()
          }
        }
      },
    }),
    updateProfile: builder.mutation<any, ProfileUpdatePayload>({
      query: (body) => ({ url: '/profile/me', method: 'PATCH', body }),
      invalidatesTags: ['Profile'],
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
