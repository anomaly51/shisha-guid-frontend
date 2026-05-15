import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { useGetSetupQuery } from '../shared/api'
import { SetupForm } from './SetupForm'

export const EditSetup = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: setup, isLoading } = useGetSetupQuery(id!)

  if (isLoading) {
    return <div tw="text-center py-8 text-[rgb(var(--color-text-subtle))] text-sm">{t('common.loading')}</div>
  }

  if (!setup) {
    return (
      <div tw="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-[4px] p-6 text-center text-sm text-[rgb(var(--color-text-subtle))]">
        {t('setupDetail.notFoundHint')}
      </div>
    )
  }

  return <SetupForm initialValues={setup} isEdit />
}
