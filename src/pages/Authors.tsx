import { FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import 'twin.macro'
import { useGetTopAuthorsQuery, useSearchUsersQuery } from '../shared/api'
import { AuthorChip } from '../shared/ui/AuthorChip'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { Skeleton } from '../shared/ui/Skeleton'
import { CatalogIcon, CloseIcon } from '../shared/ui/Icons'
import { RoleBadge } from '../shared/ui/RoleBadge'
import { UserBadges } from '../shared/ui/UserBadges'

const AuthorCard = ({ user }: { user: any }) => (
  <Link to={`/users/${user.id}`}>
    <Card variant="hover" className="h-full">
      <div tw="flex h-full flex-col gap-4 p-4">
        <div tw="min-w-0">
          <AuthorChip author={user} />
          <div tw="mt-3 flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role || 'user'} size="sm" />
            <UserBadges badges={user.badges} maxVisible={2} />
          </div>
        </div>
        <div tw="mt-auto grid grid-cols-3 gap-2 border-t border-[rgb(var(--color-border))] pt-3 text-center">
          <div tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-2 py-2">
            <p tw="text-[15px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.setups_count || 0}</p>
            <p tw="text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Забивки</p>
          </div>
          <div tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-2 py-2">
            <p tw="text-[15px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.followers_count || 0}</p>
            <p tw="text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Подписчики</p>
          </div>
          <div tw="rounded-lg bg-[rgb(var(--color-surface-muted))] px-2 py-2">
            <p tw="text-[15px] font-black tabular-nums text-[rgb(var(--color-text))]">{user.following_count || 0}</p>
            <p tw="text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Подписки</p>
          </div>
        </div>
      </div>
    </Card>
  </Link>
)

export const Authors = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [draftQuery, setDraftQuery] = useState(query)
  const { data: topAuthors = [], isLoading: topLoading } = useGetTopAuthorsQuery({ limit: 12 }, { skip: Boolean(query) })
  const { data: searchResults = [], isFetching: searchLoading } = useSearchUsersQuery(
    { nickname: query, limit: 30 },
    { skip: !query },
  )
  const authors = query ? searchResults : topAuthors
  const isLoading = query ? searchLoading : topLoading
  const title = query ? 'Результаты поиска' : 'Активные авторы'
  const hasQuery = Boolean(query)

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      const normalized = draftQuery.trim()
      if (normalized) next.set('q', normalized)
      else next.delete('q')
      return next
    }, { replace: true })
  }

  const clearSearch = () => {
    setDraftQuery('')
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('q')
      return next
    }, { replace: true })
  }

  const emptyText = useMemo(() => (
    hasQuery ? 'Пользователи не найдены.' : 'Пока нет авторов с опубликованными забивками.'
  ), [hasQuery])

  return (
    <div tw="grid gap-5">
      <div tw="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div tw="min-w-0">
          <h1 tw="text-xl font-semibold text-[rgb(var(--color-text))]">Авторы</h1>
          <p tw="mt-0.5 text-sm text-[rgb(var(--color-text-subtle))]">Поиск пользователей и авторов забивок.</p>
        </div>
        <form onSubmit={submitSearch} tw="grid gap-2 sm:grid-cols-[minmax(260px,360px)_auto]">
          <label tw="relative block min-w-0">
            <span tw="sr-only">Поиск пользователей</span>
            <CatalogIcon name="feed" size={14} tw="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-subtle))]" />
            <input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Никнейм или email"
              tw="h-[42px] w-full rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] pl-9 pr-9 text-[13px] font-bold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))]"
            />
            {draftQuery && (
              <button
                type="button"
                onClick={clearSearch}
                tw="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[rgb(var(--color-text-subtle))] hover:bg-[rgb(var(--color-surface-muted))]"
                aria-label="Очистить поиск"
              >
                <CloseIcon size={11} />
              </button>
            )}
          </label>
          <Button type="submit">Найти</Button>
        </form>
      </div>

      <section tw="grid gap-3">
        <div tw="flex items-center justify-between gap-3">
          <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))]">{title}</h2>
          <span tw="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 py-1.5 text-[12px] font-bold text-[rgb(var(--color-text-muted))] tabular-nums">
            {authors.length}
          </span>
        </div>

        {isLoading ? (
          <div tw="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} w="100%" h="170px" />)}
          </div>
        ) : authors.length ? (
          <div tw="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((user: any) => <AuthorCard key={user.id} user={user} />)}
          </div>
        ) : (
          <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-muted))] px-4 py-8 text-center text-[13px] font-semibold text-[rgb(var(--color-text-subtle))]">
            {emptyText}
          </div>
        )}
      </section>
    </div>
  )
}
