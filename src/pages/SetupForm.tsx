import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Input, Textarea } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import {
  useGetBowlsQuery, useGetTobaccosQuery, useGetCoalsQuery, useGetKaloudsQuery,
  useGetCoalPlacementsQuery, useGetBowlSetupTypesQuery,
  useCreateSetupMutation, useUpdateSetupMutation, useGetProfileQuery,
} from '../shared/api'
import { BackIcon, CatalogIcon, type CatalogIconName, LockIcon, VoteDownIcon, VoteUpIcon } from '../shared/ui/Icons'
import { getTobaccoStrength } from '../shared/setupMetrics'
import { StrengthIndicator } from '../shared/ui/StrengthIndicator'
import { BowlPreviewFallback, detectBowlModel, useIsomorphicLayoutEffect, type BowlModel } from '../shared/ui/MixBowlPreview'
import { calculateSetupCost, formatMoney } from '../shared/setupCost'
import { hasAuthToken } from '../shared/authToken'

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
}

interface EquipmentItem {
  label: string
  value: string
  onChange: (value: string) => void
  options?: any[]
  icon: CatalogIconName
}

interface StepButtonProps {
  index: number
  title: string
  active: boolean
  complete: boolean
  disabled?: boolean
  onClick: () => void
}

type SetupKind = 'sectors' | 'layers' | 'compot'

interface MixPreviewItem {
  id: string
  name: string
  percentage: number
  color: string
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

const MIX_COLORS = ['#9F1D24', '#1F1716', '#B96A18', '#5F2D22', '#7A171E', '#3E251B', '#C18A2F']

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

const TOBACCO_SURFACE_MAX_Y = 0.765
const TOBACCO_BASE_Y = 0.595

const pseudoRandom = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

const normalizeAngle = (angle: number) => {
  const full = Math.PI * 2
  return ((angle % full) + full) % full
}

const isAngleBetween = (angle: number, start: number, end: number) => {
  const full = Math.PI * 2
  if (Math.abs(end - start) >= full - 0.001) return true
  const normalizedAngle = normalizeAngle(angle)
  const normalizedStart = normalizeAngle(start)
  const normalizedEnd = normalizeAngle(end)

  return normalizedStart <= normalizedEnd
    ? normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd
    : normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd
}

const tobaccoHeight = (x: number, z: number, outer: number, seed: number) => {
  const radius = Math.sqrt(x * x + z * z)
  const edgeFalloff = Math.max(0, 1 - Math.pow(radius / Math.max(outer, 0.001), 2.8))
  const coarse = Math.sin(x * 9.7 + z * 4.1 + seed * 1.7) * 0.045
    + Math.cos(z * 10.9 - x * 3.8 + seed * 2.3) * 0.036
    + Math.sin((x - z) * 15.5 + seed) * 0.028
  const mid = Math.sin(x * 24.3 + z * 18.7 + seed * 0.7) * 0.026
    + Math.cos(z * 27.4 - x * 21.6 + seed) * 0.02
  const fine = (pseudoRandom(seed * 41 + x * 97 + z * 131) - 0.5) * 0.095
  return Math.min(0.23, edgeFalloff * 0.19 + coarse + mid + fine)
}

const getSectorIndex = (angle: number, boundaries: number[]) => {
  const normalized = normalizeAngle(angle)
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    if (normalized >= boundaries[index] && normalized <= boundaries[index + 1]) return index
  }
  return boundaries.length - 2
}

const TobaccoColorSurface = ({
  colorAt,
  end = Math.PI * 2,
  inner = 0,
  outer = 1.02,
  seed,
  start = 0,
  y,
}: {
  colorAt: (x: number, z: number, angle: number, radius: number) => string
  end?: number
  inner?: number
  outer?: number
  seed: number
  start?: number
  y: number
}) => {
  const geometry = useMemo(() => {
    const resolution = 54
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    const vertexMap = new Map<string, number>()

    Array.from({ length: resolution + 1 }).forEach((_, xIndex) => {
      Array.from({ length: resolution + 1 }).forEach((__, zIndex) => {
        const key = `${xIndex}:${zIndex}`
        const xBase = -outer + (xIndex / resolution) * outer * 2
        const zBase = -outer + (zIndex / resolution) * outer * 2
        const isOuterGridEdge = xIndex === 0 || zIndex === 0 || xIndex === resolution || zIndex === resolution
        const jitterScale = isOuterGridEdge ? 0 : outer / resolution * 0.42
        const x = xBase + (pseudoRandom(seed + xIndex * 17 + zIndex * 29) - 0.5) * jitterScale
        const z = zBase + (pseudoRandom(seed + xIndex * 31 + zIndex * 13) - 0.5) * jitterScale
        const radius = Math.sqrt(x * x + z * z)
        const angle = Math.atan2(z, x)

        if (radius < inner || radius > outer || !isAngleBetween(angle, start, end)) return

        const rawHeight = tobaccoHeight(x, z, outer, seed)
        const height = Math.max(-0.035, Math.min(0.23, rawHeight))
        const finalY = Math.min(TOBACCO_SURFACE_MAX_Y, y + height)
        const tint = new THREE.Color(colorAt(x, z, angle, radius)).offsetHSL(
          (pseudoRandom(seed + xIndex * 13 + zIndex * 7) - 0.5) * 0.028,
          -0.16 + pseudoRandom(seed + xIndex * 11 + zIndex * 5) * 0.22,
          -0.23 + pseudoRandom(seed + xIndex * 17 + zIndex * 3) * 0.32,
        )

        vertexMap.set(key, positions.length / 3)
        positions.push(x, finalY, z)
        colors.push(tint.r, tint.g, tint.b)
      })
    })

    Array.from({ length: resolution }).forEach((_, xIndex) => {
      Array.from({ length: resolution }).forEach((__, zIndex) => {
        const a = vertexMap.get(`${xIndex}:${zIndex}`)
        const b = vertexMap.get(`${xIndex + 1}:${zIndex}`)
        const c = vertexMap.get(`${xIndex}:${zIndex + 1}`)
        const d = vertexMap.get(`${xIndex + 1}:${zIndex + 1}`)
        if (a === undefined || b === undefined || c === undefined || d === undefined) return
        indices.push(a, c, b, b, c, d)
      })
    })

    const moundGeometry = new THREE.BufferGeometry()
    moundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    moundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    moundGeometry.setIndex(indices)
    moundGeometry.computeVertexNormals()
    return moundGeometry
  }, [colorAt, end, inner, outer, seed, start, y])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial vertexColors roughness={0.5} metalness={0.01} clearcoat={0.3} clearcoatRoughness={0.42} side={THREE.DoubleSide} />
    </mesh>
  )
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

const BowlScene = ({ bowlModel, kind, items }: { bowlModel: BowlModel; kind: SetupKind; items: MixPreviewItem[] }) => {
  const groupRef = useRef<THREE.Group>(null)
  const userRotationRef = useRef(0.18)
  const userTiltRef = useRef(-0.12)
  const dragRef = useRef({ active: false, x: 0, y: 0, rotation: 0.18, tilt: -0.12 })
  const invalidate = useThree((state) => state.invalidate)
  const isPhunnel = bowlModel === 'phunnel'
  const bowlProfile = useMemo(() => (
    isPhunnel
      ? [
        new THREE.Vector2(0.62, -1.92),
        new THREE.Vector2(0.82, -1.84),
        new THREE.Vector2(0.66, -1.68),
        new THREE.Vector2(0.48, -1.48),
        new THREE.Vector2(0.44, -0.16),
        new THREE.Vector2(0.78, -0.08),
        new THREE.Vector2(1.02, 0.12),
        new THREE.Vector2(1.18, 0.34),
        new THREE.Vector2(1.28, 0.58),
        new THREE.Vector2(1.22, 0.78),
        new THREE.Vector2(1.02, 0.86),
      ]
      : [
        new THREE.Vector2(0.52, -1.12),
        new THREE.Vector2(0.75, -1.06),
        new THREE.Vector2(0.86, -0.76),
        new THREE.Vector2(0.86, -0.22),
        new THREE.Vector2(0.96, 0.18),
        new THREE.Vector2(1.18, 0.42),
        new THREE.Vector2(1.24, 0.62),
        new THREE.Vector2(1.17, 0.76),
        new THREE.Vector2(1.02, 0.84),
      ]
  ), [isPhunnel])
  const innerProfile = useMemo(() => (
    isPhunnel
      ? [
        new THREE.Vector2(0.38, 0.5),
        new THREE.Vector2(0.76, 0.52),
        new THREE.Vector2(1.02, 0.6),
        new THREE.Vector2(1.08, 0.72),
      ]
      : [
        new THREE.Vector2(0.12, 0.5),
        new THREE.Vector2(0.56, 0.46),
        new THREE.Vector2(0.96, 0.54),
        new THREE.Vector2(1.05, 0.68),
      ]
  ), [isPhunnel])

  const applyRotation = () => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = userRotationRef.current
    groupRef.current.rotation.x = userTiltRef.current
    invalidate()
  }

  useFrame((_, delta) => {
    if (dragRef.current.active || !groupRef.current) return
    userRotationRef.current += delta * 0.12
    groupRef.current.rotation.y = userRotationRef.current
    groupRef.current.rotation.x = userTiltRef.current
  })

  return (
    <group
      ref={groupRef}
      position={[0, -0.18, 0]}
      rotation={[-0.12, 0.18, 0]}
      scale={isPhunnel ? [0.93, 0.93, 0.93] : [1.03, 1.03, 1.03]}
      onPointerDown={(event: any) => {
        event.stopPropagation()
        dragRef.current = {
          active: true,
          x: event.clientX,
          y: event.clientY,
          rotation: userRotationRef.current,
          tilt: userTiltRef.current,
        }
        event.target.setPointerCapture?.(event.pointerId)
        applyRotation()
      }}
      onPointerMove={(event: any) => {
        if (!dragRef.current.active) return
        userRotationRef.current = dragRef.current.rotation + (event.clientX - dragRef.current.x) * 0.012
        const nextTilt = dragRef.current.tilt + (event.clientY - dragRef.current.y) * 0.009
        userTiltRef.current = Math.max(-0.82, Math.min(0.48, nextTilt))
        applyRotation()
      }}
      onPointerUp={(event: any) => {
        dragRef.current.active = false
        event.target.releasePointerCapture?.(event.pointerId)
        applyRotation()
      }}
      onPointerLeave={() => {
        dragRef.current.active = false
        applyRotation()
      }}
    >
      <mesh castShadow receiveShadow>
        <latheGeometry args={[bowlProfile, 160]} />
        <meshPhysicalMaterial
          color="#4A3830"
          roughness={0.58}
          metalness={0.03}
          clearcoat={0.24}
          clearcoatRoughness={0.58}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0.035, 0]} castShadow>
        <latheGeometry args={[innerProfile, 160]} />
        <meshStandardMaterial color="#2A211D" roughness={0.8} metalness={0.01} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, isPhunnel ? 0.78 : 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.12, 0.105, 24, 160]} />
        <meshPhysicalMaterial color="#3A2B25" roughness={0.52} metalness={0.04} clearcoat={0.28} clearcoatRoughness={0.52} />
      </mesh>

      {isPhunnel && (
        <>
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.31, 0.39, 0.44, 96]} />
            <meshPhysicalMaterial color="#4A3830" roughness={0.58} metalness={0.03} clearcoat={0.24} clearcoatRoughness={0.58} />
          </mesh>
          <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.23, 0.065, 18, 96]} />
            <meshPhysicalMaterial color="#3A2B25" roughness={0.52} metalness={0.04} clearcoat={0.28} clearcoatRoughness={0.52} />
          </mesh>
          <mesh position={[0, 0.728, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, 72]} />
            <meshBasicMaterial color="#0B0705" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      <mesh position={[0, isPhunnel ? -1.84 : -1.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.58, 0.045, 18, 96]} />
        <meshPhysicalMaterial color="#3C2D27" roughness={0.64} clearcoat={0.18} />
      </mesh>

      <mesh position={[0, isPhunnel ? -1.92 : -1.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.68, 0.54, 0.08, 96]} />
        <meshStandardMaterial color="#322620" roughness={0.7} />
      </mesh>

      {items.length ? (
        kind === 'sectors'
          ? <SectorTobacco bowlModel={bowlModel} items={items} />
          : kind === 'layers'
            ? <LayerTobacco bowlModel={bowlModel} items={items} />
            : <CompotTobacco bowlModel={bowlModel} items={items} />
      ) : (
        <mesh position={[0, 0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {isPhunnel ? <ringGeometry args={[0.36, 0.96, 96]} /> : <circleGeometry args={[0.96, 96]} />}
          <meshStandardMaterial color="#211916" roughness={0.86} />
        </mesh>
      )}
    </group>
  )
}

const SectorTobacco = ({ bowlModel, items }: { bowlModel: BowlModel; items: MixPreviewItem[] }) => {
  const colorAt = useMemo(() => {
    let acc = 0
    const boundaries = [0, ...items.map((item) => {
      acc += item.percentage / 100 * Math.PI * 2
      return acc
    })]

    return (_x: number, _z: number, angle: number) => {
      const shiftedAngle = normalizeAngle(angle + Math.PI / 2)
      const index = getSectorIndex(shiftedAngle, boundaries)
      return items[Math.max(0, Math.min(items.length - 1, index))]?.color || MIX_COLORS[0]
    }
  }, [items])

  return (
    <TobaccoColorSurface
      colorAt={colorAt}
      inner={bowlModel === 'phunnel' ? 0.34 : 0.02}
      outer={1}
      seed={7}
      y={TOBACCO_BASE_Y}
    />
  )
}

const LayerTobacco = ({ bowlModel, items }: { bowlModel: BowlModel; items: MixPreviewItem[] }) => {
  const topColor = items[items.length - 1]?.color || MIX_COLORS[0]
  const topColorAt = useMemo(() => () => topColor, [topColor])

  return (
    <TobaccoColorSurface
      colorAt={topColorAt}
      inner={bowlModel === 'phunnel' ? 0.34 : 0.02}
      outer={1}
      seed={29}
      y={TOBACCO_BASE_Y + 0.012}
    />
  )
}

const LayerStackDiagram = ({ items }: { items: MixPreviewItem[] }) => {
  if (!items.length) return null

  const total = items.reduce((sum, item) => sum + item.percentage, 0) || 100

  return (
    <div tw="pointer-events-none absolute left-2 top-2 z-10 h-11 w-11 overflow-hidden rounded-[3px] border border-[#2F241F]/35 bg-[#211915] sm:left-3 sm:top-3 sm:h-12 sm:w-12">
      <div tw="flex h-full flex-col-reverse overflow-hidden">
        {items.map((item) => (
          <div
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

const CompotTobacco = ({ bowlModel, items }: { bowlModel: BowlModel; items: MixPreviewItem[] }) => {
  const colorAt = useMemo(() => {
    const thresholds = items.reduce<Array<{ limit: number; color: string }>>((result, item) => {
      const previous = result[result.length - 1]?.limit || 0
      result.push({ limit: previous + item.percentage, color: item.color })
      return result
    }, [])

    return (x: number, z: number) => {
      const value = pseudoRandom(73 + Math.floor((x + 1.2) * 19) * 37 + Math.floor((z + 1.2) * 19) * 53) * 100
      return thresholds.find((threshold) => value <= threshold.limit)?.color || items[items.length - 1]?.color || MIX_COLORS[0]
    }
  }, [items])

  return (
    <TobaccoColorSurface
      colorAt={colorAt}
      inner={bowlModel === 'phunnel' ? 0.34 : 0.02}
      outer={1}
      seed={43}
      y={TOBACCO_BASE_Y}
    />
  )
}

const MixPreview = ({ bowlModel, kind, items }: { bowlModel: BowlModel; kind: SetupKind; items: MixPreviewItem[] }) => {
  const [mounted, setMounted] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const { t } = useTranslation()
  const total = items.reduce((sum, item) => sum + item.percentage, 0)
  const normalizedItems = total > 0
    ? items.map((item) => ({ ...item, percentage: item.percentage / total * 100 }))
    : []

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])

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
          {kind === 'layers' && <LayerStackDiagram items={normalizedItems} />}
          <BowlPreviewFallback hidden={sceneReady} />
          {mounted && (
            <Canvas
              camera={{ position: [0, 2.2, 4.35], fov: 34 }}
              dpr={[1, 1.5]}
              frameloop="always"
              gl={{ antialias: true, alpha: true }}
              onCreated={() => {
                requestAnimationFrame(() => setSceneReady(true))
              }}
              shadows={{ enabled: true, type: THREE.PCFShadowMap }}
              style={{ background: 'transparent', cursor: 'grab', inset: 0, position: 'absolute' }}
            >
              <ambientLight intensity={0.72} />
              <hemisphereLight args={['#FFF8EF', '#7A5948', 1.25]} />
              <directionalLight position={[3.5, 5, 4]} intensity={2.55} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
              <directionalLight position={[-4, 2, -3]} intensity={0.65} />
              <BowlScene bowlModel={bowlModel} kind={kind} items={normalizedItems} />
            </Canvas>
          )}
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
            <p tw="text-[12px] font-medium leading-relaxed text-[rgb(var(--color-text-subtle))]">
              {t('setupForm.selectTobaccosHint')}
            </p>
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

const Choice = ({ label, value, onChange, options, icon }: ChoiceProps) => {
  const selectedName = getName(options, value)
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()
  const filteredOptions = useMemo(() => (
    normalizedSearch
      ? (options || []).filter((option: any) => `${option.name || ''} ${option.description || ''}`.toLowerCase().includes(normalizedSearch))
      : options || []
  ), [normalizedSearch, options])

  useEffect(() => {
    setSearch('')
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
      {(options?.length || 0) > 3 && (
        <div tw="mb-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('setupForm.searchEquipment', { name: label.toLowerCase() })}
          />
        </div>
      )}
      <div tw="max-h-[460px] overflow-y-auto pr-1">
        <div tw="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filteredOptions.map((option: any) => {
            const selected = option.id === value
            const photo = option.photo_urls?.[0]

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                aria-pressed={selected}
                className="group"
                css={[
                  tw`relative min-w-0 overflow-hidden rounded-lg border bg-[rgb(var(--color-surface))] text-left transition-all duration-150`,
                  selected
                    ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent-muted))] shadow-[0_12px_24px_-18px_rgba(83,48,31,0.75)]`
                    : tw`border-[rgb(var(--color-border-muted))] hover:border-[rgb(var(--color-accent-border))] hover:bg-[rgb(var(--color-surface-raised))]`,
                ]}
              >
                <span tw="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[rgb(var(--color-surface))] text-[11px] font-semibold text-[rgb(var(--color-text-subtle))] shadow-sm">
                  {selected ? '✓' : ''}
                </span>
                <span tw="flex aspect-square w-full items-center justify-center overflow-hidden bg-[rgb(var(--color-surface-muted))] text-[rgb(var(--color-text-subtle))]">
                  {photo ? (
                    <img src={photo} alt="" tw="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]" />
                  ) : (
                    <CatalogIcon name={icon} size={34} />
                  )}
                </span>
                <span tw="block min-h-[45px] px-2.5 py-2 text-[12px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2">
                  {option.name}
                </span>
              </button>
            )
          })}
          {Boolean(options?.length) && !filteredOptions.length && (
            <div tw="col-span-full rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
              {t('setupForm.noEquipmentMatches')}
            </div>
          )}
          {!options?.length && (
            <div tw="col-span-full rounded-lg border border-dashed border-[rgb(var(--color-border-strong))] px-3 py-4 text-[13px] text-[rgb(var(--color-text-subtle))]">
              {t('common.noOptions')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const SetupForm = ({ initialValues, isEdit }: SetupFormProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasAuthToken() })
  const { data: bowls } = useGetBowlsQuery()
  const { data: tobaccos } = useGetTobaccosQuery()
  const { data: coals } = useGetCoalsQuery()
  const { data: kalouds } = useGetKaloudsQuery()
  const { data: placements } = useGetCoalPlacementsQuery()
  const { data: types } = useGetBowlSetupTypesQuery()
  const [createSetup, { isLoading: creating }] = useCreateSetupMutation()
  const [updateSetup, { isLoading: updating }] = useUpdateSetupMutation()

  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialValues?.name || '')
  const [nameEdited, setNameEdited] = useState(Boolean(initialValues?.name))
  const [description, setDescription] = useState(initialValues?.description || '')
  const [bowlId, setBowlId] = useState(initialValues?.bowl_id || '')
  const [coalId, setCoalId] = useState(initialValues?.coal_id || '')
  const [kaloudId, setKaloudId] = useState(initialValues?.kaloud_id || '')
  const [placementId, setPlacementId] = useState(initialValues?.coal_placement_id || '')
  const [typeId, setTypeId] = useState(initialValues?.bowl_setup_type_id || '')
  const [activeEquipmentIndex, setActiveEquipmentIndex] = useState(0)
  const [error, setError] = useState('')
  const [tobaccoMix, setTobaccoMix] = useState<TobaccoMixRow[]>(
    initialValues?.tobaccos?.length
      ? initialValues.tobaccos.map((item: any, index: number) => ({
        tobacco_id: item.tobacco_id || '',
        percentage: item.percentage || 1,
        color: MIX_COLORS[index % MIX_COLORS.length],
      }))
      : [],
  )

  const mixTotal = tobaccoMix.reduce((sum, item) => sum + Number(item.percentage || 0), 0)
  const equipmentReady = Boolean(bowlId && coalId && kaloudId && placementId && typeId)
  const mixReady = tobaccoMix.length > 0
    && tobaccoMix.every((item) => item.tobacco_id && item.percentage >= 1 && item.percentage <= 100)
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
  const canSubmit = Boolean(name.trim() && equipmentReady && mixReady)
  const isSaving = creating || updating
  const equipmentItems: EquipmentItem[] = [
    { label: t('setupDetail.bowl'), value: bowlId, onChange: setBowlId, options: bowls, icon: 'bowl' },
    { label: t('setupDetail.kaloud'), value: kaloudId, onChange: setKaloudId, options: kalouds, icon: 'kaloud' },
    { label: t('setupDetail.coal'), value: coalId, onChange: setCoalId, options: coals, icon: 'coal' },
    { label: t('setupDetail.coalPlacement'), value: placementId, onChange: setPlacementId, options: placements, icon: 'placement' },
    { label: t('itemForm.setupType'), value: typeId, onChange: setTypeId, options: setupTypeOptions, icon: 'setupType' },
  ]
  const activeEquipment = equipmentItems[activeEquipmentIndex] || equipmentItems[0]
  const selectedEquipmentCount = equipmentItems.filter((item) => item.value).length
  const nextMissingEquipment = equipmentItems.find((item) => !item.value)?.label

  useEffect(() => {
    if (!nameEdited) {
      setName(generatedName)
    }
  }, [generatedName, nameEdited])

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
      setError(t('setupForm.completeMix'))
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
      tobaccos: preparedTobaccos,
    }

    try {
      if (isEdit && initialValues?.id) {
        await updateSetup({ id: initialValues.id, ...body }).unwrap()
      } else {
        await createSetup(body).unwrap()
      }
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
        onClick={() => navigate(-1)}
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
                  <Button type="button" variant="outline" size="sm" onClick={() => navigate('/ai-chat')}>
                    <CatalogIcon name="setupType" size={14} />
                    Chatbot
                  </Button>
                )}
                <span tw="rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
                  {isEdit ? t('common.editing') : t('common.new')}
                </span>
              </div>
            </div>

            <div tw="grid grid-cols-3 gap-2">
              <StepButton
                index={1}
                title={t('setupForm.equipment')}
                active={step === 0}
                complete={equipmentReady}
                onClick={() => setStep(0)}
              />
              <StepButton
                index={2}
                title={t('setupForm.tobaccos')}
                active={step === 1}
                complete={mixReady}
                disabled={!equipmentReady}
                onClick={() => equipmentReady && setStep(1)}
              />
              <StepButton
                index={3}
                title={t('setupForm.name')}
                active={step === 2}
                complete={Boolean(name.trim())}
                disabled={!equipmentReady || !mixReady}
                onClick={() => equipmentReady && mixReady && setStep(2)}
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

                <div tw="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(() => {
                    const tobaccoCatalog = tobaccos || []
                    const layerOrderedTobaccos = selectedSetupKind === 'layers'
                      ? [
                        ...tobaccoMix
                          .map((mix) => tobaccoCatalog.find((tobacco: any) => tobacco.id === mix.tobacco_id))
                          .filter(Boolean),
                        ...tobaccoCatalog.filter((tobacco: any) => !tobaccoMix.some((mix) => mix.tobacco_id === tobacco.id)),
                      ]
                      : tobaccoCatalog

                    return layerOrderedTobaccos.map((tobacco: any) => {
                    const selectedMixIndex = tobaccoMix.findIndex((item) => item.tobacco_id === tobacco.id)
                    const selectedMix = selectedMixIndex >= 0 ? tobaccoMix[selectedMixIndex] : undefined
                    const selected = Boolean(selectedMix)
                    const photo = tobacco.photo_urls?.[0]
                    const showLayerControls = selectedSetupKind === 'layers' && selected && tobaccoMix.length > 1
                    const isBottomLayer = selectedMixIndex === 0
                    const isTopLayer = selectedMixIndex === tobaccoMix.length - 1
                    const strength = getTobaccoStrength(tobacco)

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
                          tw`grid min-h-[86px] cursor-pointer items-center gap-2 rounded-lg border bg-[rgb(var(--color-surface))] p-2 text-left transition-all duration-150`,
                          showLayerControls
                            ? tw`grid-cols-[72px_minmax(0,1fr)_32px] sm:grid-cols-[82px_minmax(0,1fr)_32px]`
                            : tw`grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[82px_minmax(0,1fr)]`,
                          selected
                            ? tw`border-[rgb(var(--color-accent))] bg-[rgb(var(--color-accent-muted))] shadow-[0_10px_22px_-20px_rgba(83,48,31,0.8)]`
                            : tw`border-[rgb(var(--color-border-muted))] hover:border-[rgb(var(--color-accent-border))]`,
                        ]}
                      >
                        <span tw="flex aspect-square w-[72px] items-center justify-center overflow-hidden rounded-md bg-[rgb(var(--color-surface-muted))] text-[rgb(var(--color-text-subtle))] sm:w-[82px]">
                          {photo ? (
                            <img src={photo} alt="" tw="h-full w-full object-cover" />
                          ) : (
                            <CatalogIcon name="tobacco" size={30} />
                          )}
                        </span>
                        <span tw="min-w-0">
                          <span tw="block text-[12px] font-semibold leading-snug text-[rgb(var(--color-text))] line-clamp-2">
                            {tobacco.name}
                          </span>
                          <span tw="mt-1.5 block">
                            <StrengthIndicator value={strength} compact />
                          </span>
                          {selectedMix && (
                            <span tw="mt-1.5 block" onClick={(event) => event.stopPropagation()}>
                              <span tw="mb-1.5 flex items-center gap-1.5">
                                <span
                                  tw="flex h-5 min-w-5 items-center justify-center rounded text-[10px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
                                  style={{ backgroundColor: selectedMix.color || MIX_COLORS[selectedMixIndex % MIX_COLORS.length] }}
                                >
                                  {selectedSetupKind === 'layers' ? selectedMixIndex + 1 : ''}
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
                          )}
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
                    })
                  })()}
                </div>
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
                  <Button variant="primary" type="button" disabled={isSaving || !canSubmit} onClick={handleSave}>
                    {isSaving ? t('common.saving') : isEdit ? t('setupForm.saveSetup') : t('setupForm.publishSetup')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
