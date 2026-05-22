import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { lazy, Suspense, type ComponentType, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from '../widgets/Layout'
import { PageTitle } from './PageTitle'
import {
  useGetBowlsQuery, useCreateBowlMutation, useGetBowlQuery, useUpdateBowlMutation, useDeleteBowlMutation,
  useGetTobaccosQuery, useCreateTobaccoMutation, useGetTobaccoQuery, useUpdateTobaccoMutation, useDeleteTobaccoMutation,
  useGetCoalsQuery, useCreateCoalMutation, useGetCoalQuery, useUpdateCoalMutation, useDeleteCoalMutation,
  useGetKaloudsQuery, useCreateKaloudMutation, useGetKaloudQuery, useUpdateKaloudMutation, useDeleteKaloudMutation,
  useGetCoalPlacementsQuery, useCreateCoalPlacementMutation, useGetCoalPlacementQuery, useUpdateCoalPlacementMutation, useDeleteCoalPlacementMutation,
  useGetBowlSetupTypesQuery, useCreateBowlSetupTypeMutation, useGetBowlSetupTypeQuery, useUpdateBowlSetupTypeMutation, useDeleteBowlSetupTypeMutation,
  useGetProfileQuery,
} from '../shared/api'
import { hasAuthToken } from '../shared/authToken'

const routeComponent = <TModule extends Record<string, ComponentType<any>>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
) => lazy(() => loader().then((module) => ({ default: module[exportName] })))

const Feed = import.meta.env.SSR
  ? (await import('../pages/Feed')).Feed
  : routeComponent(() => import('../pages/Feed'), 'Feed')
const Catalog = import.meta.env.SSR
  ? (await import('../pages/Catalog')).Catalog
  : routeComponent(() => import('../pages/Catalog'), 'Catalog')
const Detail = import.meta.env.SSR
  ? (await import('../pages/Detail')).Detail
  : routeComponent(() => import('../pages/Detail'), 'Detail')
const CreateItem = import.meta.env.SSR
  ? (await import('../pages/CreateItem')).CreateItem
  : routeComponent(() => import('../pages/CreateItem'), 'CreateItem')
const EditItem = import.meta.env.SSR
  ? (await import('../pages/EditItem')).EditItem
  : routeComponent(() => import('../pages/EditItem'), 'EditItem')
const SetupDetail = import.meta.env.SSR
  ? (await import('../pages/SetupDetail')).SetupDetail
  : routeComponent(() => import('../pages/SetupDetail'), 'SetupDetail')
const EditSetup = import.meta.env.SSR
  ? (await import('../pages/EditSetup')).EditSetup
  : routeComponent(() => import('../pages/EditSetup'), 'EditSetup')
const SetupForm = import.meta.env.SSR
  ? (await import('../pages/SetupForm')).SetupForm
  : routeComponent(() => import('../pages/SetupForm'), 'SetupForm')
const Profile = import.meta.env.SSR
  ? (await import('../pages/Profile')).Profile
  : routeComponent(() => import('../pages/Profile'), 'Profile')
const AgentChat = import.meta.env.SSR
  ? (await import('../pages/AgentChat')).AgentChat
  : routeComponent(() => import('../pages/AgentChat'), 'AgentChat')

const AdminOnly = ({ children }: { children: ReactElement }) => {
  const hasToken = hasAuthToken()
  const { data: profile, isLoading } = useGetProfileQuery(undefined, { skip: !hasToken })

  if (hasToken && isLoading) return null
  if (profile?.role !== 'admin') return <Navigate to="/profile" replace />

  return children
}

const LegacyAdminCatalogRedirect = ({ base, edit = false }: { base: string; edit?: boolean }) => {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/admin/${base}/${id}${edit ? '/edit' : ''}`} replace />
}

export const AppRoutes = () => {
  const { t } = useTranslation()

  return (
  <>
    <PageTitle />
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Feed />} />

      <Route path="bowls" element={
        <Catalog title={t('routes.bowls')} listHook={useGetBowlsQuery}
          deleteHook={useDeleteBowlMutation} onCreatePath="/bowls/create" onEditPath={(id) => `/bowls/${id}/edit`} itemKind="bowl" />
      } />
      <Route path="bowls/create" element={<AdminOnly><CreateItem title={t('routes.createBowl')} createHook={useCreateBowlMutation} /></AdminOnly>} />
      <Route path="bowls/:id" element={<Detail title={t('routes.bowls')} detailHook={useGetBowlQuery} listPath="/bowls" itemKind="bowl" />} />
      <Route path="bowls/:id/edit" element={<AdminOnly><EditItem title={t('routes.editBowl')} detailHook={useGetBowlQuery} updateHook={useUpdateBowlMutation} /></AdminOnly>} />

      <Route path="tobaccos" element={
        <Catalog title={t('routes.tobaccos')} listHook={useGetTobaccosQuery}
          deleteHook={useDeleteTobaccoMutation} onCreatePath="/tobaccos/create" onEditPath={(id) => `/tobaccos/${id}/edit`} itemKind="tobacco" />
      } />
      <Route path="tobaccos/create" element={<AdminOnly><CreateItem title={t('routes.createTobacco')} createHook={useCreateTobaccoMutation} /></AdminOnly>} />
      <Route path="tobaccos/:id" element={<Detail title={t('routes.tobaccos')} detailHook={useGetTobaccoQuery} listPath="/tobaccos" itemKind="tobacco" />} />
      <Route path="tobaccos/:id/edit" element={<AdminOnly><EditItem title={t('routes.editTobacco')} detailHook={useGetTobaccoQuery} updateHook={useUpdateTobaccoMutation} /></AdminOnly>} />

      <Route path="coals" element={
        <Catalog title={t('routes.coals')} listHook={useGetCoalsQuery}
          deleteHook={useDeleteCoalMutation} onCreatePath="/coals/create" onEditPath={(id) => `/coals/${id}/edit`} itemKind="coal" />
      } />
      <Route path="coals/create" element={<AdminOnly><CreateItem title={t('routes.createCoal')} createHook={useCreateCoalMutation} /></AdminOnly>} />
      <Route path="coals/:id" element={<Detail title={t('routes.coals')} detailHook={useGetCoalQuery} listPath="/coals" itemKind="coal" />} />
      <Route path="coals/:id/edit" element={<AdminOnly><EditItem title={t('routes.editCoal')} detailHook={useGetCoalQuery} updateHook={useUpdateCoalMutation} /></AdminOnly>} />

      <Route path="kalouds" element={
        <Catalog title={t('routes.kalouds')} listHook={useGetKaloudsQuery}
          deleteHook={useDeleteKaloudMutation} onCreatePath="/kalouds/create" onEditPath={(id) => `/kalouds/${id}/edit`} itemKind="kaloud" />
      } />
      <Route path="kalouds/create" element={<AdminOnly><CreateItem title={t('routes.createKaloud')} createHook={useCreateKaloudMutation} /></AdminOnly>} />
      <Route path="kalouds/:id" element={<Detail title={t('routes.kalouds')} detailHook={useGetKaloudQuery} listPath="/kalouds" />} />
      <Route path="kalouds/:id/edit" element={<AdminOnly><EditItem title={t('routes.editKaloud')} detailHook={useGetKaloudQuery} updateHook={useUpdateKaloudMutation} /></AdminOnly>} />

      <Route path="coal-placements" element={<Navigate to="/admin/coal-placements" replace />} />
      <Route path="coal-placements/create" element={<Navigate to="/admin/coal-placements/create" replace />} />
      <Route path="coal-placements/:id" element={<LegacyAdminCatalogRedirect base="coal-placements" />} />
      <Route path="coal-placements/:id/edit" element={<LegacyAdminCatalogRedirect base="coal-placements" edit />} />
      <Route path="bowl-setup-types" element={<Navigate to="/admin/bowl-setup-types" replace />} />
      <Route path="bowl-setup-types/create" element={<Navigate to="/admin/bowl-setup-types/create" replace />} />
      <Route path="bowl-setup-types/:id" element={<LegacyAdminCatalogRedirect base="bowl-setup-types" />} />
      <Route path="bowl-setup-types/:id/edit" element={<LegacyAdminCatalogRedirect base="bowl-setup-types" edit />} />

      <Route path="admin/coal-placements" element={
        <AdminOnly>
          <Catalog title={t('routes.coalPlacements')} listHook={useGetCoalPlacementsQuery}
            deleteHook={useDeleteCoalPlacementMutation} onCreatePath="/admin/coal-placements/create" onEditPath={(id) => `/admin/coal-placements/${id}/edit`} itemKind="placement" />
        </AdminOnly>
      } />
      <Route path="admin/coal-placements/create" element={
        <AdminOnly>
          <CreateItem title={t('routes.createCoalPlacement')} createHook={useCreateCoalPlacementMutation} />
        </AdminOnly>
      } />
      <Route path="admin/coal-placements/:id" element={
        <AdminOnly>
          <Detail title={t('routes.coalPlacements')} detailHook={useGetCoalPlacementQuery} listPath="/admin/coal-placements" itemKind="placement" />
        </AdminOnly>
      } />
      <Route path="admin/coal-placements/:id/edit" element={
        <AdminOnly>
          <EditItem title={t('routes.editCoalPlacement')} detailHook={useGetCoalPlacementQuery} updateHook={useUpdateCoalPlacementMutation} />
        </AdminOnly>
      } />

      <Route path="admin/bowl-setup-types" element={
        <AdminOnly>
          <Catalog title={t('routes.setupTypes')} listHook={useGetBowlSetupTypesQuery}
            deleteHook={useDeleteBowlSetupTypeMutation} onCreatePath="/admin/bowl-setup-types/create" onEditPath={(id) => `/admin/bowl-setup-types/${id}/edit`} itemKind="setupType" />
        </AdminOnly>
      } />
      <Route path="admin/bowl-setup-types/create" element={
        <AdminOnly>
          <CreateItem title={t('routes.createSetupType')} createHook={useCreateBowlSetupTypeMutation} />
        </AdminOnly>
      } />
      <Route path="admin/bowl-setup-types/:id" element={
        <AdminOnly>
          <Detail title={t('routes.setupTypes')} detailHook={useGetBowlSetupTypeQuery} listPath="/admin/bowl-setup-types" />
        </AdminOnly>
      } />
      <Route path="admin/bowl-setup-types/:id/edit" element={
        <AdminOnly>
          <EditItem title={t('routes.editSetupType')} detailHook={useGetBowlSetupTypeQuery} updateHook={useUpdateBowlSetupTypeMutation} />
        </AdminOnly>
      } />

      <Route path="setups/create" element={<SetupForm />} />
      <Route path="setups/:id" element={<SetupDetail />} />
      <Route path="setups/:id/edit" element={<EditSetup />} />
      <Route path="ai-chat" element={<AgentChat />} />

      <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Suspense>
  </>
  )
}
