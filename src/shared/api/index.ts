import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Берем URL из .env, фолбэк на localhost для локальной разработки
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Setups', 'Bowls', 'Tobaccos', 'Coals'],
  endpoints: (builder) => ({
    getProfile: builder.query<any, void>({
      query: () => '/profile/me',
    }),
    getSetups: builder.query<any[], void>({
      query: () => '/shisha/bowl-setups',
      providesTags: ['Setups'],
    }),
    getBowls: builder.query<any[], void>({
      query: () => '/shisha/bowls',
      providesTags: ['Bowls'],
    }),
    getTobaccos: builder.query<any[], void>({
      query: () => '/shisha/tobaccos',
      providesTags: ['Tobaccos'],
    }),
    getCoals: builder.query<any[], void>({
      query: () => '/shisha/coals',
      providesTags: ['Coals'],
    }),
  }),
})

export const {
  useGetProfileQuery,
  useGetSetupsQuery,
  useGetBowlsQuery,
  useGetTobaccosQuery,
  useGetCoalsQuery,
} = api
