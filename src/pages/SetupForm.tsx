import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useVirtualizer } from '@tanstack/react-virtual'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Input, Select, Textarea } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import { Modal } from '../shared/ui/Modal'
import {
  useGetBowlsQuery, useGetTobaccosQuery, useGetCoalsQuery, useGetKaloudsQuery,
  useGetCoalPlacementsQuery, useGetBowlSetupTypesQuery,
  useCreateSetupMutation, useUpdateSetupMutation, useGetProfileQuery, useGetSetupsQuery,
} from '../shared/api'
import { BackIcon, CatalogIcon, type CatalogIconName, LockIcon, VoteDownIcon, VoteUpIcon } from '../shared/ui/Icons'
import { getTobaccoStrength } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'
import { detectBowlModel, MIX_COLORS, type BowlModel, type SetupKind } from '../shared/ui/mixBowlModel'
import { calculateSetupCost, formatMoney } from '../shared/setupCost'
import { hasAuthToken } from '../shared/authToken'
import { filterCatalogItems, getBrandOptions, getCatalogBrand } from '../shared/catalogSearch'
import { PhotoUploader } from '../shared/ui/PhotoUploader'

const Label = tw.label`text-[10px] font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wide`
const Muted = tw.span`text-[11px] font-medium text-[rgb(var(--color-text-subtle))]`
const StepTitle = tw.h3`text-[15px] font-semibold text-[rgb(var(--color-text))]`

interface TobaccoMixRow {
  tobacco_id: string
  percentage: number
  color?: string
}

interface CatalogItem {
  id: string
  name?: string
  description?: string | null
  photo_urls?: string[]
}

interface SetupFormProps {
  initialValues?: any
  isEdit?: boolean
}

interface ChoiceProps {
  label: string
  value: string
  onChange: (value: string) => void
  options?: any[]
  icon: CatalogIconName
  loading?: boolean
}

interface EquipmentItem {
  label: string
  value: string
  onChange: (value: string) => void
  options?: any[]
  icon: CatalogIconName
  loading?: boolean
}

interface StepButtonProps {
  index: number
  title: string
  active: boolean
  complete: boolean
  disabled?: boolean
  onClick: () => void
}

interface MixPreviewItem {
  id: string
  name: string
  percentage: number
  color: string
}

interface VirtualCatalogListProps<T> {
  items: T[]
  estimateSize: number
  renderItem: (item: T, index: number) => ReactNode
  empty?: ReactNode
  maxRows?: number
}

const SETUP_TYPE_PRESETS: Array<{ name: string; kind: SetupKind; description: string }> = [
  {
    name: 'Sectors',
    kind: 'sectors',
    description: 'Tobaccos are placed in separate side-by-side sections without mixing.',
  },
  {
    name: 'Layers',
    kind: 'layers',
    description: 'Tobaccos are packed as stacked layers from bottom to top.',
  },
  {
    name: 'Compot',
    kind: 'compot',
    description: 'Tobaccos are mixed together before packing the bowl.',
  },
]
const SETUP_DRAFT_STORAGE_KEY = 'shisha-guid:setup-form-draft'

type SetupFormDraft = {
  name?: string
  description?: string
  photoUrls?: string[]
  bowlId?: string
  coalId?: string
  kaloudId?: string
  placementId?: string
  typeId?: string
  tobaccoMix?: TobaccoMixRow[]
  tags?: string[]
}

const readSetupDraft = (): SetupFormDraft | null => {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem(SETUP_DRAFT_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const getName = (items: any[] | undefined, id: string) => (
  items?.find((item) => item.id === id)?.name || ''
)

const normalizeName = (value: string) => value.toLowerCase().replace(/\s+/g, '')

const detectSetupKind = (name: string): SetupKind => {
  const normalized = normalizeName(name)
  if (normalized.includes('sector') || normalized.includes('сектор') || normalized.includes('полов')) return 'sectors'
  if (normalized.includes('layer') || normalized.includes('сло')) return 'layers'
  return 'compot'
}

const equalized = (items: TobaccoMixRow[]) => {
  if (!items.length) return items
  const base = Math.floor(100 / items.length)
  const remainder = 100 - base * items.length
  return items.map((item, index) => ({
    ...item,
    percentage: base + (index === 0 ? remainder : 0),
  }))
}

const VirtualCatalogList = <T extends { id?: string },>({
  empty,
  estimateSize,
  items,
  maxRows = 5,
  renderItem,
}: VirtualCatalogListProps<T>) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: items.length,
    estimateSize: () => estimateSize,
    getScrollElement: () => scrollRef.current,
    overscan: 4,
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [items])

  if (!items.length) return <>{empty}</>

  return (
    <div
      ref={scrollRef}
      tw="overflow-y-auto pr-1"
      style={{ height: Math.min(items.length, maxRows) * estimateSize }}
    >
      <div tw="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]

          return (
            <div
              key={item?.id || virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              tw="absolute left-0 top-0 w-full pb-2"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const LazyMixBowlPreview = lazy(() => (
  import('../shared/ui/MixBowlPreview').then(({ MixBowlPreview }) => ({ default: MixBowlPreview }))
))

const LayerStackDiagram = ({ items }: { items: MixPreviewItem[] }) => {
  const total = items.reduce((sum, item) => sum + item.percentage, 0) || 100

  return (
    <div tw="pointer-events-none absolute bottom-4 left-4 right-4 z-20 overflow-hidden rounded-lg border border-white/50 bg-[rgb(var(--color-surface))]/85 shadow-sm backdrop-blur">
      <div tw="flex h-2 flex-row-reverse">
        {items.map((item) => (
          <span
            key={`${item.id}-diagram`}
            tw="min-h-[4px]"
            style={{
              flexBasis: `${Math.max(5, item.percentage / total * 100)}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>
    </div>
  )
}

const MixPreview = ({ bowlModel, kind, items }: { bowlModel: BowlModel; kind: SetupKind; items: MixPreviewItem[] }) => {
  const { t } = useTranslation()

  return (
    <div tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-3 shadow-[0_18px_40px_-34px_rgba(83,48,31,0.65)]">
      <div tw="mb-2 flex items-center justify-between gap-3">
        <div tw="min-w-0">
          <Label>{t('setupForm.bowlPreview')}</Label>
          <p tw="mt-0.5 truncate text-[12px] font-semibold text-[rgb(var(--color-text))]">
            {kind === 'sectors' ? t('setupForm.separateSectors') : kind === 'layers' ? t('setupForm.stackedLayers') : t('setupForm.mixedCompot')}
          </p>
        </div>
        <span tw="shrink-0 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">{t('setupForm.tobaccoCount', { count: items.length || 0 })}</span>
      </div>

      <div tw="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(0,0.8fr)] sm:items-center">
        <div tw="relative h-[250px] overflow-hidden rounded-lg bg-transparent sm:h-[280px]">
          {kind === 'layers' && <LayerStackDiagram items={items} />}
          <Suspense fallback={<div tw="h-full w-full rounded-lg bg-[rgb(var(--color-surface-muted))]" />}>
            <LazyMixBowlPreview
              autoRotate
              bowlModel={bowlModel}
              cameraPosition={[0, 2.2, 4.35]}
              fov={34}
              kind={kind}
              items={items}
              renderMode="live"
              sceneScale={0.94}
              style={{ background: 'transparent', height: '100%', width: '100%' }}
            />
          </Suspense>
        </div>

        <div tw="grid gap-1.5">
          {items.length ? items.map((item, index) => (
            <div
              key={item.id}
              css={[
                tw`grid items-center gap-2 text-[12px]`,
                kind === 'layers' ? tw`grid-cols-[24px_minmax(0,1fr)_42px]` : tw`grid-cols-[12px_minmax(0,1fr)_42px]`,
              ]}
            >
              {kind === 'layers' ? (
                <span tw="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]" style={{ backgroundColor: item.color }}>
                  {index + 1}
                </span>
              ) : (
                <span tw="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
              )}
              <span tw="truncate font-semibold text-[rgb(var(--color-text))]">{item.name}</span>
              <span tw="text-right font-semibold tabular-nums text-[rgb(var(--color-text-muted))]">{item.percentage}%</span>
            </div>
          )) : (
            <Muted>{t('setupForm.addTobaccosForPreview')}</Muted>
          )}
        </div>
      </div>
    </div>
  )
}

const StepButton = ({ index, title, active, complete, disabled, onClick }: StepButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    css={[
      tw`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all duration-150`,
      active
        ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent-muted))]`
        : tw`border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-accent-border))]`,
      disabled && tw`cursor-not-allowed opacity-45 hover:border-[rgb(var(--color-border))]`,
    ]}
  >
    <span
      css={[
        tw`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold`,
        complete ? tw`bg-[rgb(var(--color-success))] text-white` : active ? tw`bg-[rgb(var(--color-accent))] text-white` : tw`bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-text-muted))]`,
      ]}
    >
      {complete ? '✓' : index}
    </span>
    <span tw="truncate text-[12px] font-semibold text-[rgb(var(--color-text))]">{title}</span>
  </button>
)

const Choice = ({ label, value, onChange, options, icon, loading }: ChoiceProps) => {
  const selectedName = getName(options, value)
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const brandOptions = useMemo(() => getBrandOptions(options), [options])
  const filteredOptions = useMemo(() => {
    const matched = filterCatalogItems(options, search, brand)
    const selectedItem = (options || []).find((option: any) => option.id === value)
    if (selectedItem && !matched.some((option: any) => option.id === selectedItem.id)) {
      return [selectedItem, ...matched]
    }
    return matched
  }, [brand, options, search, value])

  useEffect(() => {
    setSearch('')
    setBrand('')
  }, [label])

  return (
    <div tw="min-w-0 rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3 shadow-[0_1px_2px_rgba(24,24,27,0.03)]">
      <div tw="mb-3 flex items-center justify-between gap-3">
        <div tw="flex min-w-0 items-center gap-2">
          <span
            css={[
              tw`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border`,
              selectedName ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent-muted))] text-[rgb(var(--color-accent))]` : tw`border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] text-[rgb(var(--color-text-subtle))]`,
            ]}
          >
            <CatalogIcon name={icon} size={17} />
          </span>
          <div tw="min-w-0">
            <Label>{label}</Label>
            <p tw="mt-0.5 truncate text-[12px] font-semibold text-[rgb(var(--color-text))]">
              {selectedName || t('common.notSelected')}
            </p>
          </div>
        </div>
      </div>
      {((options?.length || 0) > 3 || brandOptions.length > 1) && (
        <div tw="mb-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('setupForm.searchEquipment', { name: label.toLowerCase() })}
          />
          {brandOptions.length > 1 && (
            <Select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              aria-label={t('setupForm.brandFilter')}
            >
              <option value="">{t('setupForm.allBrands')}</option>
              {brandOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
              ))}
            </Select>
          )}
        </div>
      )}
      <div tw="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">
        <span>{t('setupForm.visibleMatches', { shown: filteredOptions.length, total: options?.length || 0 })}</span>
        <span>{t('setupForm.maxRowsHint')}</span>
      </div>
      {loading && !options?.length ? (
        <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
          {t('setupForm.catalogLoading')}
        </div>
      ) : (
        <VirtualCatalogList
          items={filteredOptions}
          estimateSize={78}
          empty={Boolean(options?.length) ? (
            <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
              {t('setupForm.noEquipmentMatches')}
            </div>
          ) : (
            <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
              {t('common.noOptions')}
            </div>
          )}
          renderItem={(option: any) => {
            const selected = option.id === value
            const photo = option.photo_urls?.[0]
            const optionBrand = getCatalogBrand(option)

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                aria-pressed={selected}
                className="group"
                css={[
                  tw`grid min-h-[70px] w-full min-w-0 grid-cols-[56px_minmax(0,1fr)_24px] items-center gap-2 overflow-hidden rounded-lg border bg-[rgb(var(--color-surface))] p-2 text-left transition-all duration-150`,
                  selected
                    ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent-muted))] shadow-[0_12px_24px_-18px_rgba(83,48,31,0.75)]`
                    : tw`border-[rgb(var(--color-border-muted))] hover:border-[rgb(var(--color-accent-border))] hover:bg-[rgb(var(--color-surface-raised))]`,
                ]}
              >
                <span tw="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-[rgb(var(--color-surface-muted))] text-[rgb(var(--color-text-subtle))]">
                  {photo ? (
                    <img src={photo} alt="" loading="lazy" decoding="async" tw="h-full w-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-[1.03]" />
                  ) : (
                    <CatalogIcon name={icon} size={26} />
                  )}
                </span>
                <span tw="min-w-0">
                  {optionBrand && (
                    <span tw="mb-1 block truncate text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
                      {optionBrand}
                    </span>
                  )}
                  <span tw="block text-[12px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2">
                    {option.name}
                  </span>
                </span>
                <span
                  css={[
                    tw`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold shadow-sm`,
                    selected ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent))] text-white` : tw`border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-transparent`,
                  ]}
                >
                  ✓
                </span>
              </button>
            )
          }}
        />
      )}
    </div>
  )
}

export const SetupForm = ({ initialValues, isEdit }: SetupFormProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasAuthToken() })
  const { data: bowls, isFetching: bowlsLoading } = useGetBowlsQuery()
  const { data: tobaccos, isFetching: tobaccosLoading } = useGetTobaccosQuery()
  const { data: coals, isFetching: coalsLoading } = useGetCoalsQuery()
  const { data: kalouds, isFetching: kaloudsLoading } = useGetKaloudsQuery()
  const { data: placements, isFetching: placementsLoading } = useGetCoalPlacementsQuery()
  const { data: types, isFetching: typesLoading } = useGetBowlSetupTypesQuery()
  const [createSetup, { isLoading: creating }] = useCreateSetupMutation()
  const [updateSetup, { isLoading: updating }] = useUpdateSetupMutation()
  const savedDraft = useMemo(() => (!isEdit && !initialValues ? readSetupDraft() : null), [initialValues, isEdit])

  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialValues?.name || savedDraft?.name || '')
  const [nameEdited, setNameEdited] = useState(Boolean(initialValues?.name || savedDraft?.name))
  const [description, setDescription] = useState(initialValues?.description || savedDraft?.description || '')
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialValues?.photo_urls || savedDraft?.photoUrls || [])
  const [tags, setTags] = useState<string[]>(initialValues?.tags || savedDraft?.tags || [])
  const [tagDraft, setTagDraft] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [bowlId, setBowlId] = useState(initialValues?.bowl_id || savedDraft?.bowlId || '')
  const [coalId, setCoalId] = useState(initialValues?.coal_id || savedDraft?.coalId || '')
  const [kaloudId, setKaloudId] = useState(initialValues?.kaloud_id || savedDraft?.kaloudId || '')
  const [placementId, setPlacementId] = useState(initialValues?.coal_placement_id || savedDraft?.placementId || '')
  const [typeId, setTypeId] = useState(initialValues?.bowl_setup_type_id || savedDraft?.typeId || '')
  const [activeEquipmentIndex, setActiveEquipmentIndex] = useState(0)
  const [error, setError] = useState('')
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)
  const [tobaccoSearch, setTobaccoSearch] = useState('')
  const [tobaccoBrand, setTobaccoBrand] = useState('')
  const [tobaccoMix, setTobaccoMix] = useState<TobaccoMixRow[]>(
    savedDraft?.tobaccoMix?.length
      ? savedDraft.tobaccoMix
      : initialValues?.tobaccos?.length
      ? initialValues.tobaccos.map((item: any, index: number) => ({
        tobacco_id: item.tobacco_id || '',
        percentage: item.percentage || 1,
        color: MIX_COLORS[index % MIX_COLORS.length],
      }))
      : [],
  )

  const mixTotal = tobaccoMix.reduce((sum, item) => sum + Number(item.percentage || 0), 0)
  const duplicateTobaccoIds = useMemo(() => {
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    tobaccoMix.forEach((item) => {
      if (!item.tobacco_id) return
      if (seen.has(item.tobacco_id)) duplicates.add(item.tobacco_id)
      seen.add(item.tobacco_id)
    })
    return duplicates
  }, [tobaccoMix])
  const equipmentReady = Boolean(bowlId && coalId && kaloudId && placementId && typeId)
  const mixReady = tobaccoMix.length > 0
    && tobaccoMix.every((item) => item.tobacco_id && item.percentage >= 1 && item.percentage <= 100)
    && duplicateTobaccoIds.size === 0
    && mixTotal === 100
  const generatedName = useMemo(() => {
    const names = tobaccoMix
      .map((item) => getName(tobaccos, item.tobacco_id))
      .filter(Boolean)
    return names.length ? names.join(' + ') : ''
  }, [tobaccoMix, tobaccos])
  const setupTypeOptions = useMemo(() => {
    const catalogTypes = types as CatalogItem[] | undefined
    if (!catalogTypes?.length) return catalogTypes

    const known = SETUP_TYPE_PRESETS
      .map((preset) => catalogTypes.find((type) => detectSetupKind(type.name || '') === preset.kind))
      .filter((type): type is CatalogItem => Boolean(type))
    const selectedUnknown = catalogTypes.find((type) => type.id === typeId && !known.some((knownType) => knownType.id === type.id))

    if (!known.length) return catalogTypes
    return selectedUnknown ? [...known, selectedUnknown] : known
  }, [typeId, types])
  const selectedSetupKind = detectSetupKind(getName(types, typeId))
  const selectedBowl = bowls?.find((item: any) => item.id === bowlId)
  const selectedBowlModel = detectBowlModel(selectedBowl)
  const previewItems = useMemo<MixPreviewItem[]>(() => tobaccoMix
    .filter((item) => item.tobacco_id)
    .map((item, index) => ({
      id: item.tobacco_id,
      name: getName(tobaccos, item.tobacco_id) || `Tobacco ${index + 1}`,
      percentage: Number(item.percentage || 0),
      color: item.color || MIX_COLORS[index % MIX_COLORS.length],
    })), [tobaccoMix, tobaccos])
  const setupCost = useMemo(() => calculateSetupCost({
    bowl: selectedBowl,
    coal: coals?.find((item: any) => item.id === coalId),
    mix: tobaccoMix,
    placement: placements?.find((item: any) => item.id === placementId),
    tobaccos,
  }), [coalId, coals, placementId, placements, selectedBowl, tobaccoMix, tobaccos])
  const selectedTobaccoIds = useMemo(() => new Set(tobaccoMix.map((item) => item.tobacco_id)), [tobaccoMix])
  const duplicateQueryIds = useMemo(() => tobaccoMix.map((item) => item.tobacco_id).filter(Boolean), [tobaccoMix])
  const { data: duplicateSetupsPage } = useGetSetupsQuery(
    { tobacco_ids: duplicateQueryIds, limit: 3 },
    { skip: duplicateQueryIds.length === 0 },
  )
  const duplicateSetups = useMemo(() => (
    Array.isArray(duplicateSetupsPage)
      ? duplicateSetupsPage
      : duplicateSetupsPage?.items || []
  ).filter((setup: any) => setup.id !== initialValues?.id), [duplicateSetupsPage, initialValues?.id])
  const tobaccoBrandOptions = useMemo(() => getBrandOptions(tobaccos), [tobaccos])
  const matchingTobaccos = useMemo(() => (
    filterCatalogItems(tobaccos, tobaccoSearch, tobaccoBrand)
  ), [tobaccoBrand, tobaccoSearch, tobaccos])
  const availableTobaccos = useMemo(() => (
    matchingTobaccos.filter((tobacco: any) => !selectedTobaccoIds.has(tobacco.id))
  ), [matchingTobaccos, selectedTobaccoIds])
  const selectedTobaccoRows = useMemo(() => (
    tobaccoMix.map((mix, index) => {
      const catalogItem = (tobaccos || []).find((tobacco: any) => tobacco.id === mix.tobacco_id)
      return catalogItem || {
        id: mix.tobacco_id,
        name: t('common.tobaccoFallback', { number: index + 1 }),
        photo_urls: [],
      }
    })
  ), [t, tobaccoMix, tobaccos])
  const canSubmit = Boolean(name.trim() && equipmentReady && mixReady)
  const isSaving = creating || updating
  const equipmentItems: EquipmentItem[] = [
    { label: t('setupDetail.bowl'), value: bowlId, onChange: setBowlId, options: bowls, icon: 'bowl', loading: bowlsLoading },
    { label: t('setupDetail.kaloud'), value: kaloudId, onChange: setKaloudId, options: kalouds, icon: 'kaloud', loading: kaloudsLoading },
    { label: t('setupDetail.coal'), value: coalId, onChange: setCoalId, options: coals, icon: 'coal', loading: coalsLoading },
    { label: t('setupDetail.coalPlacement'), value: placementId, onChange: setPlacementId, options: placements, icon: 'placement', loading: placementsLoading },
    { label: t('itemForm.setupType'), value: typeId, onChange: setTypeId, options: setupTypeOptions, icon: 'setupType', loading: typesLoading },
  ]
  const activeEquipment = equipmentItems[activeEquipmentIndex] || equipmentItems[0]
  const selectedEquipmentCount = equipmentItems.filter((item) => item.value).length
  const nextMissingEquipment = equipmentItems.find((item) => !item.value)?.label
  const savedRef = useRef(false)
  const isDirty = useMemo(() => {
    if (savedRef.current) return false
    if (isEdit) {
      return Boolean(name.trim() || description.trim() || photoUrls.length || tobaccoMix.length || bowlId || coalId || kaloudId || placementId || typeId)
    }
    return Boolean(name.trim() || description.trim() || photoUrls.length || tobaccoMix.length || bowlId || coalId || kaloudId || placementId || typeId || tags.length)
  }, [bowlId, coalId, description, isEdit, kaloudId, name, photoUrls.length, placementId, tags.length, tobaccoMix.length, typeId])
  const confirmLeave = () => !isDirty || window.confirm('Несохраненные изменения будут потеряны. Уйти со страницы?')

  useEffect(() => {
    if (!nameEdited) {
      setName(generatedName)
    }
  }, [generatedName, nameEdited])

  useEffect(() => {
    if (isEdit || !isDirty) return undefined
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(SETUP_DRAFT_STORAGE_KEY, JSON.stringify({
        name,
        description,
        photoUrls,
        bowlId,
        coalId,
        kaloudId,
        placementId,
        typeId,
        tobaccoMix,
        tags,
      }))
      setDraftSavedAt(Date.now())
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [bowlId, coalId, description, isDirty, isEdit, kaloudId, name, photoUrls, placementId, tags, tobaccoMix, typeId])

  const addTag = () => {
    const clean = tagDraft.trim().toLowerCase()
    if (!clean || tags.includes(clean) || tags.length >= 8) return
    setTags((current) => [...current, clean])
    setTagDraft('')
  }

  useEffect(() => {
    if (!draftSavedAt) return undefined
    const timeout = window.setTimeout(() => setDraftSavedAt(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [draftSavedAt])

  useEffect(() => {
    if (!isDirty) return undefined

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const toggleTobacco = (tobaccoId: string) => {
    setTobaccoMix((items) => {
      const exists = items.some((item) => item.tobacco_id === tobaccoId)
      const next = exists
        ? items.filter((item) => item.tobacco_id !== tobaccoId)
        : [...items, { tobacco_id: tobaccoId, percentage: 1, color: MIX_COLORS[items.length % MIX_COLORS.length] }]
      return equalized(next)
    })
  }

  const handleEquipmentChange = (value: string) => {
    activeEquipment.onChange(value)

    const nextEquipmentItems = equipmentItems.map((item, index) => (
      index === activeEquipmentIndex ? { ...item, value } : item
    ))
    const nextMissingIndex = nextEquipmentItems.findIndex((item) => !item.value)

    if (nextMissingIndex === -1) {
      setStep(1)
      return
    }

    setActiveEquipmentIndex(nextMissingIndex)
  }

  const updateTobaccoPercent = (tobaccoId: string, percentage: number) => {
    setTobaccoMix((items) => items.map((item) => (
      item.tobacco_id === tobaccoId ? { ...item, percentage } : item
    )))
  }

  const moveTobaccoLayer = (index: number, direction: -1 | 1) => {
    setTobaccoMix((items) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= items.length) return items

      const next = [...items]
      const current = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = current
      return next
    })
  }

  const handleNextStep = () => {
    setError('')

    if (step === 0) {
      if (!equipmentReady) {
        setError(t('setupForm.completeEquipment'))
        return
      }
      setStep(1)
      return
    }

    if (step === 1) {
      if (!mixReady) {
        setError(t('setupForm.completeMix'))
        return
      }
      setStep(2)
    }
  }

  const handleStepClick = (targetStep: number) => {
    setError('')
    if (targetStep === 0) {
      setStep(0)
      return
    }
    if (!equipmentReady) {
      setError(t('setupForm.completeEquipment'))
      setStep(0)
      return
    }
    if (targetStep === 1) {
      setStep(1)
      return
    }
    if (!mixReady) {
      setError(duplicateTobaccoIds.size ? 'В миксе не должно быть одинаковых табаков.' : t('setupForm.completeMix'))
      setStep(1)
      return
    }
    setStep(2)
  }

  const handleSave = async () => {
    if (step < 2) {
      handleNextStep()
      return
    }

    const preparedTobaccos = tobaccoMix.map((item) => ({
      tobacco_id: item.tobacco_id,
      percentage: Number(item.percentage),
    }))

    if (!equipmentReady) {
      setError(t('setupForm.completeEquipment'))
      setStep(0)
      return
    }

    if (!mixReady) {
      setError(duplicateTobaccoIds.size ? 'В миксе не должно быть одинаковых табаков.' : t('setupForm.completeMix'))
      setStep(1)
      return
    }

    if (!name.trim()) {
      setError(t('setupForm.addSetupName'))
      setStep(2)
      return
    }

    setError('')
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      bowl_id: bowlId,
      kaloud_id: kaloudId,
      coal_id: coalId,
      coal_placement_id: placementId,
      bowl_setup_type_id: typeId,
      photo_urls: photoUrls,
      tags,
      tobaccos: preparedTobaccos,
    }

    try {
      setPreviewOpen(false)
      if (isEdit && initialValues?.id) {
        await updateSetup({ id: initialValues.id, ...body }).unwrap()
      } else {
        await createSetup(body).unwrap()
      }
      savedRef.current = true
      window.localStorage.removeItem(SETUP_DRAFT_STORAGE_KEY)
      navigate('/')
    } catch {
      setError(t('setupForm.saveFailed'))
    }
  }

  if (!profile) {
    return (
      <div tw="flex flex-col items-center justify-center py-20 text-center">
        <div tw="w-16 h-16 bg-[rgb(var(--color-surface-muted))] rounded-2xl flex items-center justify-center mb-5">
          <LockIcon tw="text-[rgb(var(--color-text-subtle))]" />
        </div>
        <h2 tw="text-[15px] font-semibold text-[rgb(var(--color-text))] mb-1">{t('common.signInRequired')}</h2>
        <p tw="text-sm text-[rgb(var(--color-text-subtle))]">{t('setupForm.signInHint')}</p>
      </div>
    )
  }

  return (
    <div tw="max-w-3xl">
      <button
        onClick={() => {
          if (confirmLeave()) navigate(-1)
        }}
        tw="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-[rgb(var(--color-text-muted))] transition-colors hover:text-[rgb(var(--color-text))]"
      >
        <BackIcon />
        {t('common.back')}
      </button>

      <form onSubmit={(event) => event.preventDefault()}>
        <Card>
          <div tw="flex flex-col gap-4 p-4 sm:p-5">
            <div tw="flex items-start justify-between gap-3">
              <div tw="flex items-start gap-3">
                <div tw="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-text-muted))]">
                  <CatalogIcon name="setupType" size={19} />
                </div>
                <div>
                  <p tw="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">{t('setupForm.bowlSetup')}</p>
                  <h1 tw="mt-0.5 text-lg font-semibold text-[rgb(var(--color-text))]">{isEdit ? t('setupForm.editSetup') : t('setupForm.newSetup')}</h1>
                </div>
              </div>
              <div tw="hidden shrink-0 items-center gap-2 sm:inline-flex">
                {!isEdit && (
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (confirmLeave()) navigate('/ai-chat')
                  }}>
                    <CatalogIcon name="setupType" size={14} />
                    Chatbot
                  </Button>
                )}
                <span tw="rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
                  {isEdit ? t('common.editing') : t('common.new')}
                </span>
              </div>
            </div>

            {!isEdit && draftSavedAt && (
              <div tw="rounded-lg border border-[rgb(var(--color-success-border))] bg-[rgb(var(--color-success-surface))] px-3 py-2 text-[12px] font-bold text-[rgb(var(--color-success))]">
                Черновик сохранён
              </div>
            )}

            <div tw="grid grid-cols-3 gap-2">
              <StepButton
                index={1}
                title={t('setupForm.equipment')}
                active={step === 0}
                complete={equipmentReady}
                onClick={() => handleStepClick(0)}
              />
              <StepButton
                index={2}
                title={t('setupForm.tobaccos')}
                active={step === 1}
                complete={mixReady}
                disabled={!equipmentReady}
                onClick={() => handleStepClick(1)}
              />
              <StepButton
                index={3}
                title={t('setupForm.name')}
                active={step === 2}
                complete={Boolean(name.trim())}
                disabled={!equipmentReady || !mixReady}
                onClick={() => handleStepClick(2)}
              />
            </div>

            {error && (
              <div tw="rounded-lg border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-surface))] px-3 py-2 text-[13px] font-medium text-[rgb(var(--color-danger))]">
                {error}
              </div>
            )}

            {step === 0 && (
              <section tw="flex flex-col gap-4">
                <div tw="rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-3">
                  <div tw="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div tw="min-w-0">
                      <StepTitle>{t('setupForm.equipment')}</StepTitle>
                      <p tw="mt-1 text-[12px] font-medium leading-relaxed text-[rgb(var(--color-text-muted))]">
                        {equipmentReady ? t('setupForm.equipmentReadyHint') : t('setupForm.equipmentHint')}
                      </p>
                    </div>
                    <div
                      css={[
                        tw`shrink-0 rounded-lg border px-3 py-2 transition-all duration-200`,
                        equipmentReady ? tw`border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] shadow-[0_10px_22px_-22px_rgba(83,48,31,0.55)]` : tw`border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]`,
                      ]}
                    >
                      <p tw="text-sm font-semibold tabular-nums text-[rgb(var(--color-text))]">
                        {t('setupForm.selected', { count: selectedEquipmentCount })}
                      </p>
                      <p tw="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
                        {nextMissingEquipment ? t('setupForm.nextMissing', { name: nextMissingEquipment }) : t('setupForm.equipmentReadyTitle')}
                      </p>
                    </div>
                  </div>
                  <div tw="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
                    {equipmentItems.map((item, index) => {
                      const selectedName = getName(item.options, item.value)
                      const active = index === activeEquipmentIndex

                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setActiveEquipmentIndex(index)}
                          css={[
                            tw`flex h-full min-h-[58px] min-w-0 items-start gap-2 rounded-lg border px-2 py-2 text-left transition-all duration-150`,
                            active
                              ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-surface))] shadow-[0_10px_24px_-22px_rgba(83,48,31,0.75)]`
                              : selectedName
                                ? tw`border-[rgb(var(--color-success-border))] bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-success-border))]`
                                : tw`border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-raised))] hover:border-[rgb(var(--color-accent-border))]`,
                          ]}
                        >
                          <span
                            css={[
                              tw`flex h-7 w-7 shrink-0 items-center justify-center rounded-md`,
                              selectedName ? tw`bg-[rgb(var(--color-success-surface))] text-[rgb(var(--color-success))]` : active ? tw`bg-[rgb(var(--color-accent))] text-white` : tw`bg-[rgb(var(--color-surface-subtle))] text-[rgb(var(--color-text-subtle))]`,
                            ]}
                          >
                            <CatalogIcon name={item.icon} size={15} />
                          </span>
                          <span tw="flex min-w-0 flex-1 flex-col justify-center self-stretch">
                            <span tw="block text-[10px] font-semibold uppercase leading-tight tracking-wide text-[rgb(var(--color-text-subtle))] line-clamp-2">{item.label}</span>
                            <span tw="block truncate text-[11px] font-semibold text-[rgb(var(--color-text))]">{selectedName || t('common.choose')}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <Choice
                  label={activeEquipment.label}
                  value={activeEquipment.value}
                  onChange={handleEquipmentChange}
                  options={activeEquipment.options}
                  icon={activeEquipment.icon}
                  loading={activeEquipment.loading}
                />
              </section>
            )}

            {step === 1 && (
              <section tw="flex flex-col gap-3">
                <div tw="flex items-baseline justify-between gap-3">
                  <StepTitle>{t('setupForm.tobaccoMix')}</StepTitle>
                  <Muted>
                    {tobaccoMix.length ? t('setupForm.total', { value: mixTotal, type: getName(types, typeId) || 'Compot' }) : t('setupForm.pickTobaccos')}
                  </Muted>
                </div>

                <MixPreview bowlModel={selectedBowlModel} kind={selectedSetupKind} items={previewItems} />

                {duplicateSetups.length > 0 && (
                  <div tw="rounded-lg border border-[rgb(var(--color-accent-border))] bg-[rgb(var(--color-accent-muted))] px-3 py-2 text-[12px] font-semibold text-[rgb(var(--color-text))]">
                    Похожие забивки уже есть: {duplicateSetups.slice(0, 3).map((setup: any) => setup.name).join(', ')}
                  </div>
                )}

                <div tw="grid gap-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div tw="min-w-0">
                    <Label>{t('setupDetail.costTitle')}</Label>
                    <p tw="mt-1 text-[12px] font-semibold leading-relaxed text-[rgb(var(--color-text-muted))]">
                      {setupCost.isComplete ? t('setupForm.costReadyHint') : t('setupForm.costMissingHint')}
                    </p>
                  </div>
                  <div tw="grid grid-cols-3 gap-2 text-center">
                    <div tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1.5">
                      <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
                        {t('setupDetail.tobaccoCost')}
                        {setupCost.tobaccoGrams && (
                          <span tw="normal-case text-[rgb(var(--color-text-muted))]"> ({t('setupDetail.gramsShort', { value: setupCost.tobaccoGrams.toFixed(1) })})</span>
                        )}
                      </p>
                      <p tw="mt-0.5 text-[12px] font-black tabular-nums text-[rgb(var(--color-text))]">{formatMoney(setupCost.tobaccoCost, setupCost.currency) || '-'}</p>
                    </div>
                    <div tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1.5">
                      <p tw="truncate text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
                        {t('setupDetail.coalCost')}
                        {setupCost.coalCount && (
                          <span tw="normal-case text-[rgb(var(--color-text-muted))]"> ({t('setupDetail.coalCountShort', { count: setupCost.coalCount })})</span>
                        )}
                      </p>
                      <p tw="mt-0.5 text-[12px] font-black tabular-nums text-[rgb(var(--color-text))]">{formatMoney(setupCost.coalCost, setupCost.currency) || '-'}</p>
                    </div>
                    <div tw="rounded-md bg-[rgb(var(--color-surface-inverse))] px-2 py-1.5 text-white">
                      <p tw="text-[9px] font-bold uppercase tracking-wide text-white/60">{t('setupDetail.totalCost')}</p>
                      <p tw="mt-0.5 text-[12px] font-black tabular-nums">{formatMoney(setupCost.total, setupCost.currency) || '-'}</p>
                    </div>
                  </div>
                </div>

                <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-3">
                  <div tw="mb-2 flex items-center justify-between gap-3">
                    <span tw="text-xs font-semibold text-[rgb(var(--color-text-muted))]">{t('setupForm.mixTotal')}</span>
                    <div tw="flex items-center gap-2">
                      {tobaccoMix.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setTobaccoMix((items) => equalized(items))}>
                          {t('setupForm.equal')}
                        </Button>
                      )}
                      <span
                        css={[
                          tw`text-sm font-semibold tabular-nums`,
                          mixTotal === 100 ? tw`text-[rgb(var(--color-success))]` : mixTotal > 100 ? tw`text-[rgb(var(--color-danger))]` : tw`text-[rgb(var(--color-accent))]`,
                        ]}
                      >
                        {mixTotal}%
                      </span>
                    </div>
                  </div>
                  <div tw="h-1.5 overflow-hidden rounded-full border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))]">
                    <div
                      tw="h-full rounded-full transition-all duration-200"
                      css={[
                        mixTotal === 100 ? tw`bg-[rgb(var(--color-success))]` : mixTotal > 100 ? tw`bg-[rgb(var(--color-danger))]` : tw`bg-[rgb(var(--color-accent))]`,
                        { width: `${Math.min(mixTotal, 100)}%` },
                      ]}
                    />
                  </div>
                </div>

                <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-3">
                  <div tw="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <Input
                      value={tobaccoSearch}
                      onChange={(event) => setTobaccoSearch(event.target.value)}
                      placeholder={t('setupForm.searchTobacco')}
                    />
                    {tobaccoBrandOptions.length > 1 && (
                      <Select
                        value={tobaccoBrand}
                        onChange={(event) => setTobaccoBrand(event.target.value)}
                        aria-label={t('setupForm.brandFilter')}
                      >
                        <option value="">{t('setupForm.allBrands')}</option>
                        {tobaccoBrandOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label} ({option.count})</option>
                        ))}
                      </Select>
                    )}
                  </div>
                  <div tw="mt-2 flex flex-col gap-1 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))] sm:flex-row sm:items-center sm:justify-between">
                    <span>{t('setupForm.smartSearchHint')}</span>
                    <span>{t('setupForm.visibleMatches', { shown: availableTobaccos.length, total: tobaccos?.length || 0 })}</span>
                  </div>
                </div>

                {selectedTobaccoRows.length > 0 && (
                  <div tw="flex flex-col gap-2">
                    <div tw="flex items-center justify-between gap-3">
                      <Label>{t('setupForm.selectedTobaccos')}</Label>
                      <Muted>{t('setupForm.tobaccoCount', { count: selectedTobaccoRows.length })}</Muted>
                    </div>
                    <div tw="grid grid-cols-1 gap-2">
                      {selectedTobaccoRows.map((tobacco: any) => {
                        const selectedMixIndex = tobaccoMix.findIndex((item) => item.tobacco_id === tobacco.id)
                        const selectedMix = selectedMixIndex >= 0 ? tobaccoMix[selectedMixIndex] : undefined
                        if (!selectedMix) return null

                        const photo = tobacco.photo_urls?.[0]
                        const showLayerControls = selectedSetupKind === 'layers' && tobaccoMix.length > 1
                        const isBottomLayer = selectedMixIndex === 0
                        const isTopLayer = selectedMixIndex === tobaccoMix.length - 1
                        const strength = getTobaccoStrength(tobacco)
                        const tobaccoBrandName = getCatalogBrand(tobacco)

                        return (
                          <div
                            key={tobacco.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleTobacco(tobacco.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                toggleTobacco(tobacco.id)
                              }
                            }}
                            css={[
                              tw`grid min-h-[104px] cursor-pointer items-center gap-2 rounded-lg border border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent-muted))] p-2 text-left shadow-[0_10px_22px_-20px_rgba(83,48,31,0.8)] transition-all duration-150`,
                              showLayerControls
                                ? tw`grid-cols-[72px_minmax(0,1fr)_32px] sm:grid-cols-[82px_minmax(0,1fr)_32px]`
                                : tw`grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[82px_minmax(0,1fr)]`,
                            ]}
                          >
                            <span tw="flex aspect-square w-[72px] items-center justify-center overflow-hidden rounded-md bg-[rgb(var(--color-surface-muted))] text-[rgb(var(--color-text-subtle))] sm:w-[82px]">
                              {photo ? (
                                <img src={photo} alt="" loading="lazy" decoding="async" tw="h-full w-full object-cover" />
                              ) : (
                                <CatalogIcon name="tobacco" size={30} />
                              )}
                            </span>
                            <span tw="min-w-0">
                              {tobaccoBrandName && (
                                <span tw="mb-1 block truncate text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
                                  {tobaccoBrandName}
                                </span>
                              )}
                              <span tw="block text-[12px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2">
                                {tobacco.name}
                              </span>
                              <span tw="mt-1.5 block">
                                <StrengthIndicator value={strength} compact />
                              </span>
                              <span tw="mt-1.5 block" onClick={(event) => event.stopPropagation()}>
                                <span tw="mb-1.5 flex items-center gap-1.5">
                                  <span
                                    tw="flex h-5 min-w-5 items-center justify-center rounded text-[10px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
                                    style={{ backgroundColor: selectedMix.color || MIX_COLORS[selectedMixIndex % MIX_COLORS.length] }}
                                  >
                                    {selectedSetupKind === 'layers' ? selectedMixIndex + 1 : '✓'}
                                  </span>
                                  <span tw="min-w-0 truncate text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
                                    {selectedSetupKind === 'layers'
                                      ? isTopLayer ? t('setupForm.topLayer') : isBottomLayer ? t('setupForm.bottomLayer') : t('setupForm.layer', { number: selectedMixIndex + 1 })
                                      : t('setupForm.selectedLabel')}
                                  </span>
                                  <span tw="ml-auto text-[11px] font-bold tabular-nums text-[rgb(var(--color-text))]">
                                    {selectedMix.percentage}%
                                  </span>
                                </span>
                                <span tw="grid grid-cols-[1fr_58px] items-center gap-2">
                                  <input
                                    type="range"
                                    min={1}
                                    max={100}
                                    value={selectedMix.percentage}
                                    onChange={(event) => updateTobaccoPercent(tobacco.id, Number(event.target.value))}
                                    tw="w-full accent-[rgb(var(--color-accent))]"
                                    aria-label={t('setupForm.percentageAria', { name: tobacco.name })}
                                  />
                                  <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={selectedMix.percentage}
                                    onChange={(event) => updateTobaccoPercent(tobacco.id, Number(event.target.value))}
                                  />
                                </span>
                              </span>
                            </span>
                            {showLayerControls && (
                              <span tw="flex flex-col items-center gap-1" onClick={(event) => event.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => moveTobaccoLayer(selectedMixIndex, 1)}
                                  disabled={isTopLayer}
                                  title={t('setupForm.moveLayerUp')}
                                  tw="flex h-7 w-7 items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition-colors hover:border-[rgb(var(--color-accent-border))] disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <VoteUpIcon size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveTobaccoLayer(selectedMixIndex, -1)}
                                  disabled={isBottomLayer}
                                  title={t('setupForm.moveLayerDown')}
                                  tw="flex h-7 w-7 items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition-colors hover:border-[rgb(var(--color-accent-border))] disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <VoteDownIcon size={13} />
                                </button>
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {tobaccosLoading && !tobaccos?.length ? (
                  <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
                    {t('setupForm.catalogLoading')}
                  </div>
                ) : (
                  <VirtualCatalogList
                    items={availableTobaccos}
                    estimateSize={98}
                    empty={Boolean(tobaccos?.length) ? (
                      <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
                        {t('setupForm.noTobaccoMatches')}
                      </div>
                    ) : (
                      <div tw="rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
                        {t('common.noOptions')}
                      </div>
                    )}
                    renderItem={(tobacco: any) => {
                      const photo = tobacco.photo_urls?.[0]
                      const strength = getTobaccoStrength(tobacco)
                      const tobaccoBrandName = getCatalogBrand(tobacco)

                      return (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleTobacco(tobacco.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              toggleTobacco(tobacco.id)
                            }
                          }}
                          tw="grid min-h-[90px] cursor-pointer grid-cols-[72px_minmax(0,1fr)_24px] items-center gap-2 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] p-2 text-left transition-all duration-150 hover:border-[rgb(var(--color-accent-border))] sm:grid-cols-[82px_minmax(0,1fr)_24px]"
                        >
                          <span tw="flex aspect-square w-[72px] items-center justify-center overflow-hidden rounded-md bg-[rgb(var(--color-surface-muted))] text-[rgb(var(--color-text-subtle))] sm:w-[82px]">
                            {photo ? (
                              <img src={photo} alt="" loading="lazy" decoding="async" tw="h-full w-full object-cover" />
                            ) : (
                              <CatalogIcon name="tobacco" size={30} />
                            )}
                          </span>
                          <span tw="min-w-0">
                            {tobaccoBrandName && (
                              <span tw="mb-1 block truncate text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">
                                {tobaccoBrandName}
                              </span>
                            )}
                            <span tw="block text-[12px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2">
                              {tobacco.name}
                            </span>
                            <span tw="mt-1.5 block">
                              <StrengthIndicator value={strength} compact />
                            </span>
                          </span>
                          <span tw="flex h-6 w-6 items-center justify-center rounded-full border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]">
                            +
                          </span>
                        </div>
                      )
                    }}
                  />
                )}
              </section>
            )}

            {step === 2 && (
              <section tw="flex flex-col gap-4">
                <div tw="flex items-baseline justify-between gap-3">
                  <StepTitle>{t('setupForm.nameAndDetails')}</StepTitle>
                  <Muted>{nameEdited ? t('setupForm.customName') : t('common.autoGenerated')}</Muted>
                </div>

                <div tw="grid grid-cols-1 gap-4">
                  <div tw="flex flex-col gap-1.5">
                    <Input
                      label={t('setupForm.setupName')}
                      value={name}
                      onChange={(event) => {
                        setNameEdited(true)
                        setName(event.target.value)
                      }}
                      maxLength={90}
                      placeholder={generatedName || t('setupForm.selectedTobaccos')}
                    />
                    <div tw="flex justify-between gap-3 text-[10px] text-[rgb(var(--color-text-subtle))]">
                      <span tw="truncate">{t('setupForm.generatedHelp')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNameEdited(false)
                          setName(generatedName)
                        }}
                        disabled={!generatedName}
                        tw="shrink-0 font-semibold text-[rgb(var(--color-text-muted))] disabled:opacity-40"
                      >
                        {t('setupForm.useGenerated')}
                      </button>
                    </div>
                  </div>

                  <Textarea
                    label={t('setupForm.notes')}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    maxLength={900}
                    placeholder={t('setupForm.notesPlaceholder')}
                  />

                  <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-3">
                    <Label>Теги</Label>
                    <div tw="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                          tw="rounded-md bg-[rgb(var(--color-surface-inverse))] px-2 py-1 text-[11px] font-bold text-white"
                        >
                          #{tag} ×
                        </button>
                      ))}
                    </div>
                    <div tw="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <Input
                        value={tagDraft}
                        onChange={(event) => setTagDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            addTag()
                          }
                        }}
                        maxLength={24}
                        placeholder="фруктовая, летняя, вечер"
                      />
                      <Button type="button" variant="secondary" onClick={addTag} disabled={!tagDraft.trim() || tags.length >= 8}>
                        Добавить
                      </Button>
                    </div>
                  </div>

                  <PhotoUploader
                    label="Фото забивки"
                    value={photoUrls}
                    onChange={setPhotoUrls}
                    max={6}
                  />
                </div>
              </section>
            )}

            <div tw="flex flex-col-reverse gap-2 border-t border-[rgb(var(--color-border-muted))] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" type="button" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}>
                {step === 0 ? t('common.cancel') : t('common.back')}
              </Button>
              <div tw="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {step < 2 ? (
                  <Button
                    variant="primary"
                    type="button"
                    disabled={step === 0 ? !equipmentReady : !mixReady}
                    onClick={handleNextStep}
                  >
                    {t('common.next')}
                  </Button>
                ) : (
                  <Button variant="primary" type="button" disabled={isSaving || !canSubmit} onClick={() => setPreviewOpen(true)}>
                    {isSaving ? t('common.saving') : isEdit ? t('setupForm.saveSetup') : t('setupForm.publishSetup')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </form>
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Предпросмотр публикации">
        <div tw="grid gap-4">
          <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-3">
            <h2 tw="text-[15px] font-bold text-[rgb(var(--color-text))]">{name || generatedName}</h2>
            {description && <p tw="mt-2 text-[13px] font-medium text-[rgb(var(--color-text-muted))]">{description}</p>}
            <div tw="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => <span key={tag} tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))]">#{tag}</span>)}
            </div>
            <div tw="mt-3 flex flex-wrap gap-1.5">
              {previewItems.map((item) => (
                <span key={item.id} tw="rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[11px] font-bold text-[rgb(var(--color-text-muted))]">
                  {item.name} {item.percentage}%
                </span>
              ))}
            </div>
          </div>
          <div tw="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPreviewOpen(false)}>{t('common.cancel')}</Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>{isSaving ? t('common.saving') : 'Опубликовать'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
