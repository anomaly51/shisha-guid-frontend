import React from 'react'
import tw from 'twin.macro'
import { useGetSetupsQuery } from '../shared/api'
import { SetupCard } from '../widgets/SetupCard'

export const Feed = () => {
  const { data: setups, isLoading } = useGetSetupsQuery()

  if (isLoading) {
    return <div tw="text-center py-8 text-gray-500">Loading feed...</div>
  }

  return (
    <>
      {setups?.map((setup) => (
        <SetupCard key={setup.id} setup={setup} />
      ))}
      {(!setups || setups.length === 0) && (
        <div tw="text-center py-12 bg-white rounded-md border border-gray-200 text-gray-500">
          No setups found. Create one!
        </div>
      )}
    </>
  )
}
