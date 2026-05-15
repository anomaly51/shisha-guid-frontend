import tw from 'twin.macro'

export const shouldShowRoleBadge = (role?: string | null) => {
  const normalized = role?.trim().toLowerCase()
  return Boolean(normalized && normalized !== 'user')
}

export const RoleBadge = ({
  role,
  tone = 'light',
  size = 'sm',
}: {
  role?: string | null
  tone?: 'light' | 'dark'
  size?: 'xs' | 'sm'
}) => {
  if (!shouldShowRoleBadge(role)) return null

  return (
    <span
      css={[
        size === 'xs' ? tw`px-1.5 py-0.5 text-[9px]` : tw`px-2 py-1 text-[10px]`,
        tone === 'dark'
          ? tw`border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-accent-soft))]`
          : tw`border-[rgb(var(--color-border))] bg-[rgb(var(--color-accent-muted))] text-[rgb(var(--color-accent))]`,
        tw`inline-flex shrink-0 rounded-md border font-bold uppercase leading-none tracking-wide`,
      ]}
    >
      {role!.trim()}
    </span>
  )
}
