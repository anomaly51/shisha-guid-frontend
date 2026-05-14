import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import tw from 'twin.macro'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/bowls', label: 'Bowls' },
  { path: '/tobaccos', label: 'Tobaccos' },
  { path: '/coals', label: 'Coals' },
  { path: '/kalouds', label: 'Kalouds' },
  { path: '/coal-placements', label: 'Placements' },
  { path: '/bowl-setup-types', label: 'Setup Types' },
]

export const Sidebar = () => {
  const location = useLocation()

  return (
    <div tw="bg-white border border-[#CCC] rounded-[4px] overflow-hidden">
      <div tw="h-10 bg-[#0079D3] flex items-center px-3">
        <span tw="text-white text-sm font-bold">ShishaGuid</span>
      </div>
      <div tw="py-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              css={[
                tw`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors`,
                active
                  ? tw`bg-[#F6F7F8] text-[#0079D3] border-l-[3px] border-[#0079D3]`
                  : tw`text-[#1A1A1B] border-l-[3px] border-transparent hover:bg-[#F6F7F8]`,
              ]}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
