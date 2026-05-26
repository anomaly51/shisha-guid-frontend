const cleanupSpaces = (value: string) => (
  value
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;])/g, '$1')
    .replace(/^[,\-–—|/]+/g, '')
    .replace(/[,\-–—|/]+$/g, '')
    .trim()
)

const standaloneWords = (words: string[]) => (
  new RegExp(`(^|[\\s,.:;()\\-–—|/])(?:${words.join('|')})(?=$|[\\s,.:;()\\-–—|/])`, 'giu')
)

export const formatCoalDisplayName = (name: unknown) => {
  if (typeof name !== 'string') return ''

  const withoutPrice = name
    .replace(/\(?\s*(?:₴\s*)?\d+[\d\s]*(?:грн\.?|₴|uah)\s*\)?/gi, ' ')
    .replace(/\(?\s*(?:грн\.?|uah)\s*\d+[\d\s]*\)?/gi, ' ')

  const withoutPackageCount = withoutPrice.replace(
    /\(?\s*\d+\s*(?:шт\.?|штук|куб(?:\.|ик(?:а|ов)?)?|pcs|pieces)\s*\)?/gi,
    ' ',
  )

  const withoutGenericCoalWords = withoutPackageCount
    .replace(standaloneWords(['уголь', 'угли', 'угля']), '$1')
    .replace(standaloneWords(['кальянный', 'кальянные']), '$1')
    .replace(/(^|[\s,.:;()\-–—|/])для\s+кальяна(?=$|[\s,.:;()\-–—|/])/giu, '$1')

  return cleanupSpaces(withoutGenericCoalWords)
}

export const formatCatalogDisplayName = (item: any, itemKind?: string) => (
  itemKind === 'coal' ? formatCoalDisplayName(item?.name) : item?.name
)
