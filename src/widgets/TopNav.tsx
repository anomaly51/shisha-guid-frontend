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
] satisfies Array<{ path: string; labelKey: string; icon: CatalogIconName }>

const NavIcon = styled(CatalogIcon)`
  width: 18px;
  height: 18px;

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
      <div tw="mx-auto flex h-full w-full max-w-[1160px] min-w-0 items-center gap-0.5 overflow-x-auto px-5">
        {categories.map((cat) => {
          const active = location.pathname === cat.path
          return (
            <Link
              key={cat.path}
              to={cat.path}
              css={[
                tw`flex items-center gap-1.5 shrink-0 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-colors`,
                active
                  ? tw`text-[rgb(var(--color-text))] bg-[rgb(var(--color-surface-subtle))]`
                  : tw`text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-accent-muted))]`,
              ]}
            >
              <NavIcon name={cat.icon} size={14} />
              <span tw="hidden sm:inline">{t(cat.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
