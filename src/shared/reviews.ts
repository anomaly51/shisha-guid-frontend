import type { UserBadge } from './api'

export interface SetupReviewAuthor {
  id: string
  email: string
  nickname: string
  avatar_url?: string | null
  role?: string
  badges?: UserBadge[]
}

export interface SetupReview {
  id: string
  bowl_setup_id?: string
  creator_id: string
  creator: SetupReviewAuthor
  rating: number
  description: string
  created_at: string
}

export const REVIEW_RATING_MIN = 1
export const REVIEW_RATING_MAX = 10
export const REVIEW_RATING_STEP = 0.5

export const normalizeReviewRating = (value: number) => {
  const numeric = Number.isFinite(value) ? value : 8
  const clamped = Math.min(REVIEW_RATING_MAX, Math.max(REVIEW_RATING_MIN, numeric))
  return Math.round(clamped / REVIEW_RATING_STEP) * REVIEW_RATING_STEP
}

export const getReviewAverage = (reviews: Pick<SetupReview, 'rating'>[]) => {
  if (!reviews.length) return 0
  const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
  return Number(average.toFixed(1))
}
