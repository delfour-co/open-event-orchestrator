import { TOTP } from 'otpauth'
import { describe, expect, it } from 'vitest'
import {
  generateBackupCodes,
  generateDeviceHash,
  generateTotpSecret,
  hashBackupCode,
  verifyBackupCode,
  verifyTotpCode
} from './totp-service'

describe('TOTP Service', () => {
  describe('generateTotpSecret', () => {
    it('should return an object with secret and uri strings', () => {
      const result = generateTotpSecret('user@example.com')

      expect(typeof result.secret).toBe('string')
      expect(typeof result.uri).toBe('string')
      expect(result.secret.length).toBeGreaterThan(0)
    })

    it('should include email in the uri', () => {
      const email = 'alice@example.com'
      const result = generateTotpSecret(email)

      expect(result.uri).toContain(encodeURIComponent(email))
    })

    it('should include the issuer in the uri', () => {
      const result = generateTotpSecret('user@example.com')

      expect(result.uri).toContain('Open%20Event%20Orchestrator')
    })

    it('should generate unique secrets for different calls', () => {
      const result1 = generateTotpSecret('user@example.com')
      const result2 = generateTotpSecret('user@example.com')

      expect(result1.secret).not.toBe(result2.secret)
    })
  })

  describe('verifyTotpCode', () => {
    it('should return true for a correct code', () => {
      const { secret } = generateTotpSecret('user@example.com')

      const totp = new TOTP({
        issuer: 'Open Event Orchestrator',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret
      })
      const validCode = totp.generate()

      expect(verifyTotpCode(secret, validCode)).toBe(true)
    })

    it('should return false for a wrong code', () => {
      const { secret } = generateTotpSecret('user@example.com')

      expect(verifyTotpCode(secret, '000000')).toBe(false)
    })

    it('should return false for an empty code', () => {
      const { secret } = generateTotpSecret('user@example.com')

      expect(verifyTotpCode(secret, '')).toBe(false)
    })
  })

  describe('generateBackupCodes', () => {
    it('should return an array of 10 codes', () => {
      const codes = generateBackupCodes()

      expect(codes).toHaveLength(10)
    })

    it('should generate codes matching XXXX-XXXX format', () => {
      const codes = generateBackupCodes()

      for (const code of codes) {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/)
      }
    })

    it('should generate unique codes within a set', () => {
      const codes = generateBackupCodes()
      const uniqueCodes = new Set(codes)

      expect(uniqueCodes.size).toBe(codes.length)
    })
  })

  describe('hashBackupCode', () => {
    it('should return a hex string', () => {
      const hash = hashBackupCode('ABCD-1234')

      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should be deterministic for the same input', () => {
      const hash1 = hashBackupCode('ABCD-1234')
      const hash2 = hashBackupCode('ABCD-1234')

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashBackupCode('ABCD-1234')
      const hash2 = hashBackupCode('EFGH-5678')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyBackupCode', () => {
    it('should return valid true and correct index for a matching code', () => {
      const codes = generateBackupCodes()
      const hashedCodes = codes.map(hashBackupCode)

      const result = verifyBackupCode(codes[3], hashedCodes)

      expect(result).toEqual({ valid: true, index: 3 })
    })

    it('should return valid false and index -1 for an invalid code', () => {
      const codes = generateBackupCodes()
      const hashedCodes = codes.map(hashBackupCode)

      const result = verifyBackupCode('ZZZZ-ZZZZ', hashedCodes)

      expect(result).toEqual({ valid: false, index: -1 })
    })

    it('should return valid false for an empty hashed codes array', () => {
      const result = verifyBackupCode('ABCD-1234', [])

      expect(result).toEqual({ valid: false, index: -1 })
    })
  })

  describe('generateDeviceHash', () => {
    it('should return a hex string', () => {
      const hash = generateDeviceHash('Mozilla/5.0', '192.168.1.1')

      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should be deterministic for the same input', () => {
      const hash1 = generateDeviceHash('Mozilla/5.0', '192.168.1.1')
      const hash2 = generateDeviceHash('Mozilla/5.0', '192.168.1.1')

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different user agents', () => {
      const hash1 = generateDeviceHash('Mozilla/5.0', '192.168.1.1')
      const hash2 = generateDeviceHash('Chrome/120.0', '192.168.1.1')

      expect(hash1).not.toBe(hash2)
    })

    it('should produce different hashes for different IPs', () => {
      const hash1 = generateDeviceHash('Mozilla/5.0', '192.168.1.1')
      const hash2 = generateDeviceHash('Mozilla/5.0', '10.0.0.1')

      expect(hash1).not.toBe(hash2)
    })
  })
})
