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

export const getReviewAverage = (reviews: Pick<SetupReview, 'rating'>[]) => {
  if (!reviews.length) return 0
  return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
}
