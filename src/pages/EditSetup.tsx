import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { useGetSetupQuery } from '../shared/api'
import { SetupForm } from './SetupForm'

export const EditSetup = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const prefetchedSetup = (location.state as { prefetchedSetup?: any } | null)?.prefetchedSetup
  const { data: setup, isLoading } = useGetSetupQuery(id!)
  const setupData = setup || (prefetchedSetup?.id === id ? prefetchedSetup : null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem('shisha-guid:setup-form-draft')
  }, [])

  if (isLoading && !setupData) {
    return <div tw="text-center py-8 text-[rgb(var(--color-text-subtle))] text-sm">{t('common.loading')}</div>
  }

  if (!setupData) {
    return (
      <div tw="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-[4px] p-6 text-center text-sm text-[rgb(var(--color-text-subtle))]">
        {t('setupDetail.notFoundHint')}
      </div>
    )
  }

  return <SetupForm initialValues={setupData} isEdit />
}
