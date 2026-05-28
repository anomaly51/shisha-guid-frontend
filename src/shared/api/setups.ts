import { api } from './base'

export type SetupsQueryParams = {
  limit?: number
  offset?: number
  tobacco_ids?: string[]
  tags?: string[]
  strength?: 'all' | 'light' | 'medium' | 'strong' | 'heavy'
  sort?: 'newest' | 'rating' | 'views' | 'strengthDesc' | 'strengthAsc' | 'name'
  period?: 'all' | 'week'
  search?: string
  creator_id?: string
  bookmarked?: boolean
  following?: boolean
} | void

export type SetupsPageResponse = {
  items: any[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

type UserSetupsQueryParams = {
  limit?: number
  offset?: number
}

const withParams = (path: string, params: SetupsQueryParams) => {
  if (!params) return path

  const searchParams = new URLSearchParams()
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit))
  if (typeof params.offset === 'number') searchParams.set('offset', String(params.offset))
  if (params.strength && params.strength !== 'all') searchParams.set('strength', params.strength)
  if (params.sort && params.sort !== 'newest') searchParams.set('sort', params.sort)
  if (params.period && params.period !== 'all') searchParams.set('period', params.period)
  if (params.search?.trim()) searchParams.set('search', params.search.trim())
  if (params.creator_id) searchParams.set('creator_id', params.creator_id)
  if (params.bookmarked) searchParams.set('bookmarked', 'true')
  if (params.following) searchParams.set('following', 'true')
  params.tobacco_ids?.forEach((id) => searchParams.append('tobacco_ids', id))
  params.tags?.forEach((tag) => searchParams.append('tags', tag))

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

const withUserSetupsParams = (userId: string, params?: UserSetupsQueryParams) => {
  const searchParams = new URLSearchParams()
  if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit))
  if (typeof params?.offset === 'number') searchParams.set('offset', String(params.offset))
  const query = searchParams.toString()
  return query ? `/profile/users/${userId}/setups?${query}` : `/profile/users/${userId}/setups`
}

export const setupsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSetups: builder.query<any[] | SetupsPageResponse, SetupsQueryParams>({
      query: (params) => withParams('/shisha/bowl-setups', params),
      providesTags: ['Setups'],
    }),
    getUserSetups: builder.query<SetupsPageResponse, { userId: string; limit?: number; offset?: number }>({
      query: ({ userId, limit, offset }) => withUserSetupsParams(userId, { limit, offset }),
      providesTags: (_result, _error, { userId }) => [{ type: 'Setups', id: `user-${userId}` }],
    }),
    getSetup: builder.query<any, string>({
      query: (id) => `/shisha/bowl-setups/${id}`,
      providesTags: ['Setups'],
    }),
    recordSetupView: builder.mutation<any, string>({
      query: (id) => ({ url: `/shisha/bowl-setups/${id}/views`, method: 'POST' }),
      invalidatesTags: ['Setups'],
    }),
    createSetup: builder.mutation<any, any>({
      query: (body) => ({ url: '/shisha/bowl-setups', method: 'POST', body }),
      invalidatesTags: ['Setups'],
    }),
    updateSetup: builder.mutation<any, { id: string } & any>({
      query: ({ id, ...body }) => ({ url: `/shisha/bowl-setups/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Setups'],
    }),
    setSetupFeatured: builder.mutation<any, { id: string; featured: boolean }>({
      query: ({ id, featured }) => ({ url: `/shisha/bowl-setups/${id}/featured?featured=${featured ? 'true' : 'false'}`, method: 'PATCH' }),
      invalidatesTags: ['Setups'],
    }),
    addSetupContributor: builder.mutation<any, { setupId: string; nickname: string }>({
      query: ({ setupId, nickname }) => ({ url: `/shisha/bowl-setups/${setupId}/contributors`, method: 'POST', body: { nickname } }),
      invalidatesTags: ['Setups'],
    }),
    removeSetupContributor: builder.mutation<any, { setupId: string; userId: string }>({
      query: ({ setupId, userId }) => ({ url: `/shisha/bowl-setups/${setupId}/contributors/${userId}`, method: 'DELETE' }),
      invalidatesTags: ['Setups'],
    }),
    deleteSetup: builder.mutation<any, string>({
      query: (id) => ({ url: `/shisha/bowl-setups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Setups'],
    }),
    cloneSetup: builder.mutation<any, string>({
      query: (id) => ({ url: `/shisha/bowl-setups/${id}/clone`, method: 'POST' }),
      invalidatesTags: ['Setups'],
    }),
    bookmarkSetup: builder.mutation<any, string>({
      query: (id) => ({ url: `/shisha/bowl-setups/${id}/bookmark`, method: 'POST' }),
      invalidatesTags: ['Setups'],
    }),
    unbookmarkSetup: builder.mutation<any, string>({
      query: (id) => ({ url: `/shisha/bowl-setups/${id}/bookmark`, method: 'DELETE' }),
      invalidatesTags: ['Setups'],
    }),
    likeSetup: builder.mutation<any, string>({
      query: (id) => ({ url: `/shisha/bowl-setups/${id}/like`, method: 'POST' }),
      invalidatesTags: ['Setups'],
    }),
    unlikeSetup: builder.mutation<any, string>({
      query: (id) => ({ url: `/shisha/bowl-setups/${id}/like`, method: 'DELETE' }),
      invalidatesTags: ['Setups'],
    }),
    getSetupComments: builder.query<any[], string>({
      query: (id) => `/shisha/bowl-setups/${id}/comments`,
      providesTags: (_result, _error, id) => [{ type: 'SetupComments', id }],
    }),
    createSetupComment: builder.mutation<any, { setupId: string; body: string }>({
      query: ({ setupId, body }) => ({
        url: `/shisha/bowl-setups/${setupId}/comments`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (_result, _error, { setupId }) => [{ type: 'SetupComments', id: setupId }, 'Setups'],
    }),
    deleteSetupComment: builder.mutation<any, { setupId: string; commentId: string }>({
      query: ({ setupId, commentId }) => ({
        url: `/shisha/bowl-setups/${setupId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { setupId }) => [{ type: 'SetupComments', id: setupId }, 'Setups'],
    }),
    getSetupVersions: builder.query<any[], string>({
      query: (id) => `/shisha/bowl-setups/${id}/versions`,
      providesTags: ['Setups'],
    }),
    getSetupReviews: builder.query<any[], string>({
      query: (id) => `/shisha/bowl-setups/${id}/reviews`,
      providesTags: (_result, _error, id) => [{ type: 'SetupReviews', id }],
    }),
    createSetupReview: builder.mutation<any, { setupId: string; rating: number; description: string }>({
      query: ({ setupId, rating, description }) => ({
        url: `/shisha/bowl-setups/${setupId}/reviews`,
        method: 'POST',
        body: { rating, description },
      }),
      invalidatesTags: (_result, _error, { setupId }) => [{ type: 'SetupReviews', id: setupId }, 'Setups'],
    }),
    getReviewReplies: builder.query<any[], { setupId: string; reviewId: string }>({
      query: ({ setupId, reviewId }) => `/shisha/bowl-setups/${setupId}/reviews/${reviewId}/replies`,
      providesTags: (_result, _error, { reviewId }) => [{ type: 'SetupReviewReplies', id: reviewId }],
    }),
    createReviewReply: builder.mutation<any, { setupId: string; reviewId: string; body: string }>({
      query: ({ setupId, reviewId, body }) => ({
        url: `/shisha/bowl-setups/${setupId}/reviews/${reviewId}/replies`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (_result, _error, { setupId, reviewId }) => [{ type: 'SetupReviews', id: setupId }, { type: 'SetupReviewReplies', id: reviewId }],
    }),
    deleteReviewReply: builder.mutation<any, { setupId: string; reviewId: string; replyId: string }>({
      query: ({ setupId, reviewId, replyId }) => ({
        url: `/shisha/bowl-setups/${setupId}/reviews/${reviewId}/replies/${replyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { setupId, reviewId }) => [{ type: 'SetupReviews', id: setupId }, { type: 'SetupReviewReplies', id: reviewId }],
    }),
    createReport: builder.mutation<any, { target_type: 'setup' | 'review'; target_id: string; reason: string }>({
      query: (body) => ({ url: '/shisha/reports', method: 'POST', body }),
      invalidatesTags: ['Reports'],
    }),
    updateSetupReview: builder.mutation<any, { setupId: string; reviewId: string; rating: number; description: string }>({
      query: ({ setupId, reviewId, rating, description }) => ({
        url: `/shisha/bowl-setups/${setupId}/reviews/${reviewId}`,
        method: 'PATCH',
        body: { rating, description },
      }),
      invalidatesTags: (_result, _error, { setupId }) => [{ type: 'SetupReviews', id: setupId }, 'Setups'],
    }),
    deleteSetupReview: builder.mutation<any, { setupId: string; reviewId: string }>({
      query: ({ setupId, reviewId }) => ({
        url: `/shisha/bowl-setups/${setupId}/reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { setupId }) => [{ type: 'SetupReviews', id: setupId }, 'Setups'],
    }),
  }),
})

export const {
  useGetSetupsQuery, useGetUserSetupsQuery, useGetSetupQuery, useRecordSetupViewMutation, useCreateSetupMutation, useUpdateSetupMutation, useDeleteSetupMutation,
  useSetSetupFeaturedMutation, useAddSetupContributorMutation, useRemoveSetupContributorMutation, useCloneSetupMutation, useBookmarkSetupMutation, useUnbookmarkSetupMutation, useLikeSetupMutation, useUnlikeSetupMutation, useGetSetupVersionsQuery,
  useGetSetupReviewsQuery, useCreateSetupReviewMutation, useUpdateSetupReviewMutation, useDeleteSetupReviewMutation,
  useGetReviewRepliesQuery, useCreateReviewReplyMutation, useDeleteReviewReplyMutation, useCreateReportMutation,
  useGetSetupCommentsQuery, useCreateSetupCommentMutation, useDeleteSetupCommentMutation,
} = setupsApi
