export interface SetupCostMixItem {
  tobacco_id?: string
  percentage?: number
}

const positiveNumberOrNull = (value: unknown) => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
)

const nonNegativeNumberOrNull = (value: unknown) => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
)

export const formatMoney = (value: unknown, currency?: string) => (
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ${currency === 'UAH' || !currency ? 'грн' : currency}`
    : null
)

export const calculateSetupCost = ({
  bowl,
  coal,
  mix,
  placement,
  tobaccos,
}: {
  bowl?: any
  coal?: any
  mix?: SetupCostMixItem[]
  placement?: any
  tobaccos?: any[]
}) => {
  const capacityGrams = positiveNumberOrNull(bowl?.capacity_grams)
  const totalPercent = (mix || []).reduce((sum, item) => sum + Number(item.percentage || 0), 0) || 100
  let tobaccoCost = 0
  let tobaccoGrams = 0
  const tobaccoLines = (mix || []).map((item) => {
    const tobacco = (item as any).tobacco || tobaccos?.find((entry) => entry.id === item.tobacco_id)
    const percentage = Number(item.percentage || 0)
    const grams = capacityGrams ? capacityGrams * percentage / totalPercent : null
    const packageGrams = positiveNumberOrNull(tobacco?.package_grams)
    const price = nonNegativeNumberOrNull(tobacco?.price)
    const cost = grams && packageGrams && price !== null ? grams * (price / packageGrams) : null

    if (grams) tobaccoGrams += grams
    if (cost) tobaccoCost += cost

    return {
      cost,
      grams,
      name: tobacco?.name || '',
      percentage,
      tobacco,
    }
  })

  const coalCount = positiveNumberOrNull(placement?.coal_count)
  const coalsPerPackage = positiveNumberOrNull(coal?.coals_per_package)
  const coalPrice = nonNegativeNumberOrNull(coal?.price)
  const coalCost = coalCount && coalsPerPackage && coalPrice !== null
    ? coalCount * (coalPrice / coalsPerPackage)
    : null

  return {
    coalCost,
    coalCount,
    currency: bowl?.price_currency || coal?.price_currency || tobaccos?.find((item) => item?.price_currency)?.price_currency || 'UAH',
    isComplete: Boolean(capacityGrams && tobaccoLines.every((line) => line.cost !== null) && coalCost !== null),
    tobaccoCost: tobaccoLines.every((line) => line.cost !== null) ? tobaccoCost : null,
    tobaccoGrams: capacityGrams ? tobaccoGrams : null,
    tobaccoLines,
    total: tobaccoLines.every((line) => line.cost !== null) && coalCost !== null ? tobaccoCost + coalCost : null,
  }
}
