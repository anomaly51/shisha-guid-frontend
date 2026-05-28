import { api } from './base'
import { clearAuthSession, setCachedProfile } from '../authToken'

export interface ProfileUpdatePayload {
  nickname?: string | null
  avatar_url?: string | null
}

export type UserSearchParams = {
  nickname?: string
  limit?: number
} | void

const withUserSearchParams = (path: string, params: UserSearchParams) => {
  if (!params) return path
  const searchParams = new URLSearchParams()
  if (params.nickname?.trim()) searchParams.set('nickname', params.nickname.trim())
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit))
  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
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
    getProfileActivity: builder.query<any[], { limit?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit))
        const query = searchParams.toString()
        return query ? `/profile/activity?${query}` : '/profile/activity'
      },
      providesTags: ['Profile'],
    }),
    searchUsers: builder.query<any[], UserSearchParams>({
      query: (params) => withUserSearchParams('/profile/users', params),
      providesTags: ['Profile'],
    }),
    getTopAuthors: builder.query<any[], { limit?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit))
        const query = searchParams.toString()
        return query ? `/profile/top-authors?${query}` : '/profile/top-authors'
      },
      providesTags: ['Profile'],
    }),
    followUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/profile/users/${id}/follow`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Profile', id }, 'Profile', 'Setups'],
    }),
    unfollowUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/profile/users/${id}/follow`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Profile', id }, 'Profile', 'Setups'],
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
  useGetProfileActivityQuery,
  useSearchUsersQuery,
  useGetTopAuthorsQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = profileApi
