import { api } from './base'

const makeCrud = <T extends string>(name: T, path: string, tag: string) =>
  api.injectEndpoints({
    endpoints: (builder) => ({
      [`get${name}s` as const]: builder.query<any[], void>({
        query: () => path,
        providesTags: [tag],
      }),
      [`get${name}` as const]: builder.query<any, string>({
        query: (id) => `${path}/${id}`,
        providesTags: [tag],
      }),
      [`create${name}` as const]: builder.mutation<any, any>({
        query: (body) => ({ url: path, method: 'POST', body }),
        invalidatesTags: [tag],
      }),
      [`update${name}` as const]: builder.mutation<any, { id: string } & any>({
        query: ({ id, ...body }) => ({ url: `${path}/${id}`, method: 'PATCH', body }),
        invalidatesTags: [tag],
      }),
      [`delete${name}` as const]: builder.mutation<any, string>({
        query: (id) => ({ url: `${path}/${id}`, method: 'DELETE' }),
        invalidatesTags: [tag],
      }),
    }),
  })

const bowlsApi = makeCrud('Bowl', '/shisha/bowls', 'Bowls')
const tobaccosApi = makeCrud('Tobacco', '/shisha/tobaccos', 'Tobaccos')
const coalsApi = makeCrud('Coal', '/shisha/coals', 'Coals')
const kaloudsApi = makeCrud('Kaloud', '/shisha/kalouds', 'Kalouds')
const placementsApi = makeCrud('CoalPlacement', '/shisha/coal-placements', 'CoalPlacements')
const setupTypesApi = makeCrud('BowlSetupType', '/shisha/bowl-setup-types', 'BowlSetupTypes')

export const {
  useGetBowlsQuery, useGetBowlQuery, useCreateBowlMutation, useUpdateBowlMutation, useDeleteBowlMutation,
} = bowlsApi as any
export const {
  useGetTobaccosQuery, useGetTobaccoQuery, useCreateTobaccoMutation, useUpdateTobaccoMutation, useDeleteTobaccoMutation,
} = tobaccosApi as any
export const {
  useGetCoalsQuery, useGetCoalQuery, useCreateCoalMutation, useUpdateCoalMutation, useDeleteCoalMutation,
} = coalsApi as any
export const {
  useGetKaloudsQuery, useGetKaloudQuery, useCreateKaloudMutation, useUpdateKaloudMutation, useDeleteKaloudMutation,
} = kaloudsApi as any
export const {
  useGetCoalPlacementsQuery, useGetCoalPlacementQuery, useCreateCoalPlacementMutation, useUpdateCoalPlacementMutation, useDeleteCoalPlacementMutation,
} = placementsApi as any
export const {
  useGetBowlSetupTypesQuery, useGetBowlSetupTypeQuery, useCreateBowlSetupTypeMutation, useUpdateBowlSetupTypeMutation, useDeleteBowlSetupTypeMutation,
} = setupTypesApi as any
