import { createHash, randomBytes } from 'node:crypto'
import { TOTP } from 'otpauth'
import { BACKUP_CODE_COUNT, TOTP_ISSUER } from '../domain/totp'

export function generateTotpSecret(email: string): { secret: string; uri: string } {
  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  })

  return {
    secret: totp.secret.base32,
    uri: totp.toString()
  }
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret
  })

  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const bytes = randomBytes(4)
    const code = bytes.toString('hex').slice(0, 8).toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code.replace('-', '')).digest('hex')
}

export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; index: number } {
  const hashed = hashBackupCode(code)
  const index = hashedCodes.indexOf(hashed)
  return { valid: index !== -1, index }
}

export function generateDeviceHash(userAgent: string, ip: string): string {
  return createHash('sha256').update(`${userAgent}:${ip}`).digest('hex')
}
