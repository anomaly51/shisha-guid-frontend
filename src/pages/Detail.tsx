import type { ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { Skeleton } from '../shared/ui/Skeleton'
import {
  useAddFavoriteTobaccoMutation,
  useGetProfileQuery,
  useGetTobaccoUsersQuery,
  useRemoveFavoriteTobaccoMutation,
} from '../shared/api'
import { AlertIcon, BackIcon } from '../shared/ui/Icons'
import { getTobaccoStrength } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'
import { hasAuthToken } from '../shared/authToken'
import { formatCatalogDisplayName } from '../shared/catalogNames'
import { getSafeImageUrl } from '../shared/imageUrl'

interface DetailProps {
  title: string
  detailHook: (id: string) => any
  listPath: string
  editPath?: (id: string) => string
  renderExtra?: (item: any) => ReactNode
  itemKind?: 'default' | 'bowl' | 'tobacco' | 'coal' | 'placement'
}

const formatPrice = (value: unknown, currency?: string) => (
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('uk-UA')} ${currency === 'UAH' || !currency ? 'грн' : currency}`
    : null
)

const formatCoalsPerPackage = (value: unknown, t: (key: string, options?: any) => string) => (
  typeof value === 'number' && Number.isFinite(value)
    ? t('detail.coalsPerPackageValue', { count: value })
    : null
)

const formatIntegerValue = (value: unknown, t: (key: string, options?: any) => string, key: string) => (
  typeof value === 'number' && Number.isFinite(value)
    ? t(key, { count: value, value })
    : null
)

const getImageStyle = (itemKind: DetailProps['itemKind']) => (
  itemKind === 'coal'
    ? {
        filter: 'brightness(1.08) contrast(1.02) saturate(1.06)',
        mixBlendMode: 'multiply' as const,
        objectFit: 'contain' as const,
        padding: '1rem',
      }
    : undefined
)

const coalImageSurfaceStyle = {
  background: [
    'radial-gradient(circle at 50% 38%, rgba(255,248,241,0.56), rgba(222,139,87,0.22) 48%, rgba(31,27,25,0.10) 100%)',
    'linear-gradient(180deg, rgb(var(--color-surface-muted)) 0%, rgb(var(--color-surface-subtle)) 100%)',
  ].join(', '),
}

export const Detail = ({ title, detailHook, listPath, editPath, renderExtra, itemKind = 'default' }: DetailProps) => {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading } = detailHook(id!)
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasAuthToken() })
  const { data: tobaccoUsers = [] } = useGetTobaccoUsersQuery(id!, { skip: itemKind !== 'tobacco' || !id })
  const [addFavoriteTobacco] = useAddFavoriteTobaccoMutation()
  const [removeFavoriteTobacco] = useRemoveFavoriteTobaccoMutation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAdmin = profile?.role === 'admin'
  const displayName = formatCatalogDisplayName(item, itemKind)
  const photoUrls: string[] = (item?.photo_urls || [])
    .map(getSafeImageUrl)
    .filter((url: string | null): url is string => Boolean(url))

  if (isLoading) {
    return (
      <div tw="flex flex-col gap-6">
        <Skeleton w="120px" h="14px" />
        <div tw="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border-muted))] shadow-sm overflow-hidden">
          <Skeleton w="100%" h="320px" />
          <div tw="p-6 flex flex-col gap-4">
            <Skeleton w="60%" h="24px" />
            <Skeleton w="100%" h="16px" />
            <Skeleton w="70%" h="16px" />
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div tw="flex flex-col items-center justify-center py-20 text-center">
        <div tw="w-16 h-16 bg-[rgb(var(--color-surface-muted))] rounded-2xl flex items-center justify-center mb-5">
          <AlertIcon tw="text-[rgb(var(--color-text-subtle))]" />
        </div>
        <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))] mb-1">{t('common.notFound')}</h2>
        <p tw="text-sm text-[rgb(var(--color-text-subtle))] mb-4">{t('common.itemNotFound')}</p>
        <Link to={listPath}><Button variant="secondary">{t('common.backTo', { name: title })}</Button></Link>
      </div>
    )
  }

  return (
    <div tw="flex flex-col gap-6 max-w-3xl">
      <nav tw="flex min-w-0 items-center gap-1.5 text-[12px] font-bold text-[rgb(var(--color-text-subtle))]">
        <Link to={listPath} tw="hover:text-[rgb(var(--color-text))]">{title}</Link>
        <span>/</span>
        <span tw="truncate text-[rgb(var(--color-text-muted))]">{displayName}</span>
      </nav>
      <button
        onClick={() => navigate(listPath)}
        tw="flex items-center gap-1.5 text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors font-medium w-fit"
      >
        <BackIcon />
        {t('common.backTo', { name: title })}
      </button>

      <Card>
        {photoUrls.length > 0 && (
          <div tw="bg-[rgb(var(--color-surface-muted))] border-b border-[rgb(var(--color-border-muted))]">
            <div
              tw="mx-auto aspect-square w-full max-w-[520px] overflow-hidden bg-[rgb(var(--color-surface-muted))]"
              css={itemKind === 'coal'
                ? coalImageSurfaceStyle
                : undefined}
            >
              <img src={photoUrls[0]} alt={displayName} loading="eager" decoding="async" style={getImageStyle(itemKind)} tw="h-full w-full object-cover" />
            </div>
            {photoUrls.length > 1 && (
              <div tw="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-[rgb(var(--color-surface))]">
                {photoUrls.slice(1).map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    tw="aspect-square rounded-lg overflow-hidden bg-[rgb(var(--color-surface-muted))]"
                    css={itemKind === 'coal'
                      ? coalImageSurfaceStyle
                      : undefined}
                  >
                    <img src={url} alt="" loading="lazy" decoding="async" style={getImageStyle(itemKind)} tw="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div tw="p-6">
          <div tw="mb-4">
              <h1 tw="text-xl font-semibold text-[rgb(var(--color-text))] leading-tight">{displayName}</h1>
              {formatPrice(item.price, item.price_currency) && (
                <p tw="mt-1 text-sm font-semibold text-[rgb(var(--color-text-muted))]">{formatPrice(item.price, item.price_currency)}</p>
              )}
          </div>

          {renderExtra?.(item)}

          {itemKind === 'tobacco' && (
            <div tw="mt-4">
              <StrengthIndicator value={getTobaccoStrength(item)} showScore />
              {profile && (
                <Button
                  type="button"
                  variant={item.is_favorite ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => item.is_favorite ? removeFavoriteTobacco(item.id) : addFavoriteTobacco(item.id)}
                >
                  {item.is_favorite ? 'Убрать из любимых' : 'Любимый табак'}
                </Button>
              )}
            </div>
          )}

          {itemKind === 'coal' && formatCoalsPerPackage(item.coals_per_package, t) && (
            <div tw="mt-4 grid grid-cols-1 gap-2">
              <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-3 py-2.5">
                <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('detail.coalsPerPackage')}</p>
                <p tw="mt-1 text-sm font-semibold text-[rgb(var(--color-text))]">{formatCoalsPerPackage(item.coals_per_package, t)}</p>
              </div>
            </div>
          )}

          {itemKind === 'bowl' && formatIntegerValue(item.capacity_grams, t, 'detail.capacityGramsValue') && (
            <div tw="mt-4 grid grid-cols-1 gap-2">
              <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-3 py-2.5">
                <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('detail.capacityGrams')}</p>
                <p tw="mt-1 text-sm font-semibold text-[rgb(var(--color-text))]">{formatIntegerValue(item.capacity_grams, t, 'detail.capacityGramsValue')}</p>
              </div>
            </div>
          )}

          {itemKind === 'tobacco' && formatIntegerValue(item.package_grams, t, 'detail.packageGramsValue') && (
            <div tw="mt-4 grid grid-cols-1 gap-2">
              <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-3 py-2.5">
                <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('detail.packageGrams')}</p>
                <p tw="mt-1 text-sm font-semibold text-[rgb(var(--color-text))]">{formatIntegerValue(item.package_grams, t, 'detail.packageGramsValue')}</p>
              </div>
            </div>
          )}

          {itemKind === 'tobacco' && tobaccoUsers.length > 0 && (
            <div tw="mt-4 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-3 py-2.5">
              <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">Кто курит этот табак</p>
              <div tw="mt-2 flex flex-wrap gap-2">
                {tobaccoUsers.map((user: any) => (
                  <Link key={user.id} to={`/users/${user.id}`} tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))]">
                    {user.display_name || user.nickname}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {itemKind === 'placement' && formatIntegerValue(item.coal_count, t, 'detail.coalCountValue') && (
            <div tw="mt-4 grid grid-cols-1 gap-2">
              <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-3 py-2.5">
                <p tw="text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('detail.coalCount')}</p>
                <p tw="mt-1 text-sm font-semibold text-[rgb(var(--color-text))]">{formatIntegerValue(item.coal_count, t, 'detail.coalCountValue')}</p>
              </div>
            </div>
          )}

          {isAdmin && (
            <div tw="mt-6 pt-5 border-t border-[rgb(var(--color-border-muted))] flex gap-2">
              <Link to={editPath ? editPath(item.id) : `${listPath}/${item.id}/edit`}>
                <Button variant="secondary" size="sm">{t('common.edit')}</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
