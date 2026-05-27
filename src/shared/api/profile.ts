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
    getPublicProfile: builder.query<any, string>({
      query: (id) => `/profile/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Profile', id }],
    }),
    followUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/profile/users/${id}/follow`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Profile', id }, 'Profile'],
    }),
    unfollowUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/profile/users/${id}/follow`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Profile', id }, 'Profile'],
    }),
    getNotifications: builder.query<{ items: any[]; unread_count: number }, void>({
      query: () => '/profile/notifications',
      providesTags: ['Profile'],
    }),
    markNotificationsRead: builder.mutation<any, void>({
      query: () => ({ url: '/profile/notifications/read', method: 'POST' }),
      invalidatesTags: ['Profile'],
    }),
  }),
})

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPublicProfileQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = profileApi
