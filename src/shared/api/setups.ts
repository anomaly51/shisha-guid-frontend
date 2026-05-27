import { api } from './base'

export type SetupsQueryParams = {
  limit?: number
  offset?: number
  tobacco_ids?: string[]
  strength?: 'all' | 'light' | 'medium' | 'strong' | 'heavy'
  sort?: 'newest' | 'rating' | 'views' | 'strengthDesc' | 'strengthAsc' | 'name'
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

const withParams = (path: string, params: SetupsQueryParams) => {
  if (!params) return path

  const searchParams = new URLSearchParams()
  if (typeof params.limit === 'number') searchParams.set('limit', String(params.limit))
  if (typeof params.offset === 'number') searchParams.set('offset', String(params.offset))
  if (params.strength && params.strength !== 'all') searchParams.set('strength', params.strength)
  if (params.sort && params.sort !== 'newest') searchParams.set('sort', params.sort)
  if (params.search?.trim()) searchParams.set('search', params.search.trim())
  if (params.creator_id) searchParams.set('creator_id', params.creator_id)
  if (params.bookmarked) searchParams.set('bookmarked', 'true')
  if (params.following) searchParams.set('following', 'true')
  params.tobacco_ids?.forEach((id) => searchParams.append('tobacco_ids', id))

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export const setupsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSetups: builder.query<any[] | SetupsPageResponse, SetupsQueryParams>({
      query: (params) => withParams('/shisha/bowl-setups', params),
      providesTags: ['Setups'],
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
  useGetSetupsQuery, useGetSetupQuery, useRecordSetupViewMutation, useCreateSetupMutation, useUpdateSetupMutation, useDeleteSetupMutation,
  useCloneSetupMutation, useBookmarkSetupMutation, useUnbookmarkSetupMutation, useGetSetupVersionsQuery,
  useGetSetupReviewsQuery, useCreateSetupReviewMutation, useUpdateSetupReviewMutation, useDeleteSetupReviewMutation,
} = setupsApi
