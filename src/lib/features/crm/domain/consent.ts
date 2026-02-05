import { z } from 'zod'

export const consentTypeSchema = z.enum(['marketing_email', 'data_sharing', 'analytics'])
export type ConsentType = z.infer<typeof consentTypeSchema>

export const consentStatusSchema = z.enum(['granted', 'denied', 'withdrawn'])
export type ConsentStatus = z.infer<typeof consentStatusSchema>

export const consentSourceSchema = z.enum(['form', 'import', 'api', 'manual'])
export type ConsentSource = z.infer<typeof consentSourceSchema>

export const consentSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  type: consentTypeSchema,
  status: consentStatusSchema,
  grantedAt: z.date().optional(),
  withdrawnAt: z.date().optional(),
  source: consentSourceSchema.default('manual'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Consent = z.infer<typeof consentSchema>

export type CreateConsent = Omit<Consent, 'id' | 'createdAt' | 'updatedAt'>

export const isConsentActive = (consent: Consent): boolean => consent.status === 'granted'

export const canSendMarketingEmail = (consents: Consent[]): boolean =>
  consents.some((c) => c.type === 'marketing_email' && c.status === 'granted')

export const canShareData = (consents: Consent[]): boolean =>
  consents.some((c) => c.type === 'data_sharing' && c.status === 'granted')

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  marketing_email: 'Marketing Emails',
  data_sharing: 'Data Sharing',
  analytics: 'Analytics'
}
