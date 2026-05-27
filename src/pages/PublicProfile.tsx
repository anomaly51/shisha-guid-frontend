import { Link, useParams } from 'react-router-dom'
import 'twin.macro'
import {
  useFollowUserMutation,
  useGetProfileQuery,
  useGetPublicProfileQuery,
  useGetSetupsQuery,
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

export const PublicProfile = () => {
  const { id } = useParams<{ id: string }>()
  const hasToken = hasAuthToken()
  const { data: viewer } = useGetProfileQuery(undefined, { skip: !hasToken })
  const { data: user, isLoading } = useGetPublicProfileQuery(id!, { skip: !id })
  const { data: setupsPage } = useGetSetupsQuery({ creator_id: id, limit: 24 }, { skip: !id })
  const [followUser, { isLoading: following }] = useFollowUserMutation()
  const [unfollowUser, { isLoading: unfollowing }] = useUnfollowUserMutation()
  const setups = normalizePage(setupsPage)
  const isSelf = viewer?.id && user?.id && String(viewer.id) === String(user.id)

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
            </div>
          </div>
          <div tw="grid grid-cols-3 gap-2 text-center">
            <div tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-3 py-2">
              <p tw="text-[16px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.setups_count || 0}</p>
              <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Забивки</p>
            </div>
            <div tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-3 py-2">
              <p tw="text-[16px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.followers_count || 0}</p>
              <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Подписчики</p>
            </div>
            <div tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-3 py-2">
              <p tw="text-[16px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.following_count || 0}</p>
              <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Подписки</p>
            </div>
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
      </section>
    </div>
  )
}
