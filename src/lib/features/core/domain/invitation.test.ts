import { describe, expect, it } from 'vitest'
import { csvInvitationRowSchema, generateInvitationToken, parseInvitationCsv } from './invitation'

describe('Invitation Domain', () => {
  describe('generateInvitationToken', () => {
    it('should return a 48-character string', () => {
      const token = generateInvitationToken()

      expect(token).toHaveLength(48)
    })

    it('should contain only alphanumeric characters', () => {
      const token = generateInvitationToken()

      expect(token).toMatch(/^[A-Za-z0-9]{48}$/)
    })

    it('should generate unique tokens on each call', () => {
      const token1 = generateInvitationToken()
      const token2 = generateInvitationToken()

      expect(token1).not.toBe(token2)
    })
  })

  describe('csvInvitationRowSchema', () => {
    it('should accept valid email and role', () => {
      const result = csvInvitationRowSchema.safeParse({
        email: 'user@example.com',
        role: 'admin'
      })

      expect(result.success).toBe(true)
    })

    it('should accept all valid roles', () => {
      for (const role of ['admin', 'organizer', 'reviewer']) {
        const result = csvInvitationRowSchema.safeParse({
          email: 'user@example.com',
          role
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid email', () => {
      const result = csvInvitationRowSchema.safeParse({
        email: 'not-an-email',
        role: 'admin'
      })

      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const result = csvInvitationRowSchema.safeParse({
        email: 'user@example.com',
        role: 'speaker'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Role must be admin, organizer, or reviewer')
      }
    })

    it('should reject missing fields', () => {
      expect(csvInvitationRowSchema.safeParse({}).success).toBe(false)
      expect(csvInvitationRowSchema.safeParse({ email: 'a@b.com' }).success).toBe(false)
    })
  })

  describe('parseInvitationCsv', () => {
    it('should parse valid CSV rows', () => {
      const csv = 'alice@example.com,admin\nbob@example.com,reviewer'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(2)
      expect(rows[0]).toEqual({ email: 'alice@example.com', role: 'admin' })
      expect(rows[1]).toEqual({ email: 'bob@example.com', role: 'reviewer' })
      expect(errors).toHaveLength(0)
    })

    it('should skip header line starting with email', () => {
      const csv = 'email,role\nalice@example.com,organizer'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0]).toEqual({ email: 'alice@example.com', role: 'organizer' })
      expect(errors).toHaveLength(0)
    })

    it('should skip quoted header line', () => {
      const csv = '"email","role"\nalice@example.com,admin'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(1)
      expect(errors).toHaveLength(0)
    })

    it('should handle quoted values', () => {
      const csv = '"alice@example.com","admin"'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0]).toEqual({ email: 'alice@example.com', role: 'admin' })
      expect(errors).toHaveLength(0)
    })

    it('should return errors for lines with missing fields', () => {
      const csv = 'alice@example.com'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('email,role')
    })

    it('should return errors for invalid email', () => {
      const csv = 'not-an-email,admin'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
      expect(errors[0].line).toBe(1)
    })

    it('should return errors for invalid role', () => {
      const csv = 'user@example.com,superuser'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(0)
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('Role must be admin, organizer, or reviewer')
    })

    it('should handle mixed valid and invalid rows', () => {
      const csv = 'alice@example.com,admin\nbad-email,reviewer\nbob@example.com,organizer'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(2)
      expect(errors).toHaveLength(1)
      expect(errors[0].line).toBe(2)
    })

    it('should trim whitespace from values', () => {
      const csv = '  alice@example.com , admin  '
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0]).toEqual({ email: 'alice@example.com', role: 'admin' })
      expect(errors).toHaveLength(0)
    })

    it('should skip empty lines', () => {
      const csv = 'alice@example.com,admin\n\n\nbob@example.com,reviewer'
      const { rows, errors } = parseInvitationCsv(csv)

      expect(rows).toHaveLength(2)
      expect(errors).toHaveLength(0)
    })
  })
})
