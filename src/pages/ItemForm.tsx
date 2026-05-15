import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Input, Textarea } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import { useGetProfileQuery } from '../shared/api'
import { PhotoUploader } from '../shared/ui/PhotoUploader'
import { PackageGramsSlider, normalizePackageGrams } from '../shared/ui/PackageGramsSlider'
import { StrengthSlider } from '../shared/ui/StrengthSlider'
import { BackIcon, CatalogIcon, type CatalogIconName, LockIcon } from '../shared/ui/Icons'
import { getTobaccoStrength } from '../shared/setupMetrics'
import { hasAuthToken } from '../shared/authToken'

interface FormProps {
  title: string
  initialValues?: {
    name?: string
    price?: number | null
    price_currency?: string
    capacity_grams?: number | null
    package_grams?: number | null
    coals_per_package?: number | null
    coal_count?: number | null
    strength?: number | null
    heaviness?: number | null
    nicotine_strength?: number | null
    nicotine?: number | null
    description?: string
    photo_urls?: string[]
  }
  onSubmit: (values: {
    name: string
    price?: number
    price_currency?: 'UAH'
    capacity_grams?: number | null
    package_grams?: number | null
    coals_per_package?: number | null
    coal_count?: number | null
    strength?: number
    description: string | null
    photo_urls: string[]
  }) => Promise<unknown>
  saving?: boolean
  isEdit?: boolean
}

type ItemFormCopy = {
  icon: CatalogIconName
  eyebrow: string
  nameLabel: string
  namePlaceholder: string
  descriptionPlaceholder: string
  hasPrice?: boolean
  hasBowlCapacity?: boolean
  hasTobaccoPackage?: boolean
  hasTobaccoStrength?: boolean
  hasCoalPackage?: boolean
  hasCoalPlacementCount?: boolean
}

const getDefaultCopy = (t: (key: string) => string): ItemFormCopy => ({
  icon: 'setupType',
  eyebrow: t('itemForm.catalogItem'),
  nameLabel: t('common.name'),
  namePlaceholder: t('itemForm.placeholders.defaultName'),
  descriptionPlaceholder: t('itemForm.placeholders.defaultDescription'),
})

const getCopyByTitle = (t: (key: string) => string): Record<string, ItemFormCopy> => ({
  bowl: {
    icon: 'bowl',
    eyebrow: t('itemForm.bowlProfile'),
    nameLabel: t('itemForm.bowlName'),
    namePlaceholder: t('itemForm.placeholders.bowlName'),
    descriptionPlaceholder: t('itemForm.placeholders.bowlDescription'),
    hasPrice: true,
    hasBowlCapacity: true,
  },
  tobacco: {
    icon: 'tobacco',
    eyebrow: t('itemForm.tobaccoProfile'),
    nameLabel: t('itemForm.tobaccoName'),
    namePlaceholder: t('itemForm.placeholders.tobaccoName'),
    descriptionPlaceholder: t('itemForm.placeholders.tobaccoDescription'),
    hasPrice: true,
    hasTobaccoPackage: true,
    hasTobaccoStrength: true,
  },
  coal: {
    icon: 'coal',
    eyebrow: t('itemForm.coalProfile'),
    nameLabel: t('itemForm.coalName'),
    namePlaceholder: t('itemForm.placeholders.coalName'),
    descriptionPlaceholder: t('itemForm.placeholders.coalDescription'),
    hasPrice: true,
    hasCoalPackage: true,
  },
  kaloud: {
    icon: 'kaloud',
    eyebrow: t('itemForm.heatManagement'),
    nameLabel: t('itemForm.kaloudName'),
    namePlaceholder: t('itemForm.placeholders.kaloudName'),
    descriptionPlaceholder: t('itemForm.placeholders.kaloudDescription'),
    hasPrice: true,
  },
  placement: {
    icon: 'placement',
    eyebrow: t('itemForm.coalPlacement'),
    nameLabel: t('itemForm.placementName'),
    namePlaceholder: t('itemForm.placeholders.placementName'),
    descriptionPlaceholder: t('itemForm.placeholders.placementDescription'),
    hasCoalPlacementCount: true,
  },
  type: {
    icon: 'setupType',
    eyebrow: t('itemForm.setupType'),
    nameLabel: t('itemForm.typeName'),
    namePlaceholder: t('itemForm.placeholders.typeName'),
    descriptionPlaceholder: t('itemForm.placeholders.typeDescription'),
  },
})

const getCopy = (title: string, t: (key: string) => string) => {
  const normalized = title.toLowerCase()
  const copyByTitle = getCopyByTitle(t)
  if (normalized.includes('placement') || normalized.includes('расклад') || normalized.includes('розклад')) return copyByTitle.placement
  if (normalized.includes('setup type') || normalized.includes('тип')) return copyByTitle.type
  if (normalized.includes('bowl') || normalized.includes('чаш')) return copyByTitle.bowl
  if (normalized.includes('tobacco') || normalized.includes('табак') || normalized.includes('тютюн')) return copyByTitle.tobacco
  if (normalized.includes('coal') || normalized.includes('уг')) return copyByTitle.coal
  if (normalized.includes('kaloud') || normalized.includes('калауд')) return copyByTitle.kaloud
  return getDefaultCopy(t)
}

export const ItemForm = ({ title, initialValues, onSubmit, saving, isEdit }: FormProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasAuthToken() })
  const copy = getCopy(title, t)
  const [name, setName] = useState(initialValues?.name || '')
  const [price, setPrice] = useState(initialValues?.price == null ? '' : String(initialValues.price))
  const [capacityGrams, setCapacityGrams] = useState(
    initialValues?.capacity_grams == null ? '' : String(initialValues.capacity_grams)
  )
  const [packageGrams, setPackageGrams] = useState(
    initialValues?.package_grams == null
      ? copy.hasTobaccoPackage ? '100' : ''
      : String(normalizePackageGrams(Number(initialValues.package_grams)))
  )
  const [strength, setStrength] = useState(() => (
    initialValues ? getTobaccoStrength(initialValues) : 5
  ))
  const [coalsPerPackage, setCoalsPerPackage] = useState(
    initialValues?.coals_per_package == null ? '' : String(initialValues.coals_per_package)
  )
  const [coalCount, setCoalCount] = useState(
    initialValues?.coal_count == null ? '' : String(initialValues.coal_count)
  )
  const [description, setDescription] = useState(initialValues?.description || '')
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialValues?.photo_urls || [])
  const [error, setError] = useState('')
  const nameLength = name.trim().length
  const descriptionLength = description.trim().length

  if (!profile) {
    return (
      <div tw="flex flex-col items-center justify-center py-20 text-center">
        <div tw="w-16 h-16 bg-[rgb(var(--color-surface-muted))] rounded-2xl flex items-center justify-center mb-5">
          <LockIcon tw="text-[rgb(var(--color-text-subtle))]" />
        </div>
        <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))] mb-1">{t('common.signInRequired')}</h2>
        <p tw="text-sm text-[rgb(var(--color-text-subtle))]">{t('itemForm.signInHint')}</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('itemForm.nameRequired'))
      return
    }
    const parsedPrice = price.trim() ? Number(price) : null
    let pricePayload: number | undefined
    if (copy.hasPrice) {
      if (parsedPrice == null) {
        setError(t('itemForm.priceRequired'))
        return
      }
      if (!Number.isFinite(parsedPrice) || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
        setError(t('itemForm.priceInvalid'))
        return
      }
      pricePayload = parsedPrice
    }
    const parsedCoalsPerPackage = coalsPerPackage.trim() ? Number(coalsPerPackage) : null
    let coalsPerPackagePayload: number | null | undefined
    if (copy.hasCoalPackage) {
      if (parsedCoalsPerPackage != null) {
        if (!Number.isFinite(parsedCoalsPerPackage) || !Number.isInteger(parsedCoalsPerPackage) || parsedCoalsPerPackage < 1) {
          setError(t('itemForm.coalsPerPackageInvalid'))
          return
        }
        coalsPerPackagePayload = parsedCoalsPerPackage
      } else {
        coalsPerPackagePayload = null
      }
    }
    const parseOptionalPositiveInt = (value: string, errorKey: string) => {
      const parsed = value.trim() ? Number(value) : null
      if (parsed == null) return null
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
        setError(t(errorKey))
        return undefined
      }
      return parsed
    }
    const capacityGramsPayload = copy.hasBowlCapacity
      ? parseOptionalPositiveInt(capacityGrams, 'itemForm.capacityGramsInvalid')
      : undefined
    if (copy.hasBowlCapacity && capacityGramsPayload === undefined) return
    let packageGramsPayload: number | undefined
    if (copy.hasTobaccoPackage) {
      const parsedPackageGrams = Number(packageGrams)
      if (!Number.isFinite(parsedPackageGrams) || parsedPackageGrams < 50 || parsedPackageGrams > 500 || parsedPackageGrams % 50 !== 0) {
        setError(t('itemForm.packageGramsInvalid'))
        return
      }
      packageGramsPayload = parsedPackageGrams
    }
    if (copy.hasTobaccoPackage && packageGramsPayload === undefined) return
    const coalCountPayload = copy.hasCoalPlacementCount
      ? parseOptionalPositiveInt(coalCount, 'itemForm.coalCountInvalid')
      : undefined
    if (copy.hasCoalPlacementCount && coalCountPayload === undefined) return
    setError('')
    try {
      await onSubmit({
        name: name.trim(),
        ...(copy.hasPrice ? { price: pricePayload, price_currency: 'UAH' as const } : {}),
        ...(copy.hasBowlCapacity ? { capacity_grams: capacityGramsPayload } : {}),
        ...(copy.hasTobaccoPackage ? { package_grams: packageGramsPayload } : {}),
        ...(copy.hasTobaccoStrength ? { strength } : {}),
        ...(copy.hasCoalPackage ? {
          coals_per_package: coalsPerPackagePayload,
        } : {}),
        ...(copy.hasCoalPlacementCount ? { coal_count: coalCountPayload } : {}),
        description: description.trim() || null,
        photo_urls: photoUrls,
      })
      navigate(-1)
    } catch {
      setError(t('common.failedSave'))
    }
  }

  return (
    <div tw="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        tw="flex items-center gap-1.5 text-[13px] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors font-medium mb-4"
      >
        <BackIcon />
        {t('common.back')}
      </button>

      <form onSubmit={handleSubmit}>
        <Card>
          <div tw="p-4 sm:p-5 flex flex-col gap-4">
            <div tw="flex items-start justify-between gap-3">
              <div tw="flex items-start gap-3">
                <div tw="w-9 h-9 rounded-xl bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-text-muted))] flex items-center justify-center">
                  <CatalogIcon name={copy.icon} size={19} />
                </div>
                <div>
                  <p tw="text-[10px] font-semibold text-[rgb(var(--color-text-subtle))] uppercase tracking-wide">{copy.eyebrow}</p>
                  <h2 tw="text-lg font-semibold text-[rgb(var(--color-text))] mt-0.5">{title}</h2>
                </div>
              </div>
              <span tw="hidden sm:inline-flex rounded-md bg-[rgb(var(--color-surface-muted))] border border-[rgb(var(--color-border))] px-2 py-1 text-[10px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wide">
                {isEdit ? t('common.editing') : t('common.new')}
              </span>
            </div>

            {error && (
              <div tw="bg-[rgb(var(--color-danger-surface))] border border-[rgb(var(--color-danger-border))] text-[rgb(var(--color-danger))] text-[13px] font-medium px-3 py-2 rounded-lg">{error}</div>
            )}

            <div tw="grid grid-cols-1 gap-4">
              <div tw="flex flex-col gap-1.5">
                <Input
                  label={copy.nameLabel}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  placeholder={copy.namePlaceholder}
                />
                <div tw="flex justify-between gap-3 text-[10px] text-[rgb(var(--color-text-subtle))]">
                  <span>{t('itemForm.nameHelp')}</span>
                  <span tw="font-medium">{nameLength}/80</span>
                </div>
              </div>

              {copy.hasPrice && (
                <div tw="flex flex-col gap-1.5">
                  <label tw="text-[10px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wide" htmlFor="item-price">
                    {t('itemForm.price')}
                  </label>
                  <div tw="relative">
                    <input
                      id="item-price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      required
                      placeholder={t('itemForm.pricePlaceholder')}
                      tw="h-[42px] w-full rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))]/95 px-3 py-2 pr-24 text-[13px] font-semibold text-[rgb(var(--color-text))] outline-none transition-all duration-150 placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)]"
                    />
                    <div tw="pointer-events-none absolute inset-y-1 right-1 flex items-center gap-1 rounded-md bg-[rgb(var(--color-surface-muted))] border border-[rgb(var(--color-border))] px-2.5 text-[12px] font-bold text-[rgb(var(--color-text-muted))]">
                      <span>{t('itemForm.currencySymbol')}</span>
                      <span tw="text-[10px] font-semibold text-[rgb(var(--color-text-subtle))]">UAH</span>
                    </div>
                  </div>
                </div>
              )}

              {copy.hasCoalPackage && (
                <div tw="grid grid-cols-1 gap-3">
                  <Input
                    label={t('itemForm.coalsPerPackage')}
                    value={coalsPerPackage}
                    onChange={(e) => setCoalsPerPackage(e.target.value)}
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    placeholder={t('itemForm.coalsPerPackagePlaceholder')}
                  />
                </div>
              )}

              {copy.hasBowlCapacity && (
                <Input
                  label={t('itemForm.capacityGrams')}
                  value={capacityGrams}
                  onChange={(e) => setCapacityGrams(e.target.value)}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder={t('itemForm.capacityGramsPlaceholder')}
                />
              )}

              {copy.hasTobaccoPackage && (
                <div tw="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <PackageGramsSlider
                    label={t('itemForm.packageGrams')}
                    hint={t('itemForm.packageGramsHint')}
                    value={Number(packageGrams)}
                    onChange={(value) => setPackageGrams(String(value))}
                    disabled={saving}
                  />
                  <StrengthSlider
                    label={t('itemForm.strength')}
                    hint={t('itemForm.strengthHint')}
                    value={strength}
                    onChange={setStrength}
                    disabled={saving}
                  />
                </div>
              )}

              {copy.hasCoalPlacementCount && (
                <Input
                  label={t('itemForm.coalCount')}
                  value={coalCount}
                  onChange={(e) => setCoalCount(e.target.value)}
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder={t('itemForm.coalCountPlaceholder')}
                />
              )}

              <div tw="flex flex-col gap-1.5">
                <Textarea
                  label={t('common.description')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={700}
                  placeholder={copy.descriptionPlaceholder}
                />
                <div tw="flex justify-between gap-3 text-[10px] text-[rgb(var(--color-text-subtle))]">
                  <span>{t('itemForm.descriptionHelp')}</span>
                  <span tw="font-medium">{descriptionLength}/700</span>
                </div>
              </div>

              <PhotoUploader value={photoUrls} onChange={setPhotoUrls} />
            </div>

            <div tw="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-3 border-t border-[rgb(var(--color-border))]">
              <Button variant="ghost" type="button" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button variant="primary" type="submit" disabled={saving || !name.trim()}>
                {saving ? t('common.saving') : isEdit ? t('common.saveChanges') : t('itemForm.createItem')}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
