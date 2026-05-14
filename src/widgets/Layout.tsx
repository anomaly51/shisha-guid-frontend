import React from 'react'
import { Outlet } from 'react-router-dom'
import tw from 'twin.macro'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export const Layout = () => (
  <div tw="min-h-screen bg-[#DAE0E6]">
    <Header />
    <div tw="max-w-[1000px] mx-auto flex gap-6 pt-6 px-4">
      <aside tw="hidden md:block w-[270px] shrink-0">
        <div tw="sticky top-[64px]">
          <Sidebar />
        </div>
      </aside>
      <main tw="flex-1 min-w-0 pb-12">
        <Outlet />
      </main>
    </div>
  </div>
)
