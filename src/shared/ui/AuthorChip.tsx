import tw from 'twin.macro'
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

  return (
    <div tw="flex min-w-0 items-center gap-2">
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
        {(showRole || hasBadges) && (
          <span tw="mt-1 flex max-w-full flex-wrap items-center gap-1.5">
            {showRole && <RoleBadge role={role} size="xs" />}
            <UserBadges badges={author?.badges} maxVisible={compact ? 2 : undefined} />
          </span>
        )}
      </span>
    </div>
  )
}
