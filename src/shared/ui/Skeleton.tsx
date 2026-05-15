import tw from 'twin.macro'

const Pulse = tw.div`bg-[rgb(var(--color-surface-subtle))] animate-pulse rounded-lg`

export const Skeleton = ({ w, h }: { w?: string; h?: string }) => (
  <Pulse style={{ width: w || '100%', height: h || '16px' }} />
)

export const CardSkeleton = () => (
  <div tw="bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border-muted))] shadow-sm overflow-hidden">
    <div tw="aspect-square">
      <Pulse style={{ width: '100%', height: '100%', borderRadius: 0 }} />
    </div>
    <div tw="p-3.5">
      <Skeleton w="70%" h="16px" />
    </div>
  </div>
)
