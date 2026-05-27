import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { getPageTitle } from './pageMeta'
import type { RootState } from './store'

const getSetupTitleFromState = (state: RootState, pathname: string) => {
  const match = pathname.match(/^\/setups\/([^/]+)$/)
  if (!match) return null
  const query = Object.values(state.api.queries).find((entry: any) => (
    entry?.endpointName === 'getSetup' &&
    entry?.originalArgs === match[1] &&
    entry?.status === 'fulfilled'
  )) as { data?: { name?: string } } | undefined
  return query?.data?.name ? `${query.data.name} | ShishaGuid` : null
}

export const PageTitle = () => {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const setupTitle = useSelector((state: RootState) => getSetupTitleFromState(state, pathname))

  useEffect(() => {
    document.title = setupTitle || getPageTitle(pathname, t)
  }, [pathname, setupTitle, t, i18n.language])

  return null
}
