import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import 'twin.macro'
import {
  useFollowUserMutation,
  useGetProfileQuery,
  useGetPublicProfileQuery,
  useGetUserFollowersQuery,
  useGetUserFollowingQuery,
  useGetUserSetupsQuery,
  useUnfollowUserMutation,
} from '../shared/api'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { Skeleton } from '../shared/ui/Skeleton'
import { AuthorChip } from '../shared/ui/AuthorChip'
import { RoleBadge } from '../shared/ui/RoleBadge'
import { UserBadges } from '../shared/ui/UserBadges'
import { hasAuthToken } from '../shared/authToken'

const normalizePage = (page: any) => Array.isArray(page) ? page : page?.items || []
const PROFILE_SETUP_PAGE_SIZE = 24

export const PublicProfile = () => {
  const { id } = useParams<{ id: string }>()
  const [offset, setOffset] = useState(0)
  const [socialList, setSocialList] = useState<'followers' | 'following' | null>(null)
  const [loadedSetups, setLoadedSetups] = useState<any[]>([])
  const hasToken = hasAuthToken()
  const { data: viewer } = useGetProfileQuery(undefined, { skip: !hasToken })
  const { data: user, isLoading } = useGetPublicProfileQuery(id!, { skip: !id })
  const { data: setupsPage, isFetching: setupsFetching } = useGetUserSetupsQuery(
    { userId: id!, limit: PROFILE_SETUP_PAGE_SIZE, offset },
    { skip: !id },
  )
  const { data: viewerSetupsPage } = useGetUserSetupsQuery(
    { userId: viewer?.id || '', limit: 50, offset: 0 },
    { skip: !viewer?.id || viewer?.id === id },
  )
  const { data: followers = [] } = useGetUserFollowersQuery({ userId: id!, limit: 50 }, { skip: !id || socialList !== 'followers' })
  const { data: followingUsers = [] } = useGetUserFollowingQuery({ userId: id!, limit: 50 }, { skip: !id || socialList !== 'following' })
  const [followUser, { isLoading: following }] = useFollowUserMutation()
  const [unfollowUser, { isLoading: unfollowing }] = useUnfollowUserMutation()
  const pageSetups = normalizePage(setupsPage)
  const setups = loadedSetups.length ? loadedSetups : pageSetups
  const isSelf = viewer?.id && user?.id && String(viewer.id) === String(user.id)
  const commonTobaccos = (() => {
    const viewerTobaccos = new Map<string, string>()
    ;(viewerSetupsPage?.items || []).forEach((setup: any) => {
      ;(setup.tobaccos || []).forEach((item: any) => {
        if (item.tobacco_id) viewerTobaccos.set(item.tobacco_id, item.tobacco?.name || 'Табак')
      })
    })
    const common = new Map<string, string>()
    setups.forEach((setup: any) => {
      ;(setup.tobaccos || []).forEach((item: any) => {
        if (viewerTobaccos.has(item.tobacco_id)) common.set(item.tobacco_id, viewerTobaccos.get(item.tobacco_id)!)
      })
    })
    return [...common.values()].slice(0, 5)
  })()
  const recentlyActive = user?.last_seen_at && Date.now() - new Date(user.last_seen_at).getTime() < 1000 * 60 * 60 * 24 * 7

  useEffect(() => {
    setOffset(0)
    setLoadedSetups([])
  }, [id])

  useEffect(() => {
    if (!setupsPage) return
    setLoadedSetups((current) => {
      if (setupsPage.offset === 0) return setupsPage.items
      const seen = new Set(current.map((setup) => setup.id))
      return [
        ...current,
        ...setupsPage.items.filter((setup: any) => !seen.has(setup.id)),
      ]
    })
  }, [setupsPage])

  if (isLoading) {
    return (
      <div tw="mx-auto grid w-full max-w-4xl gap-4">
        <Skeleton w="100%" h="180px" />
        <Skeleton w="100%" h="260px" />
      </div>
    )
  }

  if (!user) {
    return <div tw="py-16 text-center text-sm font-semibold text-[rgb(var(--color-text-muted))]">Профиль не найден</div>
  }

  const toggleFollow = () => {
    if (user.is_following) unfollowUser(user.id)
    else followUser(user.id)
  }

  return (
    <div tw="mx-auto grid w-full max-w-4xl gap-4">
      <Card>
        <div tw="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div tw="min-w-0">
            <AuthorChip author={user} />
            <div tw="mt-3 flex flex-wrap items-center gap-2">
              <RoleBadge role={user.role || 'user'} size="sm" />
              <UserBadges badges={user.badges} />
              {recentlyActive && (
                <span tw="rounded-md bg-[rgb(var(--color-success-surface))] px-2 py-1 text-[10px] font-bold text-[rgb(var(--color-success))]">
                  был недавно
                </span>
              )}
              {user.is_followed_by && !isSelf && (
                <span tw="rounded-md bg-[rgb(var(--color-accent-muted))] px-2 py-1 text-[10px] font-bold text-[rgb(var(--color-text-muted))]">
                  подписан на тебя
                </span>
              )}
            </div>
            {commonTobaccos.length > 0 && (
              <div tw="mt-3 flex flex-wrap gap-1.5">
                <span tw="text-[11px] font-bold text-[rgb(var(--color-text-subtle))]">Общие табаки:</span>
                {commonTobaccos.map((name) => (
                  <span key={name} tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))]">{name}</span>
                ))}
              </div>
            )}
          </div>
          <div tw="grid grid-cols-3 gap-2 text-center">
            <div tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-3 py-2">
              <p tw="text-[16px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.setups_count || 0}</p>
              <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Забивки</p>
            </div>
            <button type="button" onClick={() => setSocialList('followers')} tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-3 py-2">
              <p tw="text-[16px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.followers_count || 0}</p>
              <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Подписчики</p>
            </button>
            <button type="button" onClick={() => setSocialList('following')} tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-3 py-2">
              <p tw="text-[16px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.following_count || 0}</p>
              <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Подписки</p>
            </button>
          </div>
          {viewer && !isSelf && (
            <Button type="button" onClick={toggleFollow} disabled={following || unfollowing} variant={user.is_following ? 'secondary' : 'primary'}>
              {user.is_following ? 'Отписаться' : 'Подписаться'}
            </Button>
          )}
        </div>
      </Card>

      <section tw="grid gap-3">
        <h1 tw="text-lg font-semibold text-[rgb(var(--color-text))]">Забивки автора</h1>
        <div tw="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {setups.map((setup: any) => (
            <Link key={setup.id} to={`/setups/${setup.id}`} tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3 transition-colors hover:border-[rgb(var(--color-accent-border))]">
              <p tw="line-clamp-2 text-[13px] font-bold text-[rgb(var(--color-text))]">{setup.name}</p>
              <p tw="mt-2 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">{Number(setup.views_count || 0)} просмотров</p>
            </Link>
          ))}
        </div>
        {setupsPage?.has_more && (
          <div tw="flex justify-center pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOffset((current) => current + PROFILE_SETUP_PAGE_SIZE)}
              disabled={setupsFetching}
            >
              {setupsFetching ? 'Загрузка...' : 'Показать ещё'}
            </Button>
          </div>
        )}
        {!setups.length && !setupsFetching && (
          <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] px-4 py-8 text-center text-[13px] font-semibold text-[rgb(var(--color-text-subtle))]">
            У автора пока нет забивок.
          </div>
        )}
      </section>
      {socialList && (
        <Card>
          <div tw="p-4">
            <div tw="mb-3 flex items-center justify-between">
              <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">{socialList === 'followers' ? 'Подписчики' : 'Подписки'}</h2>
              <Button type="button" size="sm" variant="secondary" onClick={() => setSocialList(null)}>Закрыть</Button>
            </div>
            <div tw="grid gap-2 sm:grid-cols-2">
              {(socialList === 'followers' ? followers : followingUsers).map((profile: any) => (
                <Link key={profile.id} to={`/users/${profile.id}`} tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-3 py-2">
                  <AuthorChip author={profile} compact />
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
