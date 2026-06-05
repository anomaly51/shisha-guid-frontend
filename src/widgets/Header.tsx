import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'
import { Button } from '../shared/ui/Button'
import {
  useGetCoalsQuery,
  useGetNotificationsQuery,
  useGetProfileQuery,
  useGetSetupsQuery,
  useGetTobaccosQuery,
  useLogoutMutation,
  useMarkNotificationsReadMutation,
  useSearchUsersQuery,
} from '../shared/api'
import { AuthModal } from './AuthModal'
import { LogoutIcon, PlusIcon, ShishaGuidLogo } from '../shared/ui/Icons'
import { RoleBadge } from '../shared/ui/RoleBadge'
import { UserBadges } from '../shared/ui/UserBadges'
import { clearAuthSession, getAuthToken, refreshAuthToken } from '../shared/authToken'
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

const normalizePageItems = (data: any) => (Array.isArray(data) ? data : data?.items || [])
const searchHistoryKey = 'shisha-guid:global-search-history'

const useDebouncedValue = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debounced
}

const GlobalSearch = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(window.localStorage.getItem(searchHistoryKey) || '[]')
    } catch {
      return []
    }
  })
  const navigate = useNavigate()
  const debouncedQuery = useDebouncedValue(query, 250)
  const search = debouncedQuery.trim()
  const canSearch = open && search.length >= 2
  const { data: setups } = useGetSetupsQuery({ search, limit: 5 }, { skip: !canSearch })
  const { data: tobaccos } = useGetTobaccosQuery({ search, limit: 5 }, { skip: !canSearch })
  const { data: coals } = useGetCoalsQuery({ search, limit: 5 }, { skip: !canSearch })
  const { data: users = [] } = useSearchUsersQuery({ nickname: search, limit: 5 }, { skip: !canSearch })
  const setupItems = useMemo(() => normalizePageItems(setups).slice(0, 5), [setups])
  const tobaccoItems = useMemo(() => normalizePageItems(tobaccos).slice(0, 5), [tobaccos])
  const coalItems = useMemo(() => normalizePageItems(coals).slice(0, 5), [coals])

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  if (!open) return null

  const go = (path: string) => {
    const clean = query.trim()
    if (clean) {
      const nextHistory = [clean, ...history.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6)
      setHistory(nextHistory)
      window.localStorage.setItem(searchHistoryKey, JSON.stringify(nextHistory))
    }
    onClose()
    navigate(path)
  }

  return (
    <div tw="fixed inset-0 z-50 bg-black/35 px-3 py-16 backdrop-blur-sm" onMouseDown={onClose}>
      <div tw="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[0_28px_80px_-38px_rgba(0,0,0,0.65)]" onMouseDown={(event) => event.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose()
          }}
          placeholder="Поиск забивок, табаков, углей и авторов"
          tw="h-12 w-full border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 text-[14px] font-semibold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-subtle))]"
        />
        <div tw="max-h-[70vh] overflow-y-auto p-3">
          {!canSearch ? (
            <div tw="px-2 py-4">
              <p tw="py-2 text-center text-[13px] font-medium text-[rgb(var(--color-text-subtle))]">Введите минимум 2 символа.</p>
              {history.length > 0 && (
                <div tw="mt-3">
                  <p tw="mb-1 text-[10px] font-black uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Недавние запросы</p>
                  <div tw="flex flex-wrap gap-1.5">
                    {history.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setQuery(item)}
                        tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-accent-muted))]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div tw="grid gap-3">
              {[
                ['Забивки', setupItems, (item: any) => `/setups/${item.id}`],
                ['Табаки', tobaccoItems, (item: any) => `/tobaccos/${item.id}`],
                ['Угли', coalItems, (item: any) => `/coals/${item.id}`],
                ['Авторы', users.slice(0, 5), (item: any) => `/users/${item.id}`],
              ].map(([title, items, pathFor]: any) => (
                <section key={title}>
                  <p tw="mb-1 px-2 text-[10px] font-black uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{title}</p>
                  {items.length ? items.map((item: any) => (
                    <button
                      key={`${title}-${item.id}`}
                      type="button"
                      onClick={() => go(pathFor(item))}
                      tw="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-[13px] font-semibold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-accent-muted))]"
                    >
                      <span tw="min-w-0 truncate">{item.name || item.nickname || item.email}</span>
                      {item.brand && <span tw="shrink-0 text-[11px] font-bold text-[rgb(var(--color-text-subtle))]">{item.brand}</span>}
                    </button>
                  )) : (
                    <p tw="px-2 py-1 text-[12px] font-medium text-[rgb(var(--color-text-subtle))]">Нет совпадений.</p>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Header = () => {
  const hasToken = useHasAuthToken()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken })
  const { data: notifications, refetch: refetchNotifications } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000,
    skip: !hasToken,
  })
  const [logout] = useLogoutMutation()
  const [markNotificationsRead] = useMarkNotificationsReadMutation()
  const [authOpen, setAuthOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isResolvingAuth = hasToken === undefined
  const isResolvingProfile = hasToken === true && !profile
  const unreadCount = notifications?.unread_count || 0

  const handleLogout = async () => {
    await logout()
    clearAuthSession()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!hasToken || typeof window === 'undefined') return undefined
    let controller: AbortController | null = null
    let reconnectTimeout: number | undefined
    let closed = false
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

    const connect = async () => {
      const token = getAuthToken() || await refreshAuthToken(apiBaseUrl)
      if (!token || closed) return
      controller?.abort()
      controller = new AbortController()

      try {
        const response = await fetch(`${apiBaseUrl}/profile/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (response.status === 401) {
          await refreshAuthToken(apiBaseUrl)
          throw new Error('notification stream unauthorized')
        }
        if (!response.ok || !response.body) throw new Error('notification stream failed')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!closed) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() || ''
          chunks.forEach((chunk) => {
            if (chunk.startsWith('event: notification')) refetchNotifications()
          })
        }
        if (!closed) reconnectTimeout = window.setTimeout(connect, 5000)
      } catch {
        if (!closed) reconnectTimeout = window.setTimeout(connect, 5000)
      }
    }

    void connect()
    return () => {
      closed = true
      if (reconnectTimeout) window.clearTimeout(reconnectTimeout)
      controller?.abort()
    }
  }, [hasToken, refetchNotifications])

  return (
    <>
      <HeaderBar>
        <Inner>
          <div tw="flex items-center gap-6 min-w-0">
            <Link to="/" tw="flex items-center gap-2.5 font-semibold text-[15px] text-[rgb(var(--color-text-inverse))] shrink-0">
              <ShishaGuidLogo size={24} tw="text-[rgb(var(--color-accent))]" />
              <span tw="hidden sm:inline">ShishaGuid V2</span>
            </Link>
            {profile && (
              <NewSetupLink to="/setups/create">
                <PlusIcon />
                <span>{t('feed.newSetup')}</span>
              </NewSetupLink>
            )}
            <Link
              to="/authors"
              tw="hidden text-[13px] font-semibold text-[rgb(var(--color-text-subtle))] transition-colors hover:text-[rgb(var(--color-text-inverse))] md:inline-flex"
            >
              Авторы
            </Link>
            {(isResolvingAuth || isResolvingProfile) && <NewSetupPlaceholder aria-hidden="true" />}
          </div>

          <div tw="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              tw="hidden h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-[rgb(var(--color-text-subtle))] transition-colors hover:bg-white/10 hover:text-[rgb(var(--color-text-inverse))] sm:inline-flex"
            >
              Поиск
              <span tw="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</span>
            </button>
            {profile ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    const target = notifications?.items?.find((item) => item.bowl_setup_id || item.actor_id)
                    await markNotificationsRead()
                    if (target?.bowl_setup_id) navigate(`/setups/${target.bowl_setup_id}`)
                    else if (target?.actor_id) navigate(`/users/${target.actor_id}`)
                  }}
                  aria-label={unreadCount ? `Непрочитанные отзывы: ${unreadCount}` : 'Нет непрочитанных отзывов'}
                  title={unreadCount ? `Непрочитанные отзывы: ${unreadCount}` : 'Нет непрочитанных отзывов'}
                  tw="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[13px] font-black text-[rgb(var(--color-text-inverse))] transition-colors hover:bg-white/10"
                >
                  <span aria-hidden="true">!</span>
                  {unreadCount > 0 && (
                    <span tw="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[rgb(var(--color-accent))] px-1 text-center text-[10px] font-black leading-[18px] text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
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
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
