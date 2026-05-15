import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { Button } from '../shared/ui/Button'
import { useGetProfileQuery, useLogoutMutation } from '../shared/api'
import { AuthModal } from './AuthModal'
import { LogoutIcon, PlusIcon, ShishaGuidLogo } from '../shared/ui/Icons'
import { RoleBadge } from '../shared/ui/RoleBadge'
import { UserBadges } from '../shared/ui/UserBadges'

const HeaderBar = tw.header`bg-[rgb(var(--color-surface-inverse))]/95 backdrop-blur-xl border-b border-[rgb(var(--color-border))]`
const Inner = tw.div`w-full max-w-[1160px] mx-auto px-5 h-14 flex items-center justify-between gap-4 min-w-0`

export const Header = () => {
  const { data: profile } = useGetProfileQuery()
  const [logout] = useLogoutMutation()
  const [authOpen, setAuthOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = async () => {
    await logout()
    localStorage.removeItem('token')
    window.location.reload()
  }

  return (
    <>
      <HeaderBar>
        <Inner>
          <div tw="flex items-center gap-6 min-w-0">
            <Link to="/" tw="flex items-center gap-2.5 font-semibold text-[15px] text-[rgb(var(--color-text-inverse))] shrink-0">
              <ShishaGuidLogo size={24} tw="text-[rgb(var(--color-accent))]" />
              <span tw="hidden sm:inline">ShishaGuid</span>
            </Link>
            {profile && (
              <Link to="/setups/create" tw="hidden sm:flex">
                <Button variant="primary" size="sm">
                  <PlusIcon />
                  {t('feed.newSetup')}
                </Button>
              </Link>
            )}
          </div>

          <div tw="flex items-center gap-2">
            {profile ? (
              <>
                <button
                  onClick={() => navigate('/profile')}
                  tw="flex items-center gap-2 text-[rgb(var(--color-text-inverse))] hover:opacity-80 transition-opacity"
                >
                  <span tw="w-7 h-7 bg-[rgb(var(--color-surface-subtle))] rounded-xl flex items-center justify-center text-[rgb(var(--color-accent-soft))] text-xs font-semibold">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" tw="w-full h-full object-cover rounded-xl" />
                    ) : (
                      (profile.nickname || profile.email)[0].toUpperCase()
                    )}
                  </span>
                  <span tw="hidden sm:inline text-[13px] font-medium">{profile.nickname || profile.email}</span>
                  <RoleBadge role={profile.role} tone="dark" size="xs" />
                  <span tw="hidden md:inline-flex">
                    <UserBadges badges={profile.badges} maxVisible={2} />
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  tw="hidden sm:flex items-center gap-1 text-xs text-[rgb(var(--color-text-subtle))] hover:text-[rgb(var(--color-text-inverse))] transition-colors font-medium"
                >
                  <LogoutIcon />
                  <span>{t('profile.logout')}</span>
                </button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setAuthOpen(true)}>
                {t('auth.signIn')}
              </Button>
            )}
          </div>
        </Inner>
      </HeaderBar>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
