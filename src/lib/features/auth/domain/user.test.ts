import { describe, expect, it } from 'vitest'
import {
  calculatePasswordStrength,
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
  userRoleSchema
} from './user'

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

  describe('updateProfileSchema', () => {
    it('should accept valid profile data', () => {
      const result = updateProfileSchema.safeParse({
        name: 'John Doe'
      })
      expect(result.success).toBe(true)
    })

    it('should reject short name', () => {
      const result = updateProfileSchema.safeParse({
        name: 'J'
      })
      expect(result.success).toBe(false)
    })

    it('should reject name exceeding max length', () => {
      const result = updateProfileSchema.safeParse({
        name: 'A'.repeat(101)
      })
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('should accept valid password change data', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'oldpassword123',
        password: 'newpassword123',
        passwordConfirm: 'newpassword123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty old password', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: '',
        password: 'newpassword123',
        passwordConfirm: 'newpassword123'
      })
      expect(result.success).toBe(false)
    })

    it('should reject short new password', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'oldpassword123',
        password: 'short',
        passwordConfirm: 'short'
      })
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'oldpassword123',
        password: 'newpassword123',
        passwordConfirm: 'different'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('passwordConfirm')
      }
    })
  })

  describe('calculatePasswordStrength', () => {
    it('should return score 0 for empty password', () => {
      const result = calculatePasswordStrength('')
      expect(result.score).toBe(0)
      expect(result.label).toBe('Too short')
    })

    it('should return low score for simple password', () => {
      const result = calculatePasswordStrength('password')
      expect(result.score).toBeLessThanOrEqual(2)
    })

    it('should return medium score for password with mixed case', () => {
      const result = calculatePasswordStrength('Password')
      expect(result.score).toBeGreaterThanOrEqual(1)
    })

    it('should return higher score for password with numbers', () => {
      const result = calculatePasswordStrength('Password1')
      expect(result.score).toBeGreaterThanOrEqual(2)
    })

    it('should return high score for complex password', () => {
      const result = calculatePasswordStrength('Password123!')
      expect(result.score).toBeGreaterThanOrEqual(3)
    })

    it('should return max score for very strong password', () => {
      const result = calculatePasswordStrength('MyV3ryStr0ng!Pass')
      expect(result.score).toBe(4)
      expect(result.label).toBe('Strong')
    })

    it('should provide suggestions for weak passwords', () => {
      const result = calculatePasswordStrength('weak')
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should provide no suggestions for strong passwords', () => {
      const result = calculatePasswordStrength('MyV3ryStr0ng!Pass')
      expect(result.suggestions.length).toBe(0)
    })
  })
})
