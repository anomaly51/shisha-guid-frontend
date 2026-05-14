import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../shared/ui/Card'
import { Input, Textarea } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import { useGetProfileQuery } from '../shared/api'

interface FormProps {
  title: string
  initialValues?: { name?: string; description?: string }
  onSubmit: (values: { name: string; description: string | null }) => Promise<any>
  saving?: boolean
  isEdit?: boolean
}

export const ItemForm = ({ title, initialValues, onSubmit, saving, isEdit }: FormProps) => {
  const navigate = useNavigate()
  const { data: profile } = useGetProfileQuery()
  const [name, setName] = useState(initialValues?.name || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [error, setError] = useState('')

  if (!profile) {
    return (
      <div tw="bg-white border border-[#CCC] rounded-[4px] p-6 text-center text-sm text-[#787C7E]">
        You need to log in first.
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null })
      navigate(-1)
    } catch {
      setError('Failed to save.')
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} tw="p-4 flex flex-col gap-4">
        <h2 tw="text-lg font-bold text-[#1A1A1B]">{title}</h2>
        {error && <p tw="text-red-500 text-sm">{error}</p>}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        <div tw="flex gap-2 justify-end">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
