import { z } from 'zod'

export const sponsorTokenSchema = z.object({
  id: z.string(),
  editionSponsorId: z.string(),
  token: z.string().min(1),
  expiresAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  createdAt: z.date()
})

export type SponsorToken = z.infer<typeof sponsorTokenSchema>

export const createSponsorTokenSchema = sponsorTokenSchema.omit({
  id: true,
  createdAt: true,
  lastUsedAt: true
})

export type CreateSponsorToken = z.infer<typeof createSponsorTokenSchema>

export const TOKEN_LENGTH = 32
export const TOKEN_EXPIRY_DAYS = 90

export const isTokenExpired = (token: SponsorToken): boolean => {
  if (!token.expiresAt) {
    return false
  }
  return new Date() > token.expiresAt
}

export const isTokenValid = (token: SponsorToken): boolean => {
  return !isTokenExpired(token)
}

export const getTokenExpiryDate = (daysFromNow: number = TOKEN_EXPIRY_DAYS): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

export const buildPortalUrl = (baseUrl: string, editionSlug: string, token: string): string => {
  return `${baseUrl}/sponsor/${editionSlug}/portal?token=${token}`
}

export const getDaysUntilExpiry = (token: SponsorToken): number | null => {
  if (!token.expiresAt) {
    return null
  }
  const now = new Date()
  const diff = token.expiresAt.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const isTokenExpiringSoon = (token: SponsorToken, thresholdDays = 7): boolean => {
  const daysLeft = getDaysUntilExpiry(token)
  if (daysLeft === null) {
    return false
  }
  return daysLeft > 0 && daysLeft <= thresholdDays
}
