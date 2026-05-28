import tw from 'twin.macro'
import { Link } from 'react-router-dom'
import { useFollowUserMutation, useGetProfileQuery, useUnfollowUserMutation, type UserBadge } from '../api'
import { RoleBadge, shouldShowRoleBadge } from './RoleBadge'
import { UserBadges } from './UserBadges'
import { hasAuthToken } from '../authToken'

export interface PublicCreator {
  id?: string
  email?: string
  nickname?: string | null
  display_name?: string | null
  avatar_url?: string | null
  role?: string
  badges?: UserBadge[]
  setups_count?: number
  is_following?: boolean
  last_seen_at?: string | null
}

const getAuthorName = (author?: PublicCreator | null) => (
  author?.nickname || author?.display_name || 'Unknown author'
)

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '?'

export const AuthorChip = ({ author, compact = false, quickFollow = false }: { author?: PublicCreator | null; compact?: boolean; quickFollow?: boolean }) => {
  const name = getAuthorName(author)
  const role = author?.role || 'user'
  const showRole = shouldShowRoleBadge(role)
  const hasBadges = Boolean(author?.badges?.length)
  const recentlyActive = author?.last_seen_at && Date.now() - new Date(author.last_seen_at).getTime() < 1000 * 60 * 60 * 24 * 7
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasAuthToken() })
  const [followUser, { isLoading: following }] = useFollowUserMutation()
  const [unfollowUser, { isLoading: unfollowing }] = useUnfollowUserMutation()
  const canQuickFollow = Boolean(quickFollow && author?.id && profile?.id && String(profile.id) !== String(author.id))
  const followButton = canQuickFollow ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        if (!author?.id) return
        if (author.is_following) unfollowUser(author.id)
        else followUser(author.id)
      }}
      disabled={following || unfollowing}
      tw="ml-1 hidden shrink-0 rounded-md border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-2 py-1 text-[10px] font-bold text-[rgb(var(--color-text-muted))] transition-colors hover:bg-[rgb(var(--color-accent-muted))] group-hover:inline-flex disabled:opacity-50"
    >
      {author?.is_following ? 'Отписаться' : 'Подписаться'}
    </button>
  ) : null
  const content = (
    <>
      <span
        css={[
          compact ? tw`h-6 w-6 rounded-md text-[10px]` : tw`h-9 w-9 rounded-lg text-[13px]`,
          tw`flex shrink-0 items-center justify-center overflow-hidden bg-[rgb(var(--color-surface-subtle))] font-bold text-[rgb(var(--color-text-muted))]`,
        ]}
      >
        {author?.avatar_url ? (
          <img src={author.avatar_url} alt="" tw="h-full w-full object-cover" />
        ) : (
          getInitial(name)
        )}
      </span>
      <span tw="min-w-0">
        <span
          css={[
            compact ? tw`text-[11px]` : tw`text-[13px]`,
            tw`block truncate font-semibold leading-tight text-[rgb(var(--color-text))]`,
          ]}
        >
          {name}
        </span>
        {(showRole || hasBadges || typeof author?.setups_count === 'number') && (
          <span tw="mt-1 flex max-w-full flex-wrap items-center gap-1.5">
            {typeof author?.setups_count === 'number' && (
              <span tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-1.5 py-0.5 text-[10px] font-bold text-[rgb(var(--color-text-subtle))]">
                {author.setups_count}
              </span>
            )}
            {showRole && <RoleBadge role={role} size="xs" />}
            <UserBadges badges={author?.badges} maxVisible={compact ? 2 : undefined} />
            {recentlyActive && (
              <span tw="rounded-md bg-[rgb(var(--color-success-surface))] px-1.5 py-0.5 text-[10px] font-bold text-[rgb(var(--color-success))]">
                был недавно
              </span>
            )}
          </span>
        )}
      </span>
    </>
  )

  if (author?.id) {
    return (
      <span className="group" tw="flex min-w-0 items-center gap-2">
        <Link
          to={`/users/${author.id}`}
          onClick={(event) => event.stopPropagation()}
          tw="flex min-w-0 items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[rgba(139,74,43,0.24)]"
        >
          {content}
        </Link>
        {followButton}
      </span>
    )
  }

  return (
    <div tw="flex min-w-0 items-center gap-2">
      {content}
    </div>
  )
}
