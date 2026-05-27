import 'twin.macro'
import styled from 'styled-components'
import { CatalogIcon } from './Icons'
import type { MixBowlItem } from './mixBowlModel'

type TobaccoPhotoStackVariant = 'feed' | 'detail'

const StackRoot = styled.div<{ $width: number; $height: number; $mobileScale: number }>`
  pointer-events: none;
  position: absolute;
  right: 0.625rem;
  top: 0.625rem;
  z-index: 10;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;

  @media (max-width: 639px) {
    width: ${({ $width, $mobileScale }) => $width * $mobileScale}px;
    height: ${({ $height, $mobileScale }) => $height * $mobileScale}px;
  }
`

const StackInner = styled.div<{ $width: number; $height: number; $mobileScale: number }>`
  position: absolute;
  right: 0;
  top: 0;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  transform-origin: top right;

  @media (max-width: 639px) {
    transform: scale(${({ $mobileScale }) => $mobileScale});
  }
`

const getStackMetrics = (count: number, variant: TobaccoPhotoStackVariant) => {
  if (variant === 'detail') {
    const size = count === 1 ? 124 : count === 2 ? 102 : 86
    const maxWidth = count === 1 ? size : count === 2 ? 188 : 262
    return { size, maxWidth }
  }

  const size = count === 1 ? 78 : count === 2 ? 64 : 56
  const maxWidth = count === 1 ? size : count === 2 ? 118 : 168
  return { size, maxWidth }
}

export const TobaccoPhotoStack = ({
  items,
  variant = 'feed',
}: {
  items: MixBowlItem[]
  variant?: TobaccoPhotoStackVariant
}) => {
  if (!items.length) return null

  const maxVisible = variant === 'detail' ? 4 : 3
  const visibleItems = items.slice(0, maxVisible)
  const hiddenCount = Math.max(0, items.length - visibleItems.length)
  const { size, maxWidth } = getStackMetrics(visibleItems.length, variant)
  const naturalStep = size * 0.72
  const width = visibleItems.length <= 1
    ? size
    : Math.min(maxWidth, size + naturalStep * (visibleItems.length - 1))
  const step = visibleItems.length <= 1 ? 0 : (width - size) / (visibleItems.length - 1)
  const height = size + 4
  const mobileScale = variant === 'detail' ? 0.64 : 1

  return (
    <StackRoot $width={width} $height={height} $mobileScale={mobileScale}>
      <StackInner $width={width} $height={height} $mobileScale={mobileScale}>
        {visibleItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            tw="absolute overflow-hidden bg-[rgb(var(--color-surface))] shadow-[0_12px_26px_-16px_rgba(0,0,0,0.7)]"
            style={{
              height: size,
              left: index * step,
              top: index % 2 && visibleItems.length > 3 ? 4 : 0,
              width: size,
              zIndex: index + 1,
            }}
          >
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.name}
                loading={variant === 'detail' && index === 0 ? 'eager' : 'lazy'}
                decoding={variant === 'detail' && index === 0 ? 'sync' : 'async'}
                fetchPriority={variant === 'detail' && index === 0 ? 'high' : 'auto'}
                tw="h-full w-full object-cover"
              />
            ) : (
              <div tw="flex h-full w-full items-center justify-center" style={{ backgroundColor: item.color }}>
                <CatalogIcon name="tobacco" size={Math.max(18, size - 14)} tw="text-white/90" />
              </div>
            )}
            {hiddenCount > 0 && index === visibleItems.length - 1 && (
              <div tw="absolute inset-0 flex items-center justify-center bg-[rgba(23,19,18,0.62)] text-[13px] font-black text-white tabular-nums">
                +{hiddenCount}
              </div>
            )}
          </div>
        ))}
      </StackInner>
    </StackRoot>
  )
}
