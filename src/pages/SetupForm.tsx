import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { Card } from '../shared/ui/Card'
import { Input, Textarea, Select } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import {
  useGetBowlsQuery, useGetTobaccosQuery, useGetCoalsQuery, useGetKaloudsQuery,
  useGetCoalPlacementsQuery, useGetBowlSetupTypesQuery,
  useCreateSetupMutation, useUpdateSetupMutation, useGetProfileQuery,
} from '../shared/api'

const Row = tw.div`flex flex-col sm:flex-row gap-4`
const Field = tw.div`flex-1 flex flex-col gap-1`
const Label = tw.label`text-xs font-bold text-[#1A1A1B] uppercase tracking-wider`

interface TobaccoEntry {
  tobacco_id: string
  percentage: number
}

interface SetupFormProps {
  initialValues?: any
  isEdit?: boolean
}

export const SetupForm = ({ initialValues, isEdit }: SetupFormProps) => {
  const navigate = useNavigate()
  const { data: profile } = useGetProfileQuery()
  const { data: bowls } = useGetBowlsQuery()
  const { data: tobaccos } = useGetTobaccosQuery()
  const { data: coals } = useGetCoalsQuery()
  const { data: kalouds } = useGetKaloudsQuery()
  const { data: placements } = useGetCoalPlacementsQuery()
  const { data: types } = useGetBowlSetupTypesQuery()
  const [createSetup, { isLoading: creating }] = useCreateSetupMutation()
  const [updateSetup, { isLoading: updating }] = useUpdateSetupMutation()

  const [name, setName] = useState(initialValues?.name || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [bowlId, setBowlId] = useState(initialValues?.bowl_id || '')
  const [tobaccoId, setTobaccoId] = useState(initialValues?.tobaccos?.[0]?.tobacco_id || '')
  const [percentage, setPercentage] = useState(initialValues?.tobaccos?.[0]?.percentage || 100)
  const [coalId, setCoalId] = useState(initialValues?.coal_id || '')
  const [kaloudId, setKaloudId] = useState(initialValues?.kaloud_id || '')
  const [placementId, setPlacementId] = useState(initialValues?.coal_placement_id || '')
  const [typeId, setTypeId] = useState(initialValues?.bowl_setup_type_id || '')
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
    if (!name.trim() || !bowlId || !tobaccoId || !coalId || !kaloudId || !placementId || !typeId) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      bowl_id: bowlId,
      kaloud_id: kaloudId,
      coal_id: coalId,
      coal_placement_id: placementId,
      bowl_setup_type_id: typeId,
      tobaccos: [{ tobacco_id: tobaccoId, percentage }],
      photo_urls: [],
    }
    try {
      if (isEdit && initialValues?.id) {
        await updateSetup({ id: initialValues.id, ...body }).unwrap()
      } else {
        await createSetup(body).unwrap()
      }
      navigate('/')
    } catch {
      setError('Failed to save. Please try again.')
    }
  }

  const select = (label: string, value: string, setter: (v: string) => void, options: any[] | undefined, required = true) => (
    <Field>
      <Label>{label}{required && ' *'}</Label>
      <Select value={value} onChange={(e) => setter(e.target.value)}>
        <option value="">Select...</option>
        {options?.map((o: any) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </Select>
    </Field>
  )

  return (
    <Card>
      <form onSubmit={handleSubmit} tw="p-4 flex flex-col gap-4">
        <h2 tw="text-lg font-bold text-[#1A1A1B]">
          {isEdit ? 'Edit Setup' : 'Create Setup'}
        </h2>
        {error && <p tw="text-red-500 text-sm">{error}</p>}

        <Input label="Setup Name *" value={name} onChange={(e) => setName(e.target.value)} required />

        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

        {select('Bowl *', bowlId, setBowlId, bowls)}
        {select('Kaloud *', kaloudId, setKaloudId, kalouds)}
        {select('Coal *', coalId, setCoalId, coals)}
        {select('Coal Placement *', placementId, setPlacementId, placements)}
        {select('Setup Type *', typeId, setTypeId, types)}

        <div tw="border-t border-[#EDEFF1] pt-4">
          <Label tw="mb-2 block">Tobacco Mix *</Label>
          <Row>
            <Field>
              <Label>Tobacco</Label>
              <Select value={tobaccoId} onChange={(e) => setTobaccoId(e.target.value)}>
                <option value="">Select...</option>
                {tobaccos?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Percentage (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
              />
            </Field>
          </Row>
        </div>

        <div tw="flex gap-2 justify-end pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={creating || updating}>
            {creating || updating ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
