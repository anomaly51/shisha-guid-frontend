export const getSetupAggregateRating = (setup: any) => {
  const value = setup?.average_rating ?? setup?.rating_average ?? setup?.reviews_average ?? setup?.rating
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
}

export const normalizeSetupsList = (setupsPage: any): any[] => {
  if (!setupsPage) return []
  return Array.isArray(setupsPage) ? setupsPage : setupsPage.items || []
}

export const getTobaccoRatingMap = (setupsPage: any) => {
  const totals = new Map<string, { sum: number; count: number }>()

  normalizeSetupsList(setupsPage).forEach((setup) => {
    const mix = Array.isArray(setup?.tobaccos) ? setup.tobaccos : []
    if (mix.length !== 1) return

    const tobaccoId = mix[0]?.tobacco_id
    const rating = getSetupAggregateRating(setup)
    if (!tobaccoId || rating === undefined) return

    const current = totals.get(tobaccoId) || { sum: 0, count: 0 }
    totals.set(tobaccoId, { sum: current.sum + rating, count: current.count + 1 })
  })

  return new Map(
    Array.from(totals.entries()).map(([tobaccoId, total]) => [
      tobaccoId,
      Number((total.sum / total.count).toFixed(1)),
    ]),
  )
}
