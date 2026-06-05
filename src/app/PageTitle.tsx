import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { appName, getPageTitle } from './pageMeta'
import type { RootState } from './store'

const getSetupTitleFromState = (state: RootState, pathname: string) => {
  const match = pathname.match(/^\/setups\/([^/]+)$/)
  if (!match) return null
  const query = Object.values(state.api.queries).find((entry: any) => (
    entry?.endpointName === 'getSetup' &&
    entry?.originalArgs === match[1] &&
    entry?.status === 'fulfilled'
  )) as { data?: { name?: string } } | undefined
  return query?.data?.name ? `${query.data.name} | ${appName}` : null
}

const getUserTitleFromState = (state: RootState, pathname: string) => {
  const match = pathname.match(/^\/users\/([^/]+)$/)
  if (!match) return null
  const query = Object.values(state.api.queries).find((entry: any) => (
    entry?.endpointName === 'getPublicProfile' &&
    entry?.originalArgs === match[1] &&
    entry?.status === 'fulfilled'
  )) as { data?: { display_name?: string; nickname?: string } } | undefined
  const name = query?.data?.display_name || query?.data?.nickname
  return name ? `${name} | ${appName}` : null
}

export const PageTitle = () => {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const setupTitle = useSelector((state: RootState) => getSetupTitleFromState(state, pathname))
  const userTitle = useSelector((state: RootState) => getUserTitleFromState(state, pathname))

  useEffect(() => {
    document.title = setupTitle || userTitle || getPageTitle(pathname, t)
  }, [pathname, setupTitle, t, userTitle, i18n.language])

  return null
}
