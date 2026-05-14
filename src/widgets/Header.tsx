import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { Button } from '../shared/ui/Button'
import { useGetProfileQuery, useLogoutMutation } from '../shared/api'
import { AuthModal } from './AuthModal'

const HeaderBar = tw.header`sticky top-0 z-50 bg-white border-b border-[#CCC] h-12 flex items-center px-4 justify-between`
const Logo = tw(Link)`flex items-center gap-2 text-xl font-bold text-[#1A1A1B] hover:text-[#FF4500] transition-colors`
const LogoIcon = tw.div`w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center text-white text-sm font-extrabold`
const UserSection = tw.div`flex items-center gap-3 text-sm`

export const Header = () => {
  const { data: profile } = useGetProfileQuery()
  const [logout] = useLogoutMutation()
  const [authOpen, setAuthOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    localStorage.removeItem('token')
    window.location.reload()
  }

  return (
    <>
      <HeaderBar>
        <div tw="flex items-center gap-4">
          <Logo to="/">
            <LogoIcon>SG</LogoIcon>
            <span tw="hidden sm:inline">ShishaGuid</span>
          </Logo>
        </div>
        <UserSection>
          {profile ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                tw="flex items-center gap-1.5 hover:underline text-[#1A1A1B]"
              >
                <span tw="w-6 h-6 bg-[#FF4500] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {(profile.nickname || profile.email)[0].toUpperCase()}
                </span>
                <span tw="hidden sm:inline font-medium">{profile.nickname || profile.email}</span>
              </button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log Out
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setAuthOpen(true)}>
              Log In
            </Button>
          )}
        </UserSection>
      </HeaderBar>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
