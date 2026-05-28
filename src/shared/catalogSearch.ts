export interface SearchableCatalogItem {
  id?: string
  name?: string | null
  description?: string | null
  brand?: string | null
  manufacturer?: string | null
  strength?: string | null
}

interface BrandOption {
  value: string
  label: string
  count: number
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ґ: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  є: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  і: 'i',
  ї: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

const RU_TO_EN_KEYBOARD: Record<string, string> = {
  й: 'q',
  ц: 'w',
  у: 'e',
  к: 'r',
  е: 't',
  н: 'y',
  г: 'u',
  ш: 'i',
  щ: 'o',
  з: 'p',
  х: '[',
  ъ: ']',
  ф: 'a',
  ы: 's',
  в: 'd',
  а: 'f',
  п: 'g',
  р: 'h',
  о: 'j',
  л: 'k',
  д: 'l',
  ж: ';',
  э: "'",
  я: 'z',
  ч: 'x',
  с: 'c',
  м: 'v',
  и: 'b',
  т: 'n',
  ь: 'm',
  б: ',',
  ю: '.',
  ё: '`',
}

const EN_TO_RU_KEYBOARD = Object.entries(RU_TO_EN_KEYBOARD).reduce<Record<string, string>>((result, [ru, en]) => {
  result[en] = ru
  return result
}, {})

const normalizeSearchText = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[ʼ’`]/g, "'")
  .replace(/[^a-z0-9а-яёіїєґ' -]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const compact = (value: string) => normalizeSearchText(value).replace(/\s+/g, '')

const transliterateCyrillic = (value: string) => (
  Array.from(value.toLowerCase()).map((char) => CYRILLIC_TO_LATIN[char] ?? char).join('')
)

const switchKeyboardLayout = (value: string, dictionary: Record<string, string>) => (
  Array.from(value.toLowerCase()).map((char) => dictionary[char] ?? char).join('')
)

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)))

let synonymGroups: string[][] = []

const buildSynonymGroups = (groups: string[][]) => groups.map((group) => unique(group.flatMap((value) => {
  const normalized = normalizeSearchText(value)
  return [
    normalized,
    compact(normalized),
    normalizeSearchText(transliterateCyrillic(normalized)),
    compact(transliterateCyrillic(normalized)),
  ]
})))

if (typeof window !== 'undefined') {
  import('./catalogSearchSynonyms.json')
    .then((module) => {
      synonymGroups = buildSynonymGroups(module.default as string[][])
    })
    .catch(() => {
      synonymGroups = []
    })
}

const makeVariants = (value: string) => {
  const normalized = normalizeSearchText(value)
  if (!normalized) return []

  const transliterated = normalizeSearchText(transliterateCyrillic(normalized))
  const ruKeyboard = normalizeSearchText(switchKeyboardLayout(normalized, RU_TO_EN_KEYBOARD))
  const enKeyboard = normalizeSearchText(switchKeyboardLayout(normalized, EN_TO_RU_KEYBOARD))

  return unique([
    normalized,
    compact(normalized),
    transliterated,
    compact(transliterated),
    ruKeyboard,
    compact(ruKeyboard),
    enKeyboard,
    compact(enKeyboard),
  ])
}

const expandSearchToken = (token: string) => {
  const variants = makeVariants(token)
  const expanded = [...variants]

  synonymGroups.forEach((group) => {
    if (group.some((synonym) => variants.some((variant) => synonym.includes(variant) || variant.includes(synonym)))) {
      expanded.push(...group)
    }
  })

  return unique(expanded)
}

const expandCatalogText = (value: string) => {
  const variants = makeVariants(value)
  const tokenVariants = normalizeSearchText(value)
    .split(' ')
    .flatMap((token) => expandSearchToken(token))

  return unique([...variants, ...tokenVariants]).join(' ')
}

export const getCatalogBrand = (item: SearchableCatalogItem | undefined) => {
  const explicitBrand = normalizeDisplayValue(item?.brand || item?.manufacturer || '')
  if (explicitBrand) return explicitBrand

  const name = normalizeDisplayValue(item?.name || '').split('(')[0].trim()
  if (!name) return ''

  const beforeCollaboration = name.split(/\s+x\s+/i)[0].trim()
  const words = beforeCollaboration.split(/\s+/).filter(Boolean)
  if (!words.length) return ''

  const first = words[0].toLowerCase()
  if (first === 'dead' && words[1]?.toLowerCase() === 'horse') return `${words[0]} ${words[1]}`
  if (first === 'black' && words[1]?.toLowerCase() === 'burn') return `${words[0]} ${words[1]}`
  if (first === 'daily' && words[1]?.toLowerCase() === 'hookah') return `${words[0]} ${words[1]}`
  if (first === 'dark' && words[1]?.toLowerCase() === 'side') return `${words[0]} ${words[1]}`

  return words[0]
}

export const getBrandOptions = (items: SearchableCatalogItem[] | undefined): BrandOption[] => {
  const counts = new Map<string, number>()
  ;(items || []).forEach((item) => {
    const brand = getCatalogBrand(item)
    if (!brand) return
    counts.set(brand, (counts.get(brand) || 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
}

export const matchesCatalogSearch = (item: SearchableCatalogItem, search: string) => {
  const tokens = normalizeSearchText(search).split(' ').filter(Boolean)
  if (!tokens.length) return true

  const brand = getCatalogBrand(item)
  const itemText = [
    brand,
    item.name,
    item.description,
    item.strength,
  ].filter(Boolean).join(' ')
  const haystack = expandCatalogText(itemText)

  return tokens.every((token) => expandSearchToken(token).some((variant) => haystack.includes(variant)))
}

export const filterCatalogItems = <T extends SearchableCatalogItem>(
  items: T[] | undefined,
  search: string,
  brand: string,
) => (items || []).filter((item) => {
  if (brand && getCatalogBrand(item) !== brand) return false
  return matchesCatalogSearch(item, search)
})

function normalizeDisplayValue(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}
