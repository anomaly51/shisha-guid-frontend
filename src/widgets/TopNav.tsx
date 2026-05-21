import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'
import { CatalogIcon, type CatalogIconName } from '../shared/ui/Icons'

const categories = [
  { path: '/', labelKey: 'nav.feed', icon: 'feed' },
  { path: '/bowls', labelKey: 'nav.bowls', icon: 'bowl' },
  { path: '/tobaccos', labelKey: 'nav.tobaccos', icon: 'tobacco' },
  { path: '/coals', labelKey: 'nav.coals', icon: 'coal' },
  { path: '/kalouds', labelKey: 'nav.kalouds', icon: 'kaloud' },
  { path: '/ai-chat', labelKey: 'nav.aiChat', icon: 'setupType' },
] satisfies Array<{ path: string; labelKey: string; icon: CatalogIconName }>

const NavIcon = styled(CatalogIcon)`
  width: 12px;
  height: 12px;

  @media (min-width: 640px) {
    width: 14px;
    height: 14px;
  }
`

export const TopNav = () => {
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <div tw="sticky top-0 z-40 h-[var(--sticky-nav-height)] w-full overflow-hidden border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-accent-muted))]/95 backdrop-blur-lg">
      <div tw="mx-auto grid h-full w-full max-w-[1160px] min-w-0 grid-cols-6 items-center gap-0.5 overflow-hidden px-2 sm:flex sm:overflow-x-auto sm:px-5">
        {categories.map((cat) => {
          const active = location.pathname === cat.path
          return (
            <Link
              key={cat.path}
              to={cat.path}
              css={[
                tw`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-[11px] font-medium transition-colors sm:shrink-0 sm:justify-start sm:gap-1.5 sm:px-3 sm:text-[13px]`,
                active
                  ? tw`text-[rgb(var(--color-text))] bg-[rgb(var(--color-surface-subtle))]`
                  : tw`text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-accent-muted))]`,
              ]}
            >
              <NavIcon name={cat.icon} size={14} />
              <span tw="min-w-0 truncate">{t(cat.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
