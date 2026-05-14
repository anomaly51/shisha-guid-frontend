import React from 'react'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'
import { VoteBlock } from '../shared/ui/VoteBlock'

interface SetupCardProps {
  setup: any
}

const TobaccoBadge = tw.span`bg-[#F6F7F8] text-[#1A1A1B] text-xs px-2 py-1 rounded-full border border-[#EDEFF1]`

export const SetupCard = ({ setup }: SetupCardProps) => (
  <Card variant="hover">
    <div tw="flex">
      <div tw="pt-1.5 pb-1 bg-[#F6F7F8] flex flex-col items-center gap-0.5 border-r border-[#EDEFF1] shrink-0">
        <VoteBlock />
      </div>
      <div tw="p-3 flex-1 flex flex-col gap-1.5 min-w-0">
        <div tw="flex items-center gap-1.5 text-xs text-[#787C7E]">
          <span tw="font-medium text-[#1A1A1B]">u/anonymous</span>
          <span>·</span>
          <span>{new Date(setup.created_at).toLocaleDateString()}</span>
        </div>
        <h3 tw="text-lg font-semibold text-[#1A1A1B] leading-tight">{setup.name}</h3>
        {setup.description && (
          <p tw="text-sm text-[#1A1A1B] leading-relaxed">{setup.description}</p>
        )}
        {setup.photo_urls?.length > 0 && (
          <div tw="mt-1 rounded-[4px] overflow-hidden bg-[#EDEFF1] flex items-center justify-center">
            <img src={setup.photo_urls[0]} alt={setup.name} tw="object-contain w-full max-h-[400px]" />
          </div>
        )}
        <div tw="mt-1 flex flex-wrap gap-1.5">
          {setup.tobaccos?.map((t: any) => (
            <TobaccoBadge key={t.id}>
              {t.tobacco_id?.substring(0, 8)} — {t.percentage}%
            </TobaccoBadge>
          ))}
        </div>
        <div tw="flex gap-3 mt-1">
          <button tw="text-xs font-bold text-[#787C7E] hover:text-[#1A1A1B] transition-colors">
            Comments
          </button>
          <button tw="text-xs font-bold text-[#787C7E] hover:text-[#1A1A1B] transition-colors">
            Share
          </button>
        </div>
      </div>
    </div>
  </Card>
)
