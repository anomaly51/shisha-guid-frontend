import { ItemForm } from './ItemForm'

interface CreateItemProps {
  title: string
  createHook: () => [any, { isLoading: boolean }]
}

export const CreateItem = ({ title, createHook }: CreateItemProps) => {
  const [create, { isLoading }] = createHook()

  const handleSubmit = async (values: any) => {
    await create(values).unwrap()
  }

  return <ItemForm title={title} onSubmit={handleSubmit} saving={isLoading} />
}
