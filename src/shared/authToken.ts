const authTokenStorageKey = 'token'
const profileCacheStorageKey = 'shisha-guid-profile'

const getStorage = () => (typeof window !== 'undefined' ? window.localStorage : null)

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
  }
}

export const hasAuthToken = () => Boolean(getAuthToken())

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
  }
}
