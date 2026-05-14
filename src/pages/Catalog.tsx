import React from 'react'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'

interface CatalogProps {
  title: string
  useQuery: any
}

export const Catalog = ({ title, useQuery }: CatalogProps) => {
  const { data, isLoading } = useQuery()

  if (isLoading) {
    return <div tw="text-center py-8 text-gray-500">Loading {title.toLowerCase()}...</div>
  }

  return (
    <div tw="flex flex-col gap-4">
      <div tw="bg-white p-4 rounded-md border border-gray-200">
        <h1 tw="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      <div tw="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data?.map((item: any) => (
          <Card key={item.id}>
            <div tw="p-4 flex flex-col gap-2">
              <h3 tw="font-medium text-gray-900">{item.name}</h3>
              {item.description && <p tw="text-sm text-gray-500 line-clamp-2">{item.description}</p>}
            </div>
          </Card>
        ))}
        {(!data || data.length === 0) && (
          <div tw="col-span-full text-center py-12 bg-white rounded-md border border-gray-200 text-gray-500">
            No items found.
          </div>
        )}
      </div>
    </div>
  )
}
