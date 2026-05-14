import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { Modal } from '../shared/ui/Modal'
import { VoteBlock } from '../shared/ui/VoteBlock'
import { useGetProfileQuery } from '../shared/api'

interface CatalogProps {
  title: string
  listHook: () => any
  deleteHook: () => any
  onCreatePath: string
  onDetailPath: (id: string) => string
  showVote?: boolean
}

export const Catalog = ({
  title, listHook, deleteHook, onCreatePath, onDetailPath, showVote,
}: CatalogProps) => {
  const { data, isLoading } = listHook()
  const [deleteItem] = deleteHook()
  const { data: profile } = useGetProfileQuery()
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (isLoading) {
    return <div tw="text-center py-8 text-[#787C7E] text-sm">Loading...</div>
  }

  return (
    <div tw="flex flex-col gap-3">
      <div tw="flex items-center justify-between">
        <h1 tw="text-xl font-bold text-[#1A1A1B]">{title}</h1>
        {profile && (
          <Button variant="primary" size="sm" onClick={() => navigate(onCreatePath)}>
            + Create
          </Button>
        )}
      </div>

      {!data?.length ? (
        <div tw="bg-white border border-[#CCC] rounded-[4px] p-6 text-center text-sm text-[#787C7E]">
          No items yet.
        </div>
      ) : (
        <div tw="flex flex-col gap-2">
          {data.map((item: any) => (
            <Card key={item.id} variant="hover">
              <div tw="flex">
                {showVote && (
                  <div tw="pt-1 pb-1 bg-[#F6F7F8] flex flex-col items-center gap-0.5 border-r border-[#EDEFF1] shrink-0">
                    <VoteBlock />
                  </div>
                )}
                <div
                  tw="p-3 flex-1 flex items-center justify-between min-w-0 cursor-pointer"
                  onClick={() => navigate(onDetailPath(item.id))}
                >
                  <div tw="flex flex-col gap-1 min-w-0">
                    <h3 tw="font-semibold text-[#1A1A1B]">{item.name}</h3>
                    {item.description && (
                      <p tw="text-sm text-[#787C7E] truncate">{item.description}</p>
                    )}
                    <div tw="flex items-center gap-2 text-xs text-[#787C7E]">
                      <span>u/anonymous</span>
                      <span>·</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {profile && (
                    <div tw="flex gap-1.5 shrink-0 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          navigate(onDetailPath(item.id).replace('/detail', '/edit'))
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          setDeleteId(item.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete item?">
        <div tw="flex flex-col gap-4">
          <p tw="text-sm text-[#787C7E]">This action cannot be undone.</p>
          <div tw="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (deleteId) {
                  await deleteItem(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
