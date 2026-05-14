import React from 'react'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'

interface SetupCardProps {
  setup: any
}

export const SetupCard = ({ setup }: SetupCardProps) => {
  return (
    <Card>
      <div tw="flex">
        <div tw="w-10 bg-gray-50 flex flex-col items-center pt-2 gap-1 border-r border-gray-100 shrink-0">
          <button tw="text-gray-400 hover:text-blue-500 font-bold">▲</button>
          <span tw="text-xs font-bold text-gray-800">0</span>
          <button tw="text-gray-400 hover:text-red-500 font-bold">▼</button>
        </div>
        <div tw="p-3 flex-1 flex flex-col gap-2">
          <div tw="flex items-center gap-2 text-xs text-gray-500">
            <span tw="font-bold text-gray-800">Posted by anomaly51</span>
            <span>•</span>
            <span>{new Date(setup.created_at).toLocaleDateString()}</span>
          </div>
          <h3 tw="text-lg font-medium text-gray-900">{setup.name}</h3>
          {setup.description && (
            <p tw="text-sm text-gray-600 line-clamp-3">{setup.description}</p>
          )}
          {setup.photo_urls && setup.photo_urls.length > 0 && (
            <div tw="mt-2 rounded-md overflow-hidden bg-black max-h-[400px] flex items-center justify-center">
              <img src={setup.photo_urls[0]} alt={setup.name} tw="object-contain max-h-[400px]" />
            </div>
          )}
          <div tw="mt-2 flex flex-wrap gap-2">
            {setup.tobaccos?.map((t: any) => (
              <span key={t.id} tw="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full border border-gray-200">
                Tobacco {t.tobacco_id.substring(0, 4)} - {t.percentage}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
