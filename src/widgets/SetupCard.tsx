import 'twin.macro'
import { Card } from '../shared/ui/Card'

interface SetupCardProps {
  setup: any
}

export const SetupCard = ({ setup }: SetupCardProps) => (
  <Card variant="hover">
    <div tw="flex flex-col">
      {setup.photo_urls?.length > 0 ? (
        <div tw="aspect-square bg-[rgb(var(--color-surface-muted))] overflow-hidden">
          <img src={setup.photo_urls[0]} alt={setup.name} tw="object-cover w-full h-full" />
        </div>
      ) : (
        <div tw="aspect-square bg-[rgb(var(--color-surface-muted))]" />
      )}
      <div tw="px-3.5 py-3">
        <h3 tw="text-[13px] sm:text-sm font-semibold text-[rgb(var(--color-text))] leading-snug line-clamp-2">{setup.name}</h3>
      </div>
    </div>
  </Card>
)
