import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { getPageTitle } from './pageMeta'

export const PageTitle = () => {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = getPageTitle(pathname, t)
  }, [pathname, t, i18n.language])

  return null
}
