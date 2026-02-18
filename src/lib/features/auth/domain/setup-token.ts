import { z } from 'zod'

export const setupTokenSchema = z.object({
  id: z.string(),
  token: z.string().min(32).max(64),
  expiresAt: z.date(),
  used: z.boolean(),
  usedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SetupToken = z.infer<typeof setupTokenSchema>

export const initialSetupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirm: z.string()
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm']
  })

export type InitialSetupInput = z.infer<typeof initialSetupSchema>

const TOKEN_EXPIRATION_HOURS = 24
const TOKEN_LENGTH = 48

/**
 * Generate a cryptographically secure random token
 */
export function generateSetupToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Calculate token expiration date (24 hours from now)
 */
export function calculateTokenExpiration(): Date {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRATION_HOURS)
  return expiresAt
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Check if a token is valid (not used and not expired)
 */
export function isTokenValid(token: SetupToken): boolean {
  return !token.used && !isTokenExpired(token.expiresAt)
}

/**
 * Generate a slug from an organization name
 */
export function generateOrganizationSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}
