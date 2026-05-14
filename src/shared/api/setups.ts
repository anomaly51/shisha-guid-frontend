import { api } from './base'

export const setupsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSetups: builder.query<any[], void>({
      query: () => '/shisha/bowl-setups',
      providesTags: ['Setups'],
    }),
    getSetup: builder.query<any, string>({
      query: (id) => `/shisha/bowl-setups/${id}`,
      providesTags: ['Setups'],
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
  }),
})

export const {
  useGetSetupsQuery, useGetSetupQuery, useCreateSetupMutation, useUpdateSetupMutation, useDeleteSetupMutation,
} = setupsApi
