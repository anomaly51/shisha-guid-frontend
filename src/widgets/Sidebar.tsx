import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import tw from 'twin.macro'
import { CatalogIcon, type CatalogIconName } from '../shared/ui/Icons'

const navItems = [
  { path: '/', labelKey: 'nav.feed', icon: 'feed' },
  { path: '/bowls', labelKey: 'nav.bowls', icon: 'bowl' },
  { path: '/tobaccos', labelKey: 'nav.tobaccos', icon: 'tobacco' },
  { path: '/coals', labelKey: 'nav.coals', icon: 'coal' },
  { path: '/kalouds', labelKey: 'nav.kalouds', icon: 'kaloud' },
  { path: '/ai-chat', labelKey: 'nav.aiChat', icon: 'setupType' },
] satisfies Array<{ path: string; labelKey: string; icon: CatalogIconName }>

export const Sidebar = () => {
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <nav tw="bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border-muted))] shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.03)] py-2">
      {navItems.map((item) => {
        const active = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            css={[
              tw`flex items-center gap-2.5 mx-1.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors`,
              active
                ? tw`bg-[rgb(var(--color-surface-muted))] text-[rgb(var(--color-text))]`
                : tw`text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-muted))] hover:text-[rgb(var(--color-text))]`,
            ]}
          >
            <CatalogIcon name={item.icon} size={15} />
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
