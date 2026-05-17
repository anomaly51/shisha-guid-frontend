const authTokenStorageKey = 'token'
const profileCacheStorageKey = 'shisha-guid-profile'
const authSessionChangedEvent = 'shisha-guid-auth-session-changed'

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null)

const emitAuthSessionChanged = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(authSessionChangedEvent))
}

export const getAuthToken = () => {
  try {
    return getStorage()?.getItem(authTokenStorageKey) || null
  } catch {
    return null
  }
}

export const setAuthToken = (token: string) => {
  try {
    getStorage()?.setItem(authTokenStorageKey, token)
  } catch {
    // Ignore unavailable storage: the API request will simply behave as anonymous.
  } finally {
    emitAuthSessionChanged()
  }
}

export const hasAuthToken = () => Boolean(getAuthToken())

export const subscribeAuthSession = (listener: () => void) => {
  if (typeof window === 'undefined') return () => undefined

  const handleAuthSessionChanged = () => listener()
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === authTokenStorageKey || event.key === profileCacheStorageKey) {
      listener()
    }
  }

  window.addEventListener(authSessionChangedEvent, handleAuthSessionChanged)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(authSessionChangedEvent, handleAuthSessionChanged)
    window.removeEventListener('storage', handleStorage)
  }
}

export const getCachedProfile = <T = unknown>() => {
  try {
    const rawProfile = getStorage()?.getItem(profileCacheStorageKey)
    return rawProfile ? (JSON.parse(rawProfile) as T) : null
  } catch {
    return null
  }
}

export const setCachedProfile = (profile: unknown) => {
  try {
    getStorage()?.setItem(profileCacheStorageKey, JSON.stringify(profile))
  } catch {
    // Cache is an optimization only; failed writes should not block auth.
  }
}

export const clearCachedProfile = () => {
  try {
    getStorage()?.removeItem(profileCacheStorageKey)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export const clearAuthSession = () => {
  try {
    const storage = getStorage()
    storage?.removeItem(authTokenStorageKey)
    storage?.removeItem(profileCacheStorageKey)
  } catch {
    // Nothing to clear when storage is unavailable.
  } finally {
    emitAuthSessionChanged()
  }
}
