import { type ReactElement } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useGetProfileQuery } from '../shared/api'
import { hasAuthToken } from '../shared/authToken'

export const AdminOnly = ({ children }: { children: ReactElement }) => {
  const hasToken = hasAuthToken()
  const { data: profile, isLoading } = useGetProfileQuery(undefined, { skip: !hasToken })

  if (hasToken && isLoading) return null
  if (profile?.role !== 'admin') return <Navigate to="/profile" replace />

  return children
}

export const LegacyAdminCatalogRedirect = ({ base, edit = false }: { base: string; edit?: boolean }) => {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/admin/${base}/${id}${edit ? '/edit' : ''}`} replace />
}
