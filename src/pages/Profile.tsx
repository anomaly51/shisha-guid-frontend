import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Input } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import {
  type AdminUser,
  type BadgeEffect,
  useGetAdminUsersQuery,
  useGetProfileQuery,
  useUpdateAdminUserMutation,
  useUpdateProfileMutation,
  useLogoutMutation,
  useUploadMediaMutation,
} from '../shared/api'
import {
  ACCEPTED_MEDIA_INPUT,
  isAcceptedMediaFile,
} from '../shared/ui/PhotoUploader'
import { CatalogIcon, CheckIcon, LockIcon, LogoutIcon } from '../shared/ui/Icons'
import { LANGUAGES, type LanguageCode } from '../shared/i18n'
import { RoleBadge } from '../shared/ui/RoleBadge'
import { UserBadges } from '../shared/ui/UserBadges'
import { useTheme, type ThemePreference } from '../app/theme'
import { clearAuthSession, hasAuthToken } from '../shared/authToken'

const badgeEffectOptions: BadgeEffect[] = ['none', 'frost', 'fire', 'chemical', 'electric', 'cosmic', 'shimmer']

const getUserBadge = (user: AdminUser) => user.badges?.[0]
const defaultBadgeColor = '#8B4A2B'

const AdminUserRow = ({ user }: { user: AdminUser }) => {
  const userBadge = getUserBadge(user)
  const [role, setRole] = useState(user.role)
  const [isBanned, setIsBanned] = useState(user.is_banned)
  const [badgeLabel, setBadgeLabel] = useState(userBadge?.label || '')
  const [badgeColor, setBadgeColor] = useState(userBadge?.color || defaultBadgeColor)
  const [badgeEffect, setBadgeEffect] = useState<BadgeEffect>(userBadge?.effect || 'none')
  const [message, setMessage] = useState('')
  const [updateUser, { isLoading }] = useUpdateAdminUserMutation()

  useEffect(() => {
    const nextBadge = getUserBadge(user)
    setRole(user.role)
    setIsBanned(user.is_banned)
    setBadgeLabel(nextBadge?.label || '')
    setBadgeColor(nextBadge?.color || defaultBadgeColor)
    setBadgeEffect(nextBadge?.effect || 'none')
  }, [user])

  const normalizedRole = role.trim().toLowerCase()
  const roleIsValid = /^[a-z][a-z0-9_]{0,31}$/.test(normalizedRole)
  const normalizedBadgeColor = badgeColor.trim().toUpperCase()
  const badgeColorIsValid = /^#[0-9A-F]{6}$/.test(normalizedBadgeColor)
  const previewBadge = badgeLabel.trim()
    ? [{ label: badgeLabel.trim(), color: badgeColorIsValid ? normalizedBadgeColor : defaultBadgeColor, effect: badgeEffect }]
    : []

  const handleSave = async () => {
    setMessage('')
    if (!roleIsValid) {
      setMessage('Role must be english_id')
      return
    }
    if (badgeLabel.trim() && !badgeColorIsValid) {
      setMessage('Bad hex')
      return
    }
    try {
      await updateUser({
        id: user.id,
        body: {
          role: normalizedRole,
          is_banned: isBanned,
          badge_label: badgeLabel.trim() || null,
          badge_color: badgeLabel.trim() ? normalizedBadgeColor : null,
          badge_effect: badgeEffect,
        },
      }).unwrap()
      setMessage('Saved')
    } catch {
      setMessage('Failed')
    }
  }

  return (
    <div tw="grid min-w-[1060px] grid-cols-[minmax(180px,1.3fr)_120px_76px_minmax(140px,0.8fr)_116px_122px_92px_86px] items-center gap-2 border-t border-[rgb(var(--color-border))] px-3 py-2 text-[12px]">
      <div tw="min-w-0">
        <div tw="truncate font-semibold text-[rgb(var(--color-text))]">{user.nickname || user.email}</div>
        <div tw="truncate text-[10px] text-[rgb(var(--color-text-subtle))]">{user.email}</div>
      </div>
      <input
        value={role}
        onChange={(event) => {
          setRole(event.target.value)
          setMessage('')
        }}
        tw="h-8 rounded-md border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-2 text-[12px] font-semibold text-[rgb(var(--color-text))] outline-none focus:border-[rgb(var(--color-accent))]"
      />
      <label tw="flex items-center gap-1.5 text-[11px] font-semibold text-[rgb(var(--color-text-muted))]">
        <input
          type="checkbox"
          checked={isBanned}
          onChange={(event) => {
            setIsBanned(event.target.checked)
            setMessage('')
          }}
          tw="h-3.5 w-3.5 accent-[rgb(var(--color-accent))]"
        />
        ban
      </label>
      <div tw="min-w-0">
        <input
          value={badgeLabel}
          onChange={(event) => {
            setBadgeLabel(event.target.value)
            setMessage('')
          }}
          placeholder="one badge"
          tw="h-8 w-full rounded-md border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-2 text-[12px] text-[rgb(var(--color-text))] outline-none focus:border-[rgb(var(--color-accent))]"
        />
      </div>
      <div tw="flex items-center gap-1.5">
        <input
          type="color"
          value={badgeColorIsValid ? normalizedBadgeColor : defaultBadgeColor}
          onChange={(event) => {
            setBadgeColor(event.target.value.toUpperCase())
            setMessage('')
          }}
          tw="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] p-0.5"
        />
        <input
          value={badgeColor}
          onChange={(event) => {
            setBadgeColor(event.target.value)
            setMessage('')
          }}
          placeholder="#8B4A2B"
          tw="h-8 min-w-0 flex-1 rounded-md border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-2 text-[11px] font-semibold text-[rgb(var(--color-text))] outline-none focus:border-[rgb(var(--color-accent))]"
        />
      </div>
      <select
        value={badgeEffect}
        onChange={(event) => {
          setBadgeEffect(event.target.value as BadgeEffect)
          setMessage('')
        }}
        tw="h-8 rounded-md border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-2 text-[12px] font-semibold text-[rgb(var(--color-text))] outline-none focus:border-[rgb(var(--color-accent))]"
      >
        {badgeEffectOptions.map((effect) => (
          <option key={effect} value={effect}>{effect}</option>
        ))}
      </select>
      <div tw="min-w-0">
        <UserBadges badges={previewBadge} />
      </div>
      <div tw="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || !roleIsValid || (Boolean(badgeLabel.trim()) && !badgeColorIsValid)}
          tw="h-8 rounded-md bg-[rgb(var(--color-accent))] px-3 text-[11px] font-bold text-white transition-colors hover:bg-[rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? '...' : 'save'}
        </button>
        {message && <span tw="text-[10px] font-semibold text-[rgb(var(--color-text-muted))]">{message}</span>}
      </div>
    </div>
  )
}

const AdminPanel = () => {
  const { data: users = [], isLoading } = useGetAdminUsersQuery()
  const { t } = useTranslation()

  return (
    <Card>
      <div tw="p-3">
        <div tw="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 tw="text-[13px] font-bold uppercase tracking-wide text-[rgb(var(--color-text))]">admin</h2>
            <p tw="text-[11px] text-[rgb(var(--color-text-subtle))]">users, roles, bans, one custom badge with color and animated effect</p>
          </div>
          <span tw="rounded-md bg-[rgb(var(--color-accent-muted))] px-2 py-1 text-[10px] font-bold text-[rgb(var(--color-text-muted))]">{users.length}</span>
        </div>

        <div tw="mb-3 grid gap-2 sm:grid-cols-2">
          <Link
            to="/admin/coal-placements"
            tw="flex items-center gap-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-raised))] px-3 py-3 text-[rgb(var(--color-text))] transition-colors hover:border-[rgb(var(--color-accent-border))] hover:bg-[rgb(var(--color-accent-muted))]"
          >
            <span tw="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-accent))]">
              <CatalogIcon name="placement" size={20} />
            </span>
            <span tw="min-w-0">
              <span tw="block truncate text-[13px] font-bold">{t('routes.coalPlacements')}</span>
              <span tw="block truncate text-[11px] font-medium text-[rgb(var(--color-text-subtle))]">{t('routes.editCoalPlacement')}</span>
            </span>
          </Link>
          <Link
            to="/admin/bowl-setup-types"
            tw="flex items-center gap-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-raised))] px-3 py-3 text-[rgb(var(--color-text))] transition-colors hover:border-[rgb(var(--color-accent-border))] hover:bg-[rgb(var(--color-accent-muted))]"
          >
            <span tw="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-accent))]">
              <CatalogIcon name="setupType" size={20} />
            </span>
            <span tw="min-w-0">
              <span tw="block truncate text-[13px] font-bold">{t('routes.setupTypes')}</span>
              <span tw="block truncate text-[11px] font-medium text-[rgb(var(--color-text-subtle))]">{t('routes.editSetupType')}</span>
            </span>
          </Link>
        </div>

        <div tw="overflow-x-auto rounded-lg border border-[rgb(var(--color-border))]">
          <div tw="grid min-w-[1060px] grid-cols-[minmax(180px,1.3fr)_120px_76px_minmax(140px,0.8fr)_116px_122px_92px_86px] gap-2 bg-[rgb(var(--color-surface-muted))] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
            <span>user</span>
            <span>role</span>
            <span>status</span>
            <span>badge</span>
            <span>color</span>
            <span>effect</span>
            <span>preview</span>
            <span>action</span>
          </div>
          {isLoading ? (
            <div tw="px-3 py-4 text-center text-[12px] font-semibold text-[rgb(var(--color-text-subtle))]">loading...</div>
          ) : (
            users.map((user) => <AdminUserRow key={user.id} user={user} />)
          )}
        </div>
      </div>
    </Card>
  )
}

export const Profile = () => {
  const hasToken = hasAuthToken()
  const { data: profile, isLoading } = useGetProfileQuery(undefined, { skip: !hasToken })
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation()
  const [uploadMedia] = useUploadMediaMutation()
  const [logout] = useLogoutMutation()
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [savedNickname, setSavedNickname] = useState('')
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { i18n, t } = useTranslation()
  const { preference: themePreference, setPreference: setThemePreference } = useTheme()

  useEffect(() => {
    if (!profile) return
    const nextNickname = (profile.nickname || '').trim()
    const nextAvatarUrl = profile.avatar_url || null
    setNickname(nextNickname)
    setAvatarUrl(nextAvatarUrl)
    setSavedNickname(nextNickname)
    setSavedAvatarUrl(nextAvatarUrl)
  }, [profile])

  const displayName = useMemo(() => {
    if (!profile) return ''
    return nickname.trim() || profile.nickname || profile.email
  }, [nickname, profile])

  const initials = useMemo(() => {
    const source = displayName || profile?.email || '?'
    return source.slice(0, 1).toUpperCase()
  }, [displayName, profile?.email])

  const isAdmin = profile?.role === 'admin'

  if (hasToken && isLoading) {
    return (
      <div tw="max-w-5xl">
        <div tw="h-56 bg-[rgb(var(--color-surface))]/80 border border-[rgb(var(--color-border))] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div tw="flex flex-col items-center justify-center py-20 text-center">
        <div tw="w-16 h-16 bg-[rgb(var(--color-surface-muted))] rounded-2xl flex items-center justify-center mb-5">
          <LockIcon tw="text-[rgb(var(--color-text-subtle))]" />
        </div>
        <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))] mb-1">{t('common.signInRequired')}</h2>
        <p tw="text-sm text-[rgb(var(--color-text-subtle))]">{t('profile.signInHint')}</p>
      </div>
    )
  }

  const normalizedNickname = nickname.trim()
  const nicknameChanged = normalizedNickname !== savedNickname
  const avatarChanged = avatarUrl !== savedAvatarUrl
  const hasProfileChanges = nicknameChanged || avatarChanged
  const saveLabel = saving ? t('common.saving') : t('common.saveChanges')
  const applyLabel = saving ? t('common.saving') : t('profile.applyChanges')

  const resetProfileChanges = () => {
    setNickname(savedNickname)
    setAvatarUrl(savedAvatarUrl)
    setMessage('')
    setError('')
  }

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return
    setMessage('')
    setError('')

    if (!isAcceptedMediaFile(file)) {
      setError(t('profile.mediaTypeError', { label: t('common.mediaRules') }))
      return
    }

    setUploading(true)
    try {
      const response = await uploadMedia(file).unwrap()
      setAvatarUrl(response.url)
    } catch {
      setError(t('profile.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!hasProfileChanges) return
    setMessage('')
    setError('')
    const nextNickname = nickname.trim()
    const nextAvatarUrl = avatarUrl
    try {
      await updateProfile({
        nickname: nextNickname || null,
        avatar_url: nextAvatarUrl,
      }).unwrap()
      setNickname(nextNickname)
      setSavedNickname(nextNickname)
      setSavedAvatarUrl(nextAvatarUrl)
      setMessage(t('profile.updated'))
    } catch {
      setError(t('profile.updateFailed'))
    }
  }

  const handleLogout = async () => {
    await logout()
    clearAuthSession()
    window.location.reload()
  }

  return (
    <div tw="max-w-7xl">
      <div tw="mb-4">
        <h1 tw="text-xl font-semibold text-[rgb(var(--color-text))] tracking-tight">{t('profile.title')}</h1>
        <p tw="mt-0.5 text-[13px] text-[rgb(var(--color-text-muted))]">{t('profile.subtitle')}</p>
      </div>

      <div tw="grid lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] gap-4 items-start">
        <Card>
          <div tw="p-4 sm:flex sm:items-start sm:gap-4 sm:p-5 lg:block">
            <div tw="mx-auto aspect-square w-[min(100%,180px)] overflow-hidden rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-inverse))] shadow-[0_18px_42px_-30px_rgba(0,0,0,0.65)] flex items-center justify-center text-4xl font-semibold text-white sm:mx-0 sm:w-32 sm:text-5xl md:w-36 lg:w-full lg:text-6xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" tw="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div tw="mt-4 flex flex-col gap-2 sm:mt-0 sm:min-w-0 sm:flex-1 lg:mt-4">
              <div tw="hidden min-w-0 sm:block lg:hidden">
                <div tw="truncate text-[13px] font-bold text-[rgb(var(--color-text))]">{displayName}</div>
                <div tw="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                  <RoleBadge role={profile.role} size="xs" />
                  <UserBadges badges={profile.badges} maxVisible={2} />
                </div>
              </div>
              <label tw="h-10 px-3 rounded-lg bg-[rgb(var(--color-accent))] text-white flex items-center justify-center text-[13px] font-semibold cursor-pointer hover:bg-[rgb(var(--color-accent-hover))] transition-colors">
                {uploading ? t('common.uploading') : t('profile.uploadAvatar')}
                <input
                  type="file"
                  accept={ACCEPTED_MEDIA_INPUT}
                  disabled={uploading}
                  onChange={(event) => {
                    uploadAvatar(event.target.files?.[0])
                    event.currentTarget.value = ''
                  }}
                  tw="hidden"
                />
              </label>
              <p tw="text-xs text-[rgb(var(--color-text-subtle))] text-center sm:text-left lg:text-center">{t('common.mediaRules')}</p>

              {avatarChanged && (
                <div tw="rounded-lg border border-[rgb(var(--color-accent-border))] bg-[rgb(var(--color-accent-muted))] px-3 py-2.5">
                  <div tw="mb-2 text-center text-[12px] font-bold text-[rgb(var(--color-text))] sm:text-left lg:text-center">{t('profile.avatarPending')}</div>
                  <Button type="button" size="sm" onClick={handleSave} disabled={saving || uploading} $fullWidth>
                    <CheckIcon />
                    {applyLabel}
                  </Button>
                </div>
              )}

              {avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAvatarUrl(null)
                    setMessage('')
                    setError('')
                  }}
                  disabled={saving || uploading}
                  $fullWidth
                >
                  {t('profile.removeMedia')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div tw="p-4 sm:p-5">
            <div tw="mb-5">
              <div tw="flex min-w-0 flex-wrap items-center gap-2">
                <h2 tw="min-w-0 truncate text-xl font-semibold text-[rgb(var(--color-text))] tracking-tight">{displayName}</h2>
                <RoleBadge role={profile.role} />
                <UserBadges badges={profile.badges} maxVisible={2} />
              </div>
              <p tw="mt-1 text-[13px] text-[rgb(var(--color-text-muted))] break-all">{profile.email}</p>
            </div>

            <div tw="flex flex-col gap-3">
              <Input
                label={t('profile.nickname')}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setMessage('')
                  setError('')
                }}
                placeholder={t('profile.nicknamePlaceholder')}
              />

              {nicknameChanged && (
                <div tw="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[rgb(var(--color-accent-border))] bg-[rgb(var(--color-accent-muted))] px-3 py-2.5">
                  <span tw="text-[12px] font-bold text-[rgb(var(--color-text))]">{t('profile.nicknamePending')}</span>
                  <Button type="button" size="sm" onClick={handleSave} disabled={saving || uploading}>
                    <CheckIcon />
                    {applyLabel}
                  </Button>
                </div>
              )}

              <div tw="rounded-lg bg-[rgb(var(--color-accent-muted))] border border-[rgb(var(--color-border))] px-3 py-2.5">
                <div tw="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('common.account')}</div>
                <div tw="mt-1 text-[13px] font-medium text-[rgb(var(--color-text))] break-all">{t('profile.googleConnected', { email: profile.email })}</div>
              </div>

              <div tw="rounded-lg bg-[rgb(var(--color-accent-muted))] border border-[rgb(var(--color-border))] px-3 py-2.5">
                <label tw="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]" htmlFor="profile-language">
                  {t('profile.language')}
                </label>
                <select
                  id="profile-language"
                  value={i18n.language}
                  onChange={(event) => i18n.changeLanguage(event.target.value as LanguageCode)}
                  tw="mt-2 h-10 w-full rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 text-[13px] font-semibold text-[rgb(var(--color-text))] outline-none focus:border-[rgb(var(--color-accent))]"
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>{language.label}</option>
                  ))}
                </select>
              </div>

              <div tw="rounded-lg bg-[rgb(var(--color-accent-muted))] border border-[rgb(var(--color-border))] px-3 py-2.5">
                <div tw="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('profile.theme')}</div>
                <div tw="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-[rgb(var(--color-surface))] p-1">
                  {(['light', 'dark', 'system'] as ThemePreference[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setThemePreference(value)}
                      css={[
                        tw`h-9 rounded-md px-2 text-[12px] font-bold transition-colors`,
                        themePreference === value
                          ? tw`bg-[rgb(var(--color-accent))] text-white shadow-sm`
                          : tw`text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-muted))] hover:text-[rgb(var(--color-text))]`,
                      ]}
                    >
                      {t(`profile.themeOptions.${value}`)}
                    </button>
                  ))}
                </div>
              </div>

              {hasProfileChanges && (
                <div tw="sticky bottom-3 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgb(var(--color-accent-border))] bg-[rgb(var(--color-surface))]/95 px-3 py-3 shadow-[0_16px_42px_-28px_rgba(0,0,0,0.65)] backdrop-blur">
                  <div tw="min-w-0 text-[12px] font-bold text-[rgb(var(--color-text))]">{t('profile.unsavedTitle')}</div>
                  <div tw="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={resetProfileChanges} disabled={saving || uploading}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving || uploading}>
                      <CheckIcon />
                      {saveLabel}
                    </Button>
                  </div>
                </div>
              )}

              <div tw="flex flex-wrap gap-2 pt-1">
                <Button variant="danger" onClick={handleLogout}>
                  <LogoutIcon />
                  {t('profile.logout')}
                </Button>
              </div>

              {message && (
                <div tw="bg-[rgb(var(--color-success-surface))] text-[rgb(var(--color-success))] text-[13px] font-medium px-3 py-2 rounded-lg border border-[rgb(var(--color-success-border))]">
                  {message}
                </div>
              )}
              {error && (
                <div tw="bg-[rgb(var(--color-danger-surface))] text-[rgb(var(--color-danger))] text-[13px] font-medium px-3 py-2 rounded-lg border border-[rgb(var(--color-danger-border))]">
                  {error}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {isAdmin && (
        <div tw="mt-4">
          <AdminPanel />
        </div>
      )}
    </div>
  )
}
