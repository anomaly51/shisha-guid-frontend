import React from 'react'
import tw, { styled } from 'twin.macro'

const VoteWrapper = tw.div`flex flex-col items-center gap-1 min-w-[40px]`

const VoteBtn = styled.button<{ active?: boolean; direction: 'up' | 'down' }>`
  ${tw`w-7 h-7 flex items-center justify-center rounded-sm text-lg leading-none transition-colors duration-100`}
  &:hover {
    ${({ direction }) => (direction === 'up' ? tw`bg-[#FF4500]/10 text-[#FF4500]` : tw`bg-[#7193FF]/10 text-[#7193FF]`)}
  }
  ${({ active, direction }) =>
    active && (direction === 'up' ? tw`text-[#FF4500]` : tw`text-[#7193FF]`)}
  ${tw`text-[#878A8C]`}
`

const VoteCount = tw.span`text-xs font-bold text-[#1A1A1B]`

interface VoteBlockProps {
  upvotes?: number
  downvotes?: number
}

export const VoteBlock = ({ upvotes = 0, downvotes = 0 }: VoteBlockProps) => (
  <VoteWrapper>
    <VoteBtn direction="up" aria-label="upvote">
      ▲
    </VoteBtn>
    <VoteCount>{upvotes - downvotes}</VoteCount>
    <VoteBtn direction="down" aria-label="downvote">
      ▼
    </VoteBtn>
  </VoteWrapper>
)
