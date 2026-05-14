import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Button } from '../shared/ui/Button'
import { VoteBlock } from '../shared/ui/VoteBlock'

interface DetailProps {
  title: string
  detailHook: (id: string) => any
  listPath: string
  renderExtra?: (item: any) => React.ReactNode
}

export const Detail = ({ title, detailHook, listPath, renderExtra }: DetailProps) => {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading } = detailHook(id!)
  const navigate = useNavigate()

  if (isLoading) {
    return <div tw="text-center py-8 text-[#787C7E] text-sm">Loading...</div>
  }

  if (!item) {
    return (
      <div tw="bg-white border border-[#CCC] rounded-[4px] p-6 text-center text-sm text-[#787C7E]">
        Item not found.
      </div>
    )
  }

  return (
    <div tw="flex flex-col gap-3">
      <Button variant="ghost" size="sm" onClick={() => navigate(listPath)}>
        ← Back to {title}
      </Button>
      <Card>
        <div tw="flex">
          <div tw="pt-2 bg-[#F6F7F8] flex flex-col items-center gap-0.5 border-r border-[#EDEFF1] shrink-0">
            <VoteBlock />
          </div>
          <div tw="p-4 flex-1 flex flex-col gap-3 min-w-0">
            <h1 tw="text-xl font-bold text-[#1A1A1B]">{item.name}</h1>
            {item.description && <p tw="text-sm text-[#1A1A1B] leading-relaxed">{item.description}</p>}
            {item.photo_urls?.length > 0 && (
              <div tw="rounded-[4px] overflow-hidden bg-[#EDEFF1] flex items-center justify-center">
                <img src={item.photo_urls[0]} alt={item.name} tw="object-contain w-full max-h-[500px]" />
              </div>
            )}
            {renderExtra?.(item)}
            <div tw="text-xs text-[#787C7E]">
              Created {new Date(item.created_at).toLocaleDateString()} by u/anonymous
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
