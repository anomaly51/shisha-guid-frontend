import { useSyncExternalStore } from 'react'
import { getAuthToken, subscribeAuthSession } from './authToken'

const getAuthSnapshot = () => getAuthToken()
const getServerAuthSnapshot = () => undefined

export const useAuthToken = () => (
  useSyncExternalStore(subscribeAuthSession, getAuthSnapshot, getServerAuthSnapshot)
)

export const useHasAuthToken = () => {
  const token = useAuthToken()

  return token === undefined ? undefined : Boolean(token)
}
