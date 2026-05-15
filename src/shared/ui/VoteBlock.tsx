import tw from 'twin.macro'
import { useTranslation } from 'react-i18next'
import { VoteDownIcon, VoteUpIcon } from './Icons'

const VoteWrapper = tw.div`flex items-center gap-1.5`
const VoteBtn = tw.button`w-7 h-7 flex items-center justify-center rounded-lg text-[rgb(var(--color-text-subtle))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-muted))] transition-colors`
const VoteCount = tw.span`text-xs font-semibold text-[rgb(var(--color-text))] tabular-nums min-w-[20px] text-center`

interface VoteBlockProps {
  upvotes?: number
  downvotes?: number
}

export const VoteBlock = ({ upvotes = 0, downvotes = 0 }: VoteBlockProps) => {
  const { t } = useTranslation()

  return (
    <VoteWrapper>
      <VoteBtn aria-label={t('votes.upvote')}>
        <VoteUpIcon />
      </VoteBtn>
      <VoteCount>{upvotes - downvotes}</VoteCount>
      <VoteBtn aria-label={t('votes.downvote')}>
        <VoteDownIcon />
      </VoteBtn>
    </VoteWrapper>
  )
}
