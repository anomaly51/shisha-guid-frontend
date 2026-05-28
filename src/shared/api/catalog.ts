import { api } from './base'

type ListQueryParams = Record<string, string | number | string[] | undefined> | void

const withParams = (path: string, params: ListQueryParams) => {
  if (!params) return path

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) searchParams.append(key, item)
      })
      return
    }
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export const catalogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBowls: builder.query<any, ListQueryParams>({
      query: (params) => withParams('/shisha/bowls', params),
      providesTags: ['Bowls'],
    }),
    getBowl: builder.query<any, string>({
      query: (id) => `/shisha/bowls/${id}`,
      providesTags: ['Bowls'],
    }),
    createBowl: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/shisha/bowls', method: 'POST', body }),
      invalidatesTags: ['Bowls'],
    }),
    updateBowl: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/shisha/bowls/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Bowls'],
    }),
    deleteBowl: builder.mutation<void, string>({
      query: (id) => ({ url: `/shisha/bowls/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Bowls'],
    }),

    getTobaccos: builder.query<any, ListQueryParams>({
      query: (params) => withParams('/shisha/tobaccos', params),
      providesTags: ['Tobaccos'],
    }),
    getTobacco: builder.query<any, string>({
      query: (id) => `/shisha/tobaccos/${id}`,
      providesTags: ['Tobaccos'],
    }),
    getTobaccoUsers: builder.query<any[], string>({
      query: (id) => `/shisha/tobaccos/${id}/users`,
      providesTags: ['Profile'],
    }),
    createTobacco: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/shisha/tobaccos', method: 'POST', body }),
      invalidatesTags: ['Tobaccos'],
    }),
    updateTobacco: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/shisha/tobaccos/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Tobaccos'],
    }),
    deleteTobacco: builder.mutation<void, string>({
      query: (id) => ({ url: `/shisha/tobaccos/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tobaccos'],
    }),

    getCoals: builder.query<any, ListQueryParams>({
      query: (params) => withParams('/shisha/coals', params),
      providesTags: ['Coals'],
    }),
    getCoal: builder.query<any, string>({
      query: (id) => `/shisha/coals/${id}`,
      providesTags: ['Coals'],
    }),
    createCoal: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/shisha/coals', method: 'POST', body }),
      invalidatesTags: ['Coals'],
    }),
    updateCoal: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/shisha/coals/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Coals'],
    }),
    deleteCoal: builder.mutation<void, string>({
      query: (id) => ({ url: `/shisha/coals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coals'],
    }),

    getKalouds: builder.query<any, ListQueryParams>({
      query: (params) => withParams('/shisha/kalouds', params),
      providesTags: ['Kalouds'],
    }),
    getKaloud: builder.query<any, string>({
      query: (id) => `/shisha/kalouds/${id}`,
      providesTags: ['Kalouds'],
    }),
    createKaloud: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/shisha/kalouds', method: 'POST', body }),
      invalidatesTags: ['Kalouds'],
    }),
    updateKaloud: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/shisha/kalouds/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Kalouds'],
    }),
    deleteKaloud: builder.mutation<void, string>({
      query: (id) => ({ url: `/shisha/kalouds/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Kalouds'],
    }),

    getCoalPlacements: builder.query<any, ListQueryParams>({
      query: (params) => withParams('/shisha/coal-placements', params),
      providesTags: ['CoalPlacements'],
    }),
    getCoalPlacement: builder.query<any, string>({
      query: (id) => `/shisha/coal-placements/${id}`,
      providesTags: ['CoalPlacements'],
    }),
    createCoalPlacement: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/shisha/coal-placements', method: 'POST', body }),
      invalidatesTags: ['CoalPlacements'],
    }),
    updateCoalPlacement: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/shisha/coal-placements/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['CoalPlacements'],
    }),
    deleteCoalPlacement: builder.mutation<void, string>({
      query: (id) => ({ url: `/shisha/coal-placements/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CoalPlacements'],
    }),

    getBowlSetupTypes: builder.query<any, ListQueryParams>({
      query: (params) => withParams('/shisha/bowl-setup-types', params),
      providesTags: ['BowlSetupTypes'],
    }),
    getBowlSetupType: builder.query<any, string>({
      query: (id) => `/shisha/bowl-setup-types/${id}`,
      providesTags: ['BowlSetupTypes'],
    }),
    createBowlSetupType: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/shisha/bowl-setup-types', method: 'POST', body }),
      invalidatesTags: ['BowlSetupTypes'],
    }),
    updateBowlSetupType: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/shisha/bowl-setup-types/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['BowlSetupTypes'],
    }),
    deleteBowlSetupType: builder.mutation<void, string>({
      query: (id) => ({ url: `/shisha/bowl-setup-types/${id}`, method: 'DELETE' }),
      invalidatesTags: ['BowlSetupTypes'],
    }),
  }),
})

export const {
  useGetBowlsQuery,
  useGetBowlQuery,
  useCreateBowlMutation,
  useUpdateBowlMutation,
  useDeleteBowlMutation,
  useGetTobaccosQuery,
  useGetTobaccoQuery,
  useGetTobaccoUsersQuery,
  useCreateTobaccoMutation,
  useUpdateTobaccoMutation,
  useDeleteTobaccoMutation,
  useGetCoalsQuery,
  useGetCoalQuery,
  useCreateCoalMutation,
  useUpdateCoalMutation,
  useDeleteCoalMutation,
  useGetKaloudsQuery,
  useGetKaloudQuery,
  useCreateKaloudMutation,
  useUpdateKaloudMutation,
  useDeleteKaloudMutation,
  useGetCoalPlacementsQuery,
  useGetCoalPlacementQuery,
  useCreateCoalPlacementMutation,
  useUpdateCoalPlacementMutation,
  useDeleteCoalPlacementMutation,
  useGetBowlSetupTypesQuery,
  useGetBowlSetupTypeQuery,
  useCreateBowlSetupTypeMutation,
  useUpdateBowlSetupTypeMutation,
  useDeleteBowlSetupTypeMutation,
} = catalogApi
