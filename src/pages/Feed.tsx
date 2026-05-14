import React from 'react'
import tw from 'twin.macro'
import { useGetSetupsQuery } from '../shared/api'
import { SetupCard } from '../widgets/SetupCard'
import { CardSkeleton } from '../shared/ui/Skeleton'

export const Feed = () => {
  const { data: setups, isLoading } = useGetSetupsQuery()

  if (isLoading) {
    return (
      <div tw="flex flex-col gap-3">
        {[1, 2, 3].map((n) => <CardSkeleton key={n} />)}
      </div>
    )
  }

  if (!setups?.length) {
    return (
      <div tw="bg-white border border-[#CCC] rounded-[4px] p-8 text-center">
        <h2 tw="text-lg font-semibold text-[#1A1A1B] mb-2">No setups yet</h2>
        <p tw="text-sm text-[#787C7E]">Be the first to create a shisha setup!</p>
      </div>
    )
  }

  return (
    <div tw="flex flex-col gap-3">
      {setups.map((setup) => (
        <SetupCard key={setup.id} setup={setup} />
      ))}
    </div>
  )
}
