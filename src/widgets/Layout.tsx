import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import tw from 'twin.macro'
import { Button } from '../shared/ui/Button'
import { useGetProfileQuery } from '../shared/api'

export const Layout = () => {
  const { data: profile } = useGetProfileQuery()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Feed' },
    { path: '/bowls', label: 'Bowls' },
    { path: '/tobaccos', label: 'Tobaccos' },
    { path: '/coals', label: 'Coals' },
  ]

  return (
    <div tw="min-h-screen bg-[#DAE0E6]">
      <header tw="sticky top-0 z-50 bg-white border-b border-gray-200 h-12 flex items-center px-4 justify-between">
        <Link to="/" tw="flex items-center gap-2 text-xl font-bold text-gray-900">
          <div tw="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
            SG
          </div>
          ShishaGuid
        </Link>
        <div tw="flex items-center gap-4">
          {profile ? (
            <span tw="text-sm font-medium text-gray-700">{profile.nickname || profile.email}</span>
          ) : (
            <Button variant="primary">Log In</Button>
          )}
        </div>
      </header>

      <div tw="max-w-[1000px] mx-auto flex gap-6 pt-6 px-4">
        <aside tw="hidden md:block w-[280px] shrink-0">
          <div tw="bg-white border border-gray-200 rounded-md p-4 sticky top-[80px]">
            <h2 tw="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wider">Navigation</h2>
            <nav tw="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                    $fullWidth
                    tw="justify-start"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main tw="flex-1 max-w-[640px] flex flex-col gap-4 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
