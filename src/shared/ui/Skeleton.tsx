import React from 'react'
import tw from 'twin.macro'

const SkeletonBlock = tw.div`bg-[#EDEFF1] animate-pulse rounded-[4px]`

export const Skeleton = ({ w, h }: { w?: string; h?: string }) => (
  <SkeletonBlock style={{ width: w || '100%', height: h || '20px' }} />
)

export const CardSkeleton = () => (
  <div tw="bg-white border border-[#CCC] rounded-[4px] flex">
    <div tw="w-10 shrink-0 py-2 flex flex-col items-center gap-1 border-r border-[#EDEFF1]">
      <Skeleton w="16px" h="12px" />
      <Skeleton w="20px" h="14px" />
      <Skeleton w="16px" h="12px" />
    </div>
    <div tw="p-3 flex-1 flex flex-col gap-2">
      <Skeleton w="40%" h="12px" />
      <Skeleton w="80%" h="18px" />
      <Skeleton w="100%" h="14px" />
      <Skeleton w="60%" h="14px" />
    </div>
  </div>
)
