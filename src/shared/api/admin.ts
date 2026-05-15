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
  }),
})

export const { useGetAdminUsersQuery, useUpdateAdminUserMutation } = adminApi
