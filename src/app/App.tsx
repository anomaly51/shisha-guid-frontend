import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './store'
import { GlobalStyles } from './GlobalStyles'
import { Layout } from '../widgets/Layout'
import { Feed } from '../pages/Feed'
import { Catalog } from '../pages/Catalog'
import { Detail } from '../pages/Detail'
import { CreateItem } from '../pages/CreateItem'
import { EditItem } from '../pages/EditItem'
import { SetupForm } from '../pages/SetupForm'
import { Profile } from '../pages/Profile'
import {
  useGetBowlsQuery, useDeleteBowlMutation, useCreateBowlMutation, useGetBowlQuery, useUpdateBowlMutation,
  useGetTobaccosQuery, useDeleteTobaccoMutation, useCreateTobaccoMutation, useGetTobaccoQuery, useUpdateTobaccoMutation,
  useGetCoalsQuery, useDeleteCoalMutation, useCreateCoalMutation, useGetCoalQuery, useUpdateCoalMutation,
  useGetKaloudsQuery, useDeleteKaloudMutation, useCreateKaloudMutation, useGetKaloudQuery, useUpdateKaloudMutation,
  useGetCoalPlacementsQuery, useDeleteCoalPlacementMutation, useCreateCoalPlacementMutation, useGetCoalPlacementQuery, useUpdateCoalPlacementMutation,
  useGetBowlSetupTypesQuery, useDeleteBowlSetupTypeMutation, useCreateBowlSetupTypeMutation, useGetBowlSetupTypeQuery, useUpdateBowlSetupTypeMutation,
} from '../shared/api'

export const App = () => (
  <Provider store={store}>
    <GlobalStyles />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Feed />} />

          <Route path="bowls" element={
            <Catalog title="Bowls" listHook={useGetBowlsQuery} deleteHook={useDeleteBowlMutation}
              onCreatePath="/bowls/create" onDetailPath={(id) => `/bowls/${id}`} showVote />
          } />
          <Route path="bowls/create" element={<CreateItem title="Create Bowl" createHook={useCreateBowlMutation} />} />
          <Route path="bowls/:id" element={<Detail title="Bowls" detailHook={useGetBowlQuery} listPath="/bowls" />} />
          <Route path="bowls/:id/edit" element={<EditItem title="Edit Bowl" detailHook={useGetBowlQuery} updateHook={useUpdateBowlMutation} />} />

          <Route path="tobaccos" element={
            <Catalog title="Tobaccos" listHook={useGetTobaccosQuery} deleteHook={useDeleteTobaccoMutation}
              onCreatePath="/tobaccos/create" onDetailPath={(id) => `/tobaccos/${id}`} showVote />
          } />
          <Route path="tobaccos/create" element={<CreateItem title="Create Tobacco" createHook={useCreateTobaccoMutation} />} />
          <Route path="tobaccos/:id" element={<Detail title="Tobaccos" detailHook={useGetTobaccoQuery} listPath="/tobaccos" />} />
          <Route path="tobaccos/:id/edit" element={<EditItem title="Edit Tobacco" detailHook={useGetTobaccoQuery} updateHook={useUpdateTobaccoMutation} />} />

          <Route path="coals" element={
            <Catalog title="Coals" listHook={useGetCoalsQuery} deleteHook={useDeleteCoalMutation}
              onCreatePath="/coals/create" onDetailPath={(id) => `/coals/${id}`} showVote />
          } />
          <Route path="coals/create" element={<CreateItem title="Create Coal" createHook={useCreateCoalMutation} />} />
          <Route path="coals/:id" element={<Detail title="Coals" detailHook={useGetCoalQuery} listPath="/coals" />} />
          <Route path="coals/:id/edit" element={<EditItem title="Edit Coal" detailHook={useGetCoalQuery} updateHook={useUpdateCoalMutation} />} />

          <Route path="kalouds" element={
            <Catalog title="Kalouds" listHook={useGetKaloudsQuery} deleteHook={useDeleteKaloudMutation}
              onCreatePath="/kalouds/create" onDetailPath={(id) => `/kalouds/${id}`} showVote />
          } />
          <Route path="kalouds/create" element={<CreateItem title="Create Kaloud" createHook={useCreateKaloudMutation} />} />
          <Route path="kalouds/:id" element={<Detail title="Kalouds" detailHook={useGetKaloudQuery} listPath="/kalouds" />} />
          <Route path="kalouds/:id/edit" element={<EditItem title="Edit Kaloud" detailHook={useGetKaloudQuery} updateHook={useUpdateKaloudMutation} />} />

          <Route path="coal-placements" element={
            <Catalog title="Coal Placements" listHook={useGetCoalPlacementsQuery} deleteHook={useDeleteCoalPlacementMutation}
              onCreatePath="/coal-placements/create" onDetailPath={(id) => `/coal-placements/${id}`} />
          } />
          <Route path="coal-placements/create" element={<CreateItem title="Create Coal Placement" createHook={useCreateCoalPlacementMutation} />} />
          <Route path="coal-placements/:id" element={<Detail title="Coal Placements" detailHook={useGetCoalPlacementQuery} listPath="/coal-placements" />} />
          <Route path="coal-placements/:id/edit" element={<EditItem title="Edit Coal Placement" detailHook={useGetCoalPlacementQuery} updateHook={useUpdateCoalPlacementMutation} />} />

          <Route path="bowl-setup-types" element={
            <Catalog title="Bowl Setup Types" listHook={useGetBowlSetupTypesQuery} deleteHook={useDeleteBowlSetupTypeMutation}
              onCreatePath="/bowl-setup-types/create" onDetailPath={(id) => `/bowl-setup-types/${id}`} />
          } />
          <Route path="bowl-setup-types/create" element={<CreateItem title="Create Bowl Setup Type" createHook={useCreateBowlSetupTypeMutation} />} />
          <Route path="bowl-setup-types/:id" element={<Detail title="Bowl Setup Types" detailHook={useGetBowlSetupTypeQuery} listPath="/bowl-setup-types" />} />
          <Route path="bowl-setup-types/:id/edit" element={<EditItem title="Edit Bowl Setup Type" detailHook={useGetBowlSetupTypeQuery} updateHook={useUpdateBowlSetupTypeMutation} />} />

          <Route path="setups/create" element={<SetupForm />} />

          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </Provider>
)
