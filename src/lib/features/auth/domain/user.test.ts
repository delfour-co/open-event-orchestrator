import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, userRoleSchema } from './user'

describe('Auth schemas', () => {
  describe('userRoleSchema', () => {
    it('should accept valid roles', () => {
      expect(userRoleSchema.safeParse('super_admin').success).toBe(true)
      expect(userRoleSchema.safeParse('org_admin').success).toBe(true)
      expect(userRoleSchema.safeParse('org_member').success).toBe(true)
      expect(userRoleSchema.safeParse('speaker').success).toBe(true)
      expect(userRoleSchema.safeParse('attendee').success).toBe(true)
    })

    it('should reject invalid roles', () => {
      expect(userRoleSchema.safeParse('admin').success).toBe(false)
      expect(userRoleSchema.safeParse('').success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123'
      })
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '123'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        passwordConfirm: 'different'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('passwordConfirm')
      }
    })

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'john@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'invalid',
        password: 'password123',
        passwordConfirm: 'password123'
      })
      expect(result.success).toBe(false)
    })
  })
})
