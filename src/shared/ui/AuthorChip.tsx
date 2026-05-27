import tw from 'twin.macro'
import { Link } from 'react-router-dom'
import type { UserBadge } from '../api'
import { RoleBadge, shouldShowRoleBadge } from './RoleBadge'
import { UserBadges } from './UserBadges'

export interface PublicCreator {
  id?: string
  email?: string
  nickname?: string | null
  display_name?: string | null
  avatar_url?: string | null
  role?: string
  badges?: UserBadge[]
  setups_count?: number
}

const getAuthorName = (author?: PublicCreator | null) => (
  author?.nickname || author?.display_name || 'Unknown author'
)

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '?'

export const AuthorChip = ({ author, compact = false }: { author?: PublicCreator | null; compact?: boolean }) => {
  const name = getAuthorName(author)
  const role = author?.role || 'user'
  const showRole = shouldShowRoleBadge(role)
  const hasBadges = Boolean(author?.badges?.length)
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
          </span>
        )}
      </span>
    </>
  )

  if (author?.id) {
    return (
      <Link
        to={`/users/${author.id}`}
        onClick={(event) => event.stopPropagation()}
        tw="flex min-w-0 items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[rgba(139,74,43,0.24)]"
      >
        {content}
      </Link>
    )
  }

  return (
    <div tw="flex min-w-0 items-center gap-2">
      {content}
    </div>
  )
}
