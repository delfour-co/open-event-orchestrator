import { z } from 'zod'

export const userRoleSchema = z.enum([
  'super_admin',
  'org_admin',
  'org_member',
  'speaker',
  'attendee'
])

export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  avatar: z.string().url().optional(),
  role: userRoleSchema,
  verified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type User = z.infer<typeof userSchema>

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    passwordConfirm: z.string()
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm']
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100)
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'New password must be at least 8 characters'),
    passwordConfirm: z.string()
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm']
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Calculates password strength score (0-4)
 * 0 = Very weak, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong
 */
export function calculatePasswordStrength(password: string): {
  score: number
  label: string
  suggestions: string[]
} {
  if (!password) {
    return { score: 0, label: 'Too short', suggestions: ['Enter a password'] }
  }

  let score = 0
  const suggestions: string[] = []

  // Length checks
  if (password.length >= 8) score++
  else suggestions.push('Use at least 8 characters')

  if (password.length >= 12) score++
  else if (password.length >= 8) suggestions.push('Consider using 12+ characters')

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  else suggestions.push('Mix uppercase and lowercase letters')

  if (/\d/.test(password)) score++
  else suggestions.push('Add numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else suggestions.push('Add special characters (!@#$%^&*)')

  // Cap score at 4
  score = Math.min(score, 4)

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']

  return {
    score,
    label: labels[score],
    suggestions: suggestions.slice(0, 2) // Return max 2 suggestions
  }
}
