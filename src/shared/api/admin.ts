import { api } from './base'

export interface UserBadge {
  label: string
  color: string
  effect?: BadgeEffect
}

export type BadgeEffect = 'none' | 'frost' | 'fire' | 'chemical' | 'electric' | 'cosmic' | 'shimmer'

export interface AdminUser {
  id: string
  email: string
  nickname: string | null
  avatar_url: string | null
  role: string
  is_banned: boolean
  badges: UserBadge[]
}

export interface AdminUserUpdatePayload {
  role?: string
  is_banned?: boolean
  badge_label?: string | null
  badge_color?: string | null
  badge_effect?: BadgeEffect
}

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<AdminUser[], void>({
      query: () => '/admin/users',
      providesTags: ['AdminUsers'],
    }),
    updateAdminUser: builder.mutation<AdminUser, { id: string; body: AdminUserUpdatePayload }>({
      query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminUsers', 'Profile'],
    }),
    getReports: builder.query<any[], { status?: string } | void>({
      query: (params) => `/admin/reports?status_filter=${params?.status || 'pending'}`,
      providesTags: ['Reports'],
    }),
    updateReport: builder.mutation<any, { id: string; status: 'resolved' | 'dismissed' }>({
      query: ({ id, status }) => ({ url: `/admin/reports/${id}?status_value=${status}`, method: 'PATCH' }),
      invalidatesTags: ['Reports'],
    }),
  }),
})

export const { useGetAdminUsersQuery, useUpdateAdminUserMutation, useGetReportsQuery, useUpdateReportMutation } = adminApi
