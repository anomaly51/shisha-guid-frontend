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

const publicUserSocialTags = (id: string) => [
  { type: 'Profile' as const, id },
  { type: 'Profile' as const, id: `followers-${id}` },
  { type: 'Profile' as const, id: `following-${id}` },
  'Profile' as const,
  'Setups' as const,
]

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
    getRecommendedUsers: builder.query<any[], { limit?: number } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit))
        const query = searchParams.toString()
        return query ? `/profile/recommended-users?${query}` : '/profile/recommended-users'
      },
      providesTags: ['Profile'],
    }),
    getUserFollowers: builder.query<any[], { userId: string; limit?: number }>({
      query: ({ userId, limit }) => `/profile/users/${userId}/followers${limit ? `?limit=${limit}` : ''}`,
      providesTags: (_result, _error, { userId }) => [{ type: 'Profile', id: `followers-${userId}` }],
    }),
    getUserFollowing: builder.query<any[], { userId: string; limit?: number }>({
      query: ({ userId, limit }) => `/profile/users/${userId}/following${limit ? `?limit=${limit}` : ''}`,
      providesTags: (_result, _error, { userId }) => [{ type: 'Profile', id: `following-${userId}` }],
    }),
    getCollections: builder.query<any[], void>({
      query: () => '/profile/collections',
      providesTags: ['Collections'],
    }),
    createCollection: builder.mutation<any, { name: string }>({
      query: (body) => ({ url: '/profile/collections', method: 'POST', body }),
      invalidatesTags: ['Collections'],
    }),
    addSetupToCollection: builder.mutation<any, { collectionId: string; setupId: string }>({
      query: ({ collectionId, setupId }) => ({ url: `/profile/collections/${collectionId}/setups/${setupId}`, method: 'POST' }),
      invalidatesTags: ['Collections'],
    }),
    removeSetupFromCollection: builder.mutation<any, { collectionId: string; setupId: string }>({
      query: ({ collectionId, setupId }) => ({ url: `/profile/collections/${collectionId}/setups/${setupId}`, method: 'DELETE' }),
      invalidatesTags: ['Collections'],
    }),
    getFavoriteTobaccos: builder.query<any[], void>({
      query: () => '/profile/favorite-tobaccos',
      providesTags: ['Tobaccos', 'Profile'],
    }),
    addFavoriteTobacco: builder.mutation<any[], string>({
      query: (id) => ({ url: `/profile/favorite-tobaccos/${id}`, method: 'POST' }),
      invalidatesTags: ['Tobaccos', 'Profile'],
    }),
    removeFavoriteTobacco: builder.mutation<any[], string>({
      query: (id) => ({ url: `/profile/favorite-tobaccos/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tobaccos', 'Profile'],
    }),
    followUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/profile/users/${id}/follow`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => publicUserSocialTags(id),
    }),
    unfollowUser: builder.mutation<any, string>({
      query: (id) => ({ url: `/profile/users/${id}/follow`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => publicUserSocialTags(id),
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
  useGetRecommendedUsersQuery,
  useGetUserFollowersQuery,
  useGetUserFollowingQuery,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useAddSetupToCollectionMutation,
  useRemoveSetupFromCollectionMutation,
  useGetFavoriteTobaccosQuery,
  useAddFavoriteTobaccoMutation,
  useRemoveFavoriteTobaccoMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} = profileApi
