import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Card } from '../shared/ui/Card'

export const NotFound = () => {
  const { t } = useTranslation()

  return (
    <Card>
      <div tw="flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center">
        <div tw="text-6xl font-black leading-none text-[rgb(var(--color-accent))]">404</div>
        <h1 tw="mt-5 text-2xl font-black text-[rgb(var(--color-text))]">{t('common.notFound')}</h1>
        <p tw="mt-2 max-w-md text-sm text-[rgb(var(--color-text-muted))]">{t('common.itemNotFound')}</p>
        <Link
          to="/"
          tw="mt-6 inline-flex items-center justify-center rounded-lg bg-[rgb(var(--color-accent))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgb(var(--color-accent-hover))]"
        >
          {t('common.backToFeed')}
        </Link>
      </div>
    </Card>
  )
}
