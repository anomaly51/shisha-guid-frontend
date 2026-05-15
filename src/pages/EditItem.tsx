import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { ItemForm } from './ItemForm'

interface EditItemProps {
  title: string
  detailHook: (id: string) => any
  updateHook: () => [any, { isLoading: boolean }]
}

export const EditItem = ({ title, detailHook, updateHook }: EditItemProps) => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading: loadingItem } = detailHook(id!)
  const [update, { isLoading: updating }] = updateHook()

  if (loadingItem) {
    return <div tw="text-center py-8 text-[rgb(var(--color-text-subtle))] text-sm">{t('common.loading')}</div>
  }

  if (!item) {
    return (
      <div tw="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-[4px] p-6 text-center text-sm text-[rgb(var(--color-text-subtle))]">
        {t('common.itemNotFound')}
      </div>
    )
  }

  const handleSubmit = async (values: any) => {
    await update({ id: id!, ...values }).unwrap()
  }

  return (
    <ItemForm
      title={title}
      onSubmit={handleSubmit}
      saving={updating}
      initialValues={item}
      isEdit
    />
  )
}
