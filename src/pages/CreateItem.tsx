import React from 'react'
import { useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { ItemForm } from './ItemForm'

interface CreateItemProps {
  title: string
  createHook: () => [any, { isLoading: boolean }]
}

export const CreateItem = ({ title, createHook }: CreateItemProps) => {
  const [create, { isLoading }] = createHook()
  const navigate = useNavigate()

  const handleSubmit = async (values: any) => {
    await create(values).unwrap()
    navigate(-1)
  }

  return <ItemForm title={title} onSubmit={handleSubmit} saving={isLoading} />
}
