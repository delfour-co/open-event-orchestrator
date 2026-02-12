/**
 * Email Preview Domain Entity
 *
 * Defines preview, test sending, and pre-send validation functionality.
 */

import { z } from 'zod'

// Preview device types
export const previewDeviceSchema = z.enum(['desktop', 'tablet', 'mobile'])
export type PreviewDevice = z.infer<typeof previewDeviceSchema>

// Preview theme
export const previewThemeSchema = z.enum(['light', 'dark'])
export type PreviewTheme = z.infer<typeof previewThemeSchema>

// Validation severity
export const validationSeveritySchema = z.enum(['error', 'warning', 'info'])
export type ValidationSeverity = z.infer<typeof validationSeveritySchema>

// Device dimensions
export const deviceDimensionsSchema = z.object({
  width: z.number().int().min(1),
  height: z.number().int().min(1)
})
export type DeviceDimensions = z.infer<typeof deviceDimensionsSchema>

// Preview settings
export const previewSettingsSchema = z.object({
  device: previewDeviceSchema.default('desktop'),
  theme: previewThemeSchema.default('light'),
  customDimensions: deviceDimensionsSchema.optional()
})
export type PreviewSettings = z.infer<typeof previewSettingsSchema>

// Variable resolution status
export const variableStatusSchema = z.object({
  name: z.string(),
  resolved: z.boolean(),
  value: z.string().optional(),
  fallback: z.string().optional()
})
export type VariableStatus = z.infer<typeof variableStatusSchema>

// Preview data
export const emailPreviewDataSchema = z.object({
  subject: z.string(),
  resolvedSubject: z.string(),
  htmlContent: z.string(),
  resolvedHtmlContent: z.string(),
  textContent: z.string().optional(),
  resolvedTextContent: z.string().optional(),
  variables: z.array(variableStatusSchema),
  unresolvedCount: z.number().int().min(0)
})
export type EmailPreviewData = z.infer<typeof emailPreviewDataSchema>

// Validation issue
export const validationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: validationSeveritySchema,
  field: z.string().optional()
})
export type ValidationIssue = z.infer<typeof validationIssueSchema>

// Pre-send validation result
export const preSendValidationSchema = z.object({
  valid: z.boolean(),
  issues: z.array(validationIssueSchema),
  errorCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  deliverabilityScore: z.number().min(0).max(100)
})
export type PreSendValidation = z.infer<typeof preSendValidationSchema>

// Test email request
export const testEmailRequestSchema = z.object({
  campaignId: z.string(),
  templateId: z.string().optional(),
  toAddresses: z.array(z.string().email()).min(1).max(10),
  contactId: z.string().optional(),
  subject: z.string().optional(),
  htmlContent: z.string().optional()
})
export type TestEmailRequest = z.infer<typeof testEmailRequestSchema>

// Test email result
export const testEmailResultSchema = z.object({
  success: z.boolean(),
  sentCount: z.number().int().min(0),
  failedAddresses: z.array(z.string()),
  error: z.string().optional()
})
export type TestEmailResult = z.infer<typeof testEmailResultSchema>

// Send estimate
export const sendEstimateSchema = z.object({
  recipientCount: z.number().int().min(0),
  estimatedDurationMinutes: z.number().min(0),
  sendRate: z.number().int().min(1)
})
export type SendEstimate = z.infer<typeof sendEstimateSchema>

// Campaign summary for confirmation
export const campaignSummarySchema = z.object({
  name: z.string(),
  subject: z.string(),
  fromName: z.string(),
  fromEmail: z.string(),
  recipientCount: z.number().int().min(0),
  segmentName: z.string().optional(),
  scheduledAt: z.date().optional(),
  previewHtml: z.string()
})
export type CampaignSummary = z.infer<typeof campaignSummarySchema>

// Default device dimensions
export const DEFAULT_DEVICE_DIMENSIONS: Record<PreviewDevice, DeviceDimensions> = {
  desktop: { width: 1200, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
}

// Spam trigger words
const SPAM_TRIGGER_WORDS = [
  'free',
  'winner',
  'urgent',
  'act now',
  'limited time',
  'click here',
  'buy now',
  'discount',
  'guarantee',
  'no obligation',
  'risk free',
  'special promotion',
  'congratulations',
  'you have been selected',
  'order now'
]

// Validation codes
export const VALIDATION_CODES = {
  MISSING_SUBJECT: 'missing_subject',
  MISSING_FROM_NAME: 'missing_from_name',
  MISSING_FROM_EMAIL: 'missing_from_email',
  EMPTY_CONTENT: 'empty_content',
  MISSING_UNSUBSCRIBE: 'missing_unsubscribe',
  UNRESOLVED_VARIABLES: 'unresolved_variables',
  EMPTY_SEGMENT: 'empty_segment',
  SPAM_CONTENT: 'spam_content',
  NO_TEXT_VERSION: 'no_text_version',
  LARGE_IMAGES: 'large_images',
  BROKEN_LINKS: 'broken_links'
}

// Validation messages
export const VALIDATION_MESSAGES: Record<string, string> = {
  [VALIDATION_CODES.MISSING_SUBJECT]: 'Email subject is required',
  [VALIDATION_CODES.MISSING_FROM_NAME]: 'Sender name is required',
  [VALIDATION_CODES.MISSING_FROM_EMAIL]: 'Sender email is required',
  [VALIDATION_CODES.EMPTY_CONTENT]: 'Email content cannot be empty',
  [VALIDATION_CODES.MISSING_UNSUBSCRIBE]: 'Unsubscribe link is required for marketing emails',
  [VALIDATION_CODES.UNRESOLVED_VARIABLES]: 'Some template variables are not resolved',
  [VALIDATION_CODES.EMPTY_SEGMENT]: 'Target segment has no recipients',
  [VALIDATION_CODES.SPAM_CONTENT]: 'Content contains words that may trigger spam filters',
  [VALIDATION_CODES.NO_TEXT_VERSION]: 'No plain text version provided',
  [VALIDATION_CODES.LARGE_IMAGES]: 'Images may be too large for email',
  [VALIDATION_CODES.BROKEN_LINKS]: 'Some links may be invalid'
}

/**
 * Extract variables from template content
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match: RegExpExecArray | null = regex.exec(content)

  while (match !== null) {
    const varName = match[1].trim()
    if (!variables.includes(varName)) {
      variables.push(varName)
    }
    match = regex.exec(content)
  }

  return variables
}

/**
 * Resolve variables in content with provided data
 */
export function resolveVariables(
  content: string,
  data: Record<string, string>,
  fallbacks: Record<string, string> = {}
): { resolved: string; statuses: VariableStatus[] } {
  const variables = extractVariables(content)
  const statuses: VariableStatus[] = []
  let resolved = content

  for (const varName of variables) {
    const value = data[varName]
    const fallback = fallbacks[varName]
    const resolvedValue = value ?? fallback

    statuses.push({
      name: varName,
      resolved: !!resolvedValue,
      value: value || undefined,
      fallback: fallback || undefined
    })

    if (resolvedValue) {
      resolved = resolved.replace(new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g'), resolvedValue)
    }
  }

  return { resolved, statuses }
}

/**
 * Build email preview data
 */
export function buildPreviewData(
  subject: string,
  htmlContent: string,
  textContent: string | undefined,
  contactData: Record<string, string>,
  fallbacks: Record<string, string> = {}
): EmailPreviewData {
  const subjectResult = resolveVariables(subject, contactData, fallbacks)
  const htmlResult = resolveVariables(htmlContent, contactData, fallbacks)
  const textResult = textContent ? resolveVariables(textContent, contactData, fallbacks) : null

  const allStatuses = [
    ...subjectResult.statuses,
    ...htmlResult.statuses,
    ...(textResult?.statuses || [])
  ]

  // Deduplicate by variable name
  const uniqueStatuses = allStatuses.filter(
    (status, index, self) => index === self.findIndex((s) => s.name === status.name)
  )

  const unresolvedCount = uniqueStatuses.filter((s) => !s.resolved).length

  return {
    subject,
    resolvedSubject: subjectResult.resolved,
    htmlContent,
    resolvedHtmlContent: htmlResult.resolved,
    textContent,
    resolvedTextContent: textResult?.resolved,
    variables: uniqueStatuses,
    unresolvedCount
  }
}

/**
 * Check for spam trigger words
 */
export function detectSpamTriggers(content: string): string[] {
  const lowerContent = content.toLowerCase()
  return SPAM_TRIGGER_WORDS.filter((word) => lowerContent.includes(word.toLowerCase()))
}

/**
 * Calculate deliverability score (0-100)
 */
export function calculateDeliverabilityScore(
  hasSubject: boolean,
  hasUnsubscribe: boolean,
  hasTextVersion: boolean,
  unresolvedVariables: number,
  spamTriggerCount: number,
  textToImageRatio: number
): number {
  let score = 100

  // Critical factors
  if (!hasSubject) score -= 30
  if (!hasUnsubscribe) score -= 20

  // Important factors
  if (!hasTextVersion) score -= 10
  if (unresolvedVariables > 0) score -= Math.min(20, unresolvedVariables * 5)

  // Spam factors
  if (spamTriggerCount > 0) {
    score -= Math.min(30, spamTriggerCount * 5)
  }

  // Text to image ratio (ideal is > 0.6)
  if (textToImageRatio < 0.3) score -= 15
  else if (textToImageRatio < 0.6) score -= 5

  return Math.max(0, Math.min(100, score))
}

/**
 * Validate campaign before sending
 */
export function validatePreSend(
  subject: string | undefined,
  fromName: string | undefined,
  fromEmail: string | undefined,
  htmlContent: string | undefined,
  textContent: string | undefined,
  recipientCount: number,
  unresolvedVariables: number
): PreSendValidation {
  const issues: ValidationIssue[] = []

  // Critical validations (errors)
  if (!subject?.trim()) {
    issues.push({
      code: VALIDATION_CODES.MISSING_SUBJECT,
      message: VALIDATION_MESSAGES[VALIDATION_CODES.MISSING_SUBJECT],
      severity: 'error',
      field: 'subject'
    })
  }

  if (!fromName?.trim()) {
    issues.push({
      code: VALIDATION_CODES.MISSING_FROM_NAME,
      message: VALIDATION_MESSAGES[VALIDATION_CODES.MISSING_FROM_NAME],
      severity: 'error',
      field: 'fromName'
    })
  }

  if (!fromEmail?.trim()) {
    issues.push({
      code: VALIDATION_CODES.MISSING_FROM_EMAIL,
      message: VALIDATION_MESSAGES[VALIDATION_CODES.MISSING_FROM_EMAIL],
      severity: 'error',
      field: 'fromEmail'
    })
  }

  if (!htmlContent?.trim()) {
    issues.push({
      code: VALIDATION_CODES.EMPTY_CONTENT,
      message: VALIDATION_MESSAGES[VALIDATION_CODES.EMPTY_CONTENT],
      severity: 'error',
      field: 'htmlContent'
    })
  }

  if (recipientCount === 0) {
    issues.push({
      code: VALIDATION_CODES.EMPTY_SEGMENT,
      message: VALIDATION_MESSAGES[VALIDATION_CODES.EMPTY_SEGMENT],
      severity: 'error',
      field: 'segment'
    })
  }

  // Check for unsubscribe link
  const hasUnsubscribe =
    htmlContent?.includes('unsubscribe') || htmlContent?.includes('désabonnement')
  if (!hasUnsubscribe) {
    issues.push({
      code: VALIDATION_CODES.MISSING_UNSUBSCRIBE,
      message: VALIDATION_MESSAGES[VALIDATION_CODES.MISSING_UNSUBSCRIBE],
      severity: 'error',
      field: 'htmlContent'
    })
  }

  // Warnings
  if (unresolvedVariables > 0) {
    issues.push({
      code: VALIDATION_CODES.UNRESOLVED_VARIABLES,
      message: `${unresolvedVariables} variable(s) are not resolved`,
      severity: 'warning'
    })
  }

  if (!textContent?.trim()) {
    issues.push({
      code: VALIDATION_CODES.NO_TEXT_VERSION,
      message: VALIDATION_MESSAGES[VALIDATION_CODES.NO_TEXT_VERSION],
      severity: 'warning',
      field: 'textContent'
    })
  }

  // Check for spam triggers
  const allContent = `${subject || ''} ${htmlContent || ''}`
  const spamTriggers = detectSpamTriggers(allContent)
  if (spamTriggers.length > 0) {
    issues.push({
      code: VALIDATION_CODES.SPAM_CONTENT,
      message: `Contains potential spam triggers: ${spamTriggers.slice(0, 3).join(', ')}${spamTriggers.length > 3 ? '...' : ''}`,
      severity: 'warning'
    })
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  // Calculate deliverability score
  const textToImageRatio = calculateTextToImageRatio(htmlContent || '')
  const deliverabilityScore = calculateDeliverabilityScore(
    !!subject?.trim(),
    hasUnsubscribe,
    !!textContent?.trim(),
    unresolvedVariables,
    spamTriggers.length,
    textToImageRatio
  )

  return {
    valid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
    deliverabilityScore
  }
}

/**
 * Calculate text to image ratio in HTML content
 */
export function calculateTextToImageRatio(htmlContent: string): number {
  // Remove HTML tags to get text
  const textOnly = htmlContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const textLength = textOnly.length

  // Count images
  const imageMatches = htmlContent.match(/<img[^>]*>/gi) || []
  const imageCount = imageMatches.length

  if (imageCount === 0) return 1
  if (textLength === 0) return 0

  // Approximate ratio (assuming average image is "worth" 500 chars)
  const estimatedImageChars = imageCount * 500
  return textLength / (textLength + estimatedImageChars)
}

/**
 * Estimate send duration
 */
export function estimateSendDuration(
  recipientCount: number,
  sendRatePerMinute: number
): SendEstimate {
  const durationMinutes = Math.ceil(recipientCount / sendRatePerMinute)

  return {
    recipientCount,
    estimatedDurationMinutes: durationMinutes,
    sendRate: sendRatePerMinute
  }
}

/**
 * Format test email subject
 */
export function formatTestSubject(originalSubject: string): string {
  return `[TEST] ${originalSubject}`
}

/**
 * Get deliverability score label
 */
export function getDeliverabilityLabel(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

/**
 * Get deliverability score color
 */
export function getDeliverabilityColor(score: number): string {
  if (score >= 90) return '#22c55e' // green
  if (score >= 70) return '#84cc16' // lime
  if (score >= 50) return '#eab308' // yellow
  return '#ef4444' // red
}

/**
 * Get default fallbacks for common variables
 */
export function getDefaultFallbacks(): Record<string, string> {
  return {
    firstName: 'Friend',
    lastName: '',
    email: 'recipient@example.com',
    company: 'Your Company',
    eventName: 'The Event',
    editionName: 'Current Edition',
    ticketType: 'Standard Ticket',
    unsubscribeUrl: '#unsubscribe'
  }
}

/**
 * Validate email addresses for test sending
 */
export function validateTestAddresses(addresses: string[]): {
  valid: string[]
  invalid: string[]
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const valid: string[] = []
  const invalid: string[] = []

  for (const addr of addresses) {
    if (emailRegex.test(addr.trim())) {
      valid.push(addr.trim().toLowerCase())
    } else {
      invalid.push(addr)
    }
  }

  return { valid, invalid }
}
