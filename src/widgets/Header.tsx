import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'
import { Button } from '../shared/ui/Button'
import { useGetProfileQuery, useLogoutMutation } from '../shared/api'
import { AuthModal } from './AuthModal'
import { LogoutIcon, PlusIcon, ShishaGuidLogo } from '../shared/ui/Icons'
import { RoleBadge } from '../shared/ui/RoleBadge'
import { UserBadges } from '../shared/ui/UserBadges'
import { clearAuthSession } from '../shared/authToken'
import { useHasAuthToken } from '../shared/useAuthToken'

const HeaderBar = tw.header`bg-[rgb(var(--color-surface-inverse))]/95 backdrop-blur-xl border-b border-[rgb(var(--color-border))]`
const Inner = tw.div`w-full max-w-[1160px] mx-auto px-4 h-14 flex items-center justify-between gap-3 min-w-0 sm:px-5 sm:gap-4`
const NewSetupPlaceholder = tw.span`hidden h-9 w-[118px] shrink-0 opacity-0 sm:inline-flex`
const ProfilePlaceholder = tw.span`flex h-9 w-[148px] shrink-0 opacity-0`
const NewSetupLink = styled(Link)`
  ${tw`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-black text-white transition-all duration-150 sm:h-9 sm:px-3.5 sm:text-[13px]`}
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 42%),
    rgb(var(--color-accent));
  box-shadow:
    0 0 0 1px rgba(255, 248, 241, 0.22),
    0 12px 26px -14px rgba(222, 139, 87, 0.95);

  &:hover {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 42%),
      rgb(var(--color-accent-hover));
    box-shadow:
      0 0 0 1px rgba(255, 248, 241, 0.28),
      0 16px 30px -16px rgba(222, 139, 87, 1);
  }

  &:active {
    transform: scale(0.98);
  }

  & > svg[aria-hidden="true"] {
    width: 13px;
    height: 13px;
  }
`

export const Header = () => {
  const hasToken = useHasAuthToken()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const [logout] = useLogoutMutation()
  const [authOpen, setAuthOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isResolvingAuth = hasToken === undefined
  const isResolvingProfile = hasToken === true && !profile

  const handleLogout = async () => {
    await logout()
    clearAuthSession()
  }

  return (
    <>
      <HeaderBar>
        <Inner>
          <div tw="flex items-center gap-6 min-w-0">
            <Link to="/" tw="flex items-center gap-2.5 font-semibold text-[15px] text-[rgb(var(--color-text-inverse))] shrink-0">
              <ShishaGuidLogo size={24} tw="text-[rgb(var(--color-accent))]" />
              <span tw="hidden sm:inline">ShishaGuid-v2</span>
            </Link>
            {profile && (
              <NewSetupLink to="/setups/create">
                <PlusIcon />
                <span>{t('feed.newSetup')}</span>
              </NewSetupLink>
            )}
            {(isResolvingAuth || isResolvingProfile) && <NewSetupPlaceholder aria-hidden="true" />}
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
            ) : isResolvingAuth || isResolvingProfile ? (
              <ProfilePlaceholder aria-hidden="true" />
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
