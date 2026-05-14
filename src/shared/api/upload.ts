import { api } from './base'

export const uploadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUploadPolicy: builder.mutation<any, string>({
      query: (content_type) => ({
        url: `/upload?content_type=${encodeURIComponent(content_type)}`,
        method: 'POST',
      }),
    }),
  }),
})

export const { useGetUploadPolicyMutation } = uploadApi
