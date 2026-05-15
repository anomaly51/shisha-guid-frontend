import { api } from './base'

export interface UploadFileResponse {
  url: string
}

export const uploadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUploadPolicy: builder.mutation<any, string>({
      query: (content_type) => ({
        url: `/upload?content_type=${encodeURIComponent(content_type)}`,
        method: 'POST',
      }),
    }),
    uploadMedia: builder.mutation<UploadFileResponse, File>({
      query: (file) => {
        const formData = new FormData()
        formData.append('file', file)

        return {
          url: '/upload/file',
          method: 'POST',
          body: formData,
        }
      },
    }),
  }),
})

export const { useGetUploadPolicyMutation, useUploadMediaMutation } = uploadApi
