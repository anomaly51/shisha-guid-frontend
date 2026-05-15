const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const explicitStrength = (tobacco: any) => {
  const value = tobacco?.strength ?? tobacco?.heaviness ?? tobacco?.nicotine_strength ?? tobacco?.nicotine
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? clamp(numeric, 1, 10) : undefined
}

export const getTobaccoStrength = (tobacco: any) => {
  const explicit = explicitStrength(tobacco)
  if (explicit) return explicit

  const text = `${tobacco?.name || ''} ${tobacco?.description || ''}`.toLowerCase()
  let score = 5

  if (text.includes('darkside')) score += 3
  if (text.includes('blackburn') || text.includes('strong') || text.includes('креп')) score += 2
  if (text.includes('musthave') || text.includes('sebero')) score += 1
  if (text.includes('duft') || text.includes('mango') || text.includes('слив') || text.includes('мягк')) score -= 1
  if (text.includes('element') || text.includes('banana') || text.includes('milk') || text.includes('легк')) score -= 2

  return clamp(score, 1, 10)
}

export const getSetupHeaviness = (setup: any, tobaccos: any[] | undefined) => {
  const mix = setup?.tobaccos || []
  const total = mix.reduce((sum: number, item: any) => sum + Number(item.percentage || 0), 0) || 100
  const value = mix.reduce((sum: number, item: any) => {
    const tobacco = tobaccos?.find((entry) => entry.id === item.tobacco_id)
    return sum + getTobaccoStrength(tobacco) * (Number(item.percentage || 0) / total)
  }, 0)

  return clamp(value || 5, 1, 10)
}

export const getHeavinessToneKey = (value: number) => {
  if (value >= 8) return 'heavy'
  if (value >= 6.5) return 'strong'
  if (value >= 4.5) return 'medium'
  return 'light'
}
