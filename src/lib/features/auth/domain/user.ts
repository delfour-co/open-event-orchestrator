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
