import { z } from 'zod'

export const totpSecretSchema = z.object({
  id: z.string(),
  userId: z.string(),
  secret: z.string(),
  enabled: z.boolean(),
  backupCodes: z.array(z.string()).optional(),
  enabledAt: z.date().optional()
})

export type TotpSecret = z.infer<typeof totpSecretSchema>

export const verifyTotpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits')
})

export type VerifyTotpInput = z.infer<typeof verifyTotpSchema>

export const TOTP_ISSUER = 'Open Event Orchestrator'
export const BACKUP_CODE_COUNT = 10
export const TRUSTED_DEVICE_DAYS = 30
