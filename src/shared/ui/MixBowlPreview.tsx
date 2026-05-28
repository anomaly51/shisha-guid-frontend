import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import 'twin.macro'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  BowlPreviewFallback,
  MIX_COLORS,
  useIsomorphicLayoutEffect,
  type BowlModel,
  type MixBowlItem,
  type SetupKind,
} from './mixBowlModel'

const TOBACCO_SURFACE_MAX_Y = 0.765
const TOBACCO_BASE_Y = 0.595
const MAX_CONCURRENT_SNAPSHOTS = 1

type SnapshotTask = {
  cancelIdle?: () => void
  cancelled: boolean
  released: boolean
  reserved: boolean
  start: (release: () => void) => void
}

const requestIdle = (callback: () => void) => {
  if (typeof window === 'undefined') return () => undefined

  if ('requestIdleCallback' in window) {
    const idleWindow = window as Window & {
      cancelIdleCallback: (id: number) => void
      requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number
    }
    const id = idleWindow.requestIdleCallback(callback, { timeout: 900 })
    return () => idleWindow.cancelIdleCallback(id)
  }

  const id = globalThis.setTimeout(callback, 32)
  return () => globalThis.clearTimeout(id)
}

const createSnapshotScheduler = () => {
  let activeSnapshotCount = 0
  const snapshotQueue: SnapshotTask[] = []

  const pumpSnapshotQueue = () => {
    if (activeSnapshotCount >= MAX_CONCURRENT_SNAPSHOTS) return

    const task = snapshotQueue.shift()
    if (!task) return
    if (task.cancelled) {
      pumpSnapshotQueue()
      return
    }

    task.reserved = true
    activeSnapshotCount += 1

    const release = () => {
      if (task.released) return
      task.released = true
      activeSnapshotCount = Math.max(0, activeSnapshotCount - 1)
      pumpSnapshotQueue()
    }

    task.cancelIdle = requestIdle(() => {
      task.cancelIdle = undefined
      if (task.cancelled) {
        release()
        return
      }
      task.start(release)
    })
  }

  return (start: (release: () => void) => void) => {
    const task: SnapshotTask = {
      cancelled: false,
      released: false,
      reserved: false,
      start,
    }

    snapshotQueue.push(task)
    pumpSnapshotQueue()

    return () => {
      task.cancelled = true
      task.cancelIdle?.()
      if (task.reserved && !task.released) {
        task.released = true
        activeSnapshotCount = Math.max(0, activeSnapshotCount - 1)
        pumpSnapshotQueue()
      }
    }
  }
}

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

const useVisibilityGate = (enabled: boolean, rootMargin = '520px') => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(!enabled)

  useEffect(() => {
    if (!enabled) {
      setVisible(true)
      return undefined
    }

    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    if (visible) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setVisible(true)
      observer.disconnect()
    }, { rootMargin })

    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, rootMargin, visible])

  return { ref, visible }
}

const TobaccoColorSurface = ({
  colorAt,
  end = Math.PI * 2,
  inner = 0,
  outer = 1.02,
  resolution = 44,
  seed,
  start = 0,
  y,
}: {
  colorAt: (x: number, z: number, angle: number, radius: number) => string
  end?: number
  inner?: number
  outer?: number
  resolution?: number
  seed: number
  start?: number
  y: number
}) => {
  const geometry = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const indices: number[] = []
    const vertexMap = new Map<string, number>()

    Array.from({ length: resolution + 1 }).forEach((_, xIndex) => {
      Array.from({ length: resolution + 1 }).forEach((__, zIndex) => {
        const key = `${xIndex}:${zIndex}`
        const xBase = -outer + (xIndex / resolution) * outer * 2
        const zBase = -outer + (zIndex / resolution) * outer * 2
        const edge = xIndex === 0 || zIndex === 0 || xIndex === resolution || zIndex === resolution
        const jitterScale = edge ? 0 : outer / resolution * 0.42
        const x = xBase + (pseudoRandom(seed + xIndex * 17 + zIndex * 29) - 0.5) * jitterScale
        const z = zBase + (pseudoRandom(seed + xIndex * 31 + zIndex * 13) - 0.5) * jitterScale
        const radius = Math.sqrt(x * x + z * z)
        const angle = Math.atan2(z, x)

        if (radius < inner || radius > outer || !isAngleBetween(angle, start, end)) return

        const height = Math.max(-0.035, Math.min(0.23, tobaccoHeight(x, z, outer, seed)))
        const finalY = Math.min(TOBACCO_SURFACE_MAX_Y, y + height)
        const tint = new THREE.Color(colorAt(x, z, angle, radius)).offsetHSL(
          (pseudoRandom(seed + xIndex * 13 + zIndex * 7) - 0.5) * 0.028,
          -0.1 + pseudoRandom(seed + xIndex * 11 + zIndex * 5) * 0.24,
          -0.12 + pseudoRandom(seed + xIndex * 17 + zIndex * 3) * 0.36,
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
  }, [colorAt, end, inner, outer, resolution, seed, start, y])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial vertexColors roughness={0.5} metalness={0.01} clearcoat={0.28} clearcoatRoughness={0.42} side={THREE.DoubleSide} />
    </mesh>
  )
}

const SectorTobacco = ({ bowlModel, items, resolution }: { bowlModel: BowlModel; items: MixBowlItem[]; resolution?: number }) => {
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

  return <TobaccoColorSurface colorAt={colorAt} inner={bowlModel === 'phunnel' ? 0.34 : 0.02} outer={1} resolution={resolution} seed={7} y={TOBACCO_BASE_Y} />
}

const LayerTobacco = ({ bowlModel, items, resolution }: { bowlModel: BowlModel; items: MixBowlItem[]; resolution?: number }) => {
  const topColor = items[items.length - 1]?.color || MIX_COLORS[0]
  const topColorAt = useMemo(() => () => topColor, [topColor])

  return <TobaccoColorSurface colorAt={topColorAt} inner={bowlModel === 'phunnel' ? 0.34 : 0.02} outer={1} resolution={resolution} seed={29} y={TOBACCO_BASE_Y + 0.012} />
}

const CompotTobacco = ({ bowlModel, items, resolution }: { bowlModel: BowlModel; items: MixBowlItem[]; resolution?: number }) => {
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

  return <TobaccoColorSurface colorAt={colorAt} inner={bowlModel === 'phunnel' ? 0.34 : 0.02} outer={1} resolution={resolution} seed={43} y={TOBACCO_BASE_Y} />
}

const BowlScene = ({
  autoRotate = true,
  bowlModel,
  interactive = true,
  kind,
  items,
  quality = 'live',
  sceneScale = 0.98,
}: {
  autoRotate?: boolean
  bowlModel: BowlModel
  interactive?: boolean
  kind: SetupKind
  items: MixBowlItem[]
  quality?: 'live' | 'snapshot'
  sceneScale?: number
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const userRotationRef = useRef(0.2)
  const userTiltRef = useRef(0.04)
  const dragRef = useRef({ active: false, x: 0, y: 0, rotation: 0.2, tilt: 0.04 })
  const invalidate = useThree((state) => state.invalidate)
  const isPhunnel = bowlModel === 'phunnel'
  const latheSegments = quality === 'snapshot' ? 72 : 128
  const torusSegments = quality === 'snapshot' ? 64 : 128
  const cylinderSegments = quality === 'snapshot' ? 56 : 96
  const tobaccoResolution = quality === 'snapshot' ? 28 : 44
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
    if (!autoRotate || dragRef.current.active || !groupRef.current) return
    userRotationRef.current += delta * 0.12
    groupRef.current.rotation.y = userRotationRef.current
    groupRef.current.rotation.x = userTiltRef.current
  })

  return (
    <group
      ref={groupRef}
      position={[0, -0.18, 0]}
      rotation={[0.04, 0.2, 0]}
      scale={(() => {
        const scale = isPhunnel ? sceneScale * 0.9 : sceneScale
        return [scale, scale, scale] as [number, number, number]
      })()}
      onClick={(event: any) => {
        if (interactive) event.stopPropagation()
      }}
      onPointerDown={(event: any) => {
        if (!interactive) return
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
        if (!interactive || !dragRef.current.active) return
        event.stopPropagation()
        userRotationRef.current = dragRef.current.rotation + (event.clientX - dragRef.current.x) * 0.012
        const nextTilt = dragRef.current.tilt + (event.clientY - dragRef.current.y) * 0.008
        userTiltRef.current = Math.max(-0.72, Math.min(0.58, nextTilt))
        applyRotation()
      }}
      onPointerUp={(event: any) => {
        if (!interactive) return
        event.stopPropagation()
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
        <latheGeometry args={[bowlProfile, latheSegments]} />
        <meshPhysicalMaterial color="#654A3D" roughness={0.55} metalness={0.03} clearcoat={0.32} clearcoatRoughness={0.5} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0.035, 0]} castShadow>
        <latheGeometry args={[innerProfile, latheSegments]} />
        <meshStandardMaterial color="#413027" roughness={0.74} metalness={0.01} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, isPhunnel ? 0.78 : 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.12, 0.105, 20, torusSegments]} />
        <meshPhysicalMaterial color="#594237" roughness={0.49} metalness={0.04} clearcoat={0.36} clearcoatRoughness={0.48} />
      </mesh>

      {isPhunnel && (
        <>
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.31, 0.39, 0.44, cylinderSegments]} />
            <meshPhysicalMaterial color="#654A3D" roughness={0.55} metalness={0.03} clearcoat={0.32} clearcoatRoughness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.23, 0.065, 16, cylinderSegments]} />
            <meshPhysicalMaterial color="#594237" roughness={0.5} metalness={0.03} clearcoat={0.28} clearcoatRoughness={0.5} />
          </mesh>
          <mesh position={[0, 0.728, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, cylinderSegments]} />
            <meshBasicMaterial color="#0B0705" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      <mesh position={[0, isPhunnel ? -1.84 : -1.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.58, 0.045, 16, cylinderSegments]} />
        <meshPhysicalMaterial color="#563F35" roughness={0.58} clearcoat={0.24} />
      </mesh>

      <mesh position={[0, isPhunnel ? -1.92 : -1.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.68, 0.54, 0.08, cylinderSegments]} />
        <meshStandardMaterial color="#49372E" roughness={0.66} />
      </mesh>

      {items.length ? (
        kind === 'sectors'
          ? <SectorTobacco bowlModel={bowlModel} items={items} resolution={tobaccoResolution} />
          : kind === 'layers'
            ? <LayerTobacco bowlModel={bowlModel} items={items} resolution={tobaccoResolution} />
            : <CompotTobacco bowlModel={bowlModel} items={items} resolution={tobaccoResolution} />
      ) : (
        <mesh position={[0, 0.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {isPhunnel ? <ringGeometry args={[0.36, 0.96, cylinderSegments]} /> : <circleGeometry args={[0.96, cylinderSegments]} />}
          <meshStandardMaterial color="#211916" roughness={0.86} />
        </mesh>
      )}
    </group>
  )
}

export const MixBowlPreview = ({
  autoRotate = true,
  bowlModel = 'traditional',
  cameraPosition = [0, 2.28, 4.7],
  className,
  fov = 41,
  interactive = true,
  kind,
  items,
  renderMode = 'live',
  sceneScale = 0.98,
  style,
  ariaLabel,
}: {
  ariaLabel?: string
  autoRotate?: boolean
  bowlModel?: BowlModel
  cameraPosition?: [number, number, number]
  className?: string
  fov?: number
  interactive?: boolean
  kind: SetupKind
  items: MixBowlItem[]
  renderMode?: 'live' | 'snapshot'
  sceneScale?: number
  style?: CSSProperties
}) => {
  const [mounted, setMounted] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [snapshotRenderAllowed, setSnapshotRenderAllowed] = useState(renderMode === 'live')
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const snapshotReleaseRef = useRef<(() => void) | null>(null)
  const scheduleSnapshotRef = useRef(createSnapshotScheduler())
  const aliveRef = useRef(false)
  const total = items.reduce((sum, item) => sum + item.percentage, 0)
  const isSnapshot = renderMode === 'snapshot'
  const { ref: visibilityRef, visible: isPreviewVisible } = useVisibilityGate(isSnapshot)
  const normalizedItems = useMemo(() => (
    total > 0
      ? items.map((item) => ({ ...item, percentage: item.percentage / total * 100 }))
      : []
  ), [items, total])
  const sceneKey = useMemo(() => JSON.stringify({
    bowlModel,
    cameraPosition,
    fov,
    kind,
    items: normalizedItems.map((item) => [item.id, item.percentage, item.color]),
    renderMode,
    sceneScale,
  }), [bowlModel, cameraPosition, fov, kind, normalizedItems, renderMode, sceneScale])

  useIsomorphicLayoutEffect(() => {
    aliveRef.current = true
    setMounted(true)
    return () => {
      aliveRef.current = false
      snapshotReleaseRef.current?.()
      snapshotReleaseRef.current = null
    }
  }, [])

  useEffect(() => {
    setSceneReady(false)
    setSnapshotUrl(null)
    setSnapshotRenderAllowed(renderMode === 'live')
  }, [sceneKey])

  useEffect(() => {
    if (!mounted || !isSnapshot || !isPreviewVisible || snapshotUrl) return undefined

    let active = true
    const cancel = scheduleSnapshotRef.current((release) => {
      if (!active) {
        release()
        return
      }
      snapshotReleaseRef.current = release
      if (aliveRef.current) setSnapshotRenderAllowed(true)
    })

    return () => {
      active = false
      cancel()
      snapshotReleaseRef.current?.()
      snapshotReleaseRef.current = null
    }
  }, [isPreviewVisible, isSnapshot, mounted, sceneKey, snapshotUrl])

  const releaseSnapshot = () => {
    if (!aliveRef.current) return
    snapshotReleaseRef.current?.()
    snapshotReleaseRef.current = null
  }

  const showCanvas = mounted && (renderMode === 'live' || (!snapshotUrl && isPreviewVisible && snapshotRenderAllowed))

  return (
    <div
      className={className}
      ref={visibilityRef}
      role="img"
      aria-label={ariaLabel || `Bowl preview: ${kind} mix with ${items.length} tobacco${items.length === 1 ? '' : 's'}`}
      style={style}
      tw="relative aspect-square overflow-hidden bg-[rgb(var(--color-surface-muted))]"
      onClick={(event) => {
        if (interactive) event.stopPropagation()
      }}
    >
      <div tw="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.82),transparent_38%),linear-gradient(180deg,rgba(255,248,241,0.72),rgba(229,218,207,0.42))]" />
      <div tw="pointer-events-none absolute bottom-7 left-1/2 h-10 w-2/3 -translate-x-1/2 rounded-full bg-[#4A3830]/20 blur-xl" />
      {snapshotUrl && (
        <img
          src={snapshotUrl}
          alt=""
          tw="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}
      <BowlPreviewFallback hidden={sceneReady} />
      {showCanvas && (
        <Canvas
          camera={{ position: cameraPosition, fov }}
          dpr={[1, 1.5]}
          frameloop={isSnapshot || !autoRotate ? 'demand' : 'always'}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: isSnapshot }}
          onCreated={({ gl, invalidate }) => {
            requestAnimationFrame(() => {
              invalidate()
              requestAnimationFrame(() => {
                if (!aliveRef.current) return
                if (isSnapshot) {
                  setSnapshotUrl(gl.domElement.toDataURL('image/webp', 0.88))
                  releaseSnapshot()
                }
                setSceneReady(true)
              })
            })
          }}
          shadows={isSnapshot ? false : { enabled: true, type: THREE.PCFShadowMap }}
          style={{
            background: 'transparent',
            cursor: interactive ? 'grab' : 'pointer',
            inset: 0,
            pointerEvents: interactive ? 'auto' : 'none',
            position: 'absolute',
            touchAction: interactive ? 'none' : 'auto',
          }}
        >
          <ambientLight intensity={0.86} />
          <hemisphereLight args={['#FFF5E8', '#8B6554', 1.34]} />
          <directionalLight position={[3.5, 5.2, 4.4]} intensity={2.62} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
          <directionalLight position={[-4, 2.4, -3]} intensity={0.78} color="#F1D5BC" />
          <pointLight position={[0, 1.7, 1.8]} intensity={1.15} color="#FFD6A8" distance={5.8} />
          <pointLight position={[0, 0.9, -1.7]} intensity={0.38} color="#EBA268" distance={4.5} />
          <BowlScene autoRotate={autoRotate && !isSnapshot} bowlModel={bowlModel} interactive={interactive} kind={kind} items={normalizedItems} quality={isSnapshot ? 'snapshot' : 'live'} sceneScale={sceneScale} />
        </Canvas>
      )}
    </div>
  )
}
