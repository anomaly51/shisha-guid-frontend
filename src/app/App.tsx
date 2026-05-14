import React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './store'
import { GlobalStyles } from './GlobalStyles'
import { Layout } from '../widgets/Layout'
import { Feed } from '../pages/Feed'
import { Catalog } from '../pages/Catalog'
import { useGetBowlsQuery, useGetTobaccosQuery, useGetCoalsQuery } from '../shared/api'

export const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Feed />} />
            <Route path="bowls" element={<Catalog title="Bowls" useQuery={useGetBowlsQuery} />} />
            <Route path="tobaccos" element={<Catalog title="Tobaccos" useQuery={useGetTobaccosQuery} />} />
            <Route path="coals" element={<Catalog title="Coals" useQuery={useGetCoalsQuery} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}
