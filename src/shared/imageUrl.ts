const blockedImageHosts = new Set(['tabakevich.io', 'www.tabakevich.io'])

export const getSafeImageUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const url = new URL(value, 'http://localhost')
    return blockedImageHosts.has(url.hostname.toLowerCase()) ? null : value
  } catch {
    return null
  }
}
