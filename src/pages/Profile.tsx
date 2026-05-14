import React, { useState } from 'react'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Input } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import { useGetProfileQuery, useUpdateProfileMutation } from '../shared/api'

export const Profile = () => {
  const { data: profile, isLoading } = useGetProfileQuery()
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation()
  const [nickname, setNickname] = useState('')
  const [editing, setEditing] = useState(false)
  const [done, setDone] = useState(false)

  if (isLoading) {
    return <div tw="text-center py-8 text-[#787C7E] text-sm">Loading...</div>
  }

  if (!profile) {
    return (
      <div tw="bg-white border border-[#CCC] rounded-[4px] p-6 text-center text-sm text-[#787C7E]">
        You need to log in first.
      </div>
    )
  }

  const handleSave = async () => {
    await updateProfile({ nickname: nickname.trim() })
    setDone(true)
    setEditing(false)
  }

  return (
    <div tw="flex flex-col gap-3">
      <h1 tw="text-xl font-bold text-[#1A1A1B]">Profile</h1>
      <Card>
        <div tw="p-4 flex flex-col gap-4">
          <div tw="flex items-center gap-3">
            <div tw="w-12 h-12 bg-[#FF4500] rounded-full flex items-center justify-center text-white text-xl font-bold">
              {(profile.nickname || profile.email)[0].toUpperCase()}
            </div>
            <div>
              <h2 tw="font-semibold text-[#1A1A1B]">{profile.nickname || 'Unnamed'}</h2>
              <p tw="text-sm text-[#787C7E]">{profile.email}</p>
            </div>
          </div>
          {editing ? (
            <div tw="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                label="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={profile.nickname || 'Enter nickname'}
              />
              <div tw="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !nickname.trim()}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNickname(profile.nickname || '')
                  setEditing(true)
                  setDone(false)
                }}
              >
                Edit Nickname
              </Button>
            </div>
          )}
          {done && <p tw="text-sm text-green-600">Nickname updated.</p>}
        </div>
      </Card>
    </div>
  )
}
