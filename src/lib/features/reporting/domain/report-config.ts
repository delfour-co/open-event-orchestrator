import { z } from 'zod'

/**
 * Report frequency options
 */
export const reportFrequencySchema = z.enum(['daily', 'weekly', 'monthly'])
export type ReportFrequency = z.infer<typeof reportFrequencySchema>

/**
 * Days of the week for scheduling
 */
export const dayOfWeekSchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
])
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>

/**
 * Report recipient configuration
 */
export const reportRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
})
export type ReportRecipient = z.infer<typeof reportRecipientSchema>

/**
 * Report sections that can be included
 */
export const reportSectionSchema = z.enum([
  'cfp',
  'billing',
  'planning',
  'crm',
  'budget',
  'sponsoring'
])
export type ReportSection = z.infer<typeof reportSectionSchema>

/**
 * Report configuration entity
 */
export const reportConfigSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(100),
  enabled: z.boolean().default(true),
  frequency: reportFrequencySchema,
  dayOfWeek: dayOfWeekSchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  timezone: z.string().default('UTC'),
  recipients: z.array(reportRecipientSchema).min(1),
  sections: z.array(reportSectionSchema).min(1),
  lastSentAt: z.date().optional(),
  nextScheduledAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ReportConfig = z.infer<typeof reportConfigSchema>

export type CreateReportConfig = Omit<
  ReportConfig,
  'id' | 'lastSentAt' | 'nextScheduledAt' | 'createdAt' | 'updatedAt'
>

export type UpdateReportConfig = Partial<
  Omit<ReportConfig, 'id' | 'editionId' | 'createdAt' | 'updatedAt'>
>

/**
 * Check if a report config is valid for scheduling
 */
export const isValidSchedule = (config: ReportConfig): boolean => {
  if (config.frequency === 'weekly' && !config.dayOfWeek) {
    return false
  }
  if (config.frequency === 'monthly' && !config.dayOfMonth) {
    return false
  }
  return true
}

/**
 * Calculate the next scheduled time for a report
 */
export const calculateNextScheduledAt = (
  config: Pick<ReportConfig, 'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'timeOfDay' | 'timezone'>,
  fromDate: Date = new Date()
): Date => {
  const [hours, minutes] = config.timeOfDay.split(':').map(Number)
  const next = new Date(fromDate)

  next.setUTCHours(hours, minutes, 0, 0)

  if (next <= fromDate) {
    next.setUTCDate(next.getUTCDate() + 1)
  }

  switch (config.frequency) {
    case 'daily':
      break

    case 'weekly':
      if (config.dayOfWeek) {
        const dayMap: Record<DayOfWeek, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6
        }
        const targetDay = dayMap[config.dayOfWeek]
        const currentDay = next.getUTCDay()
        const daysUntilTarget = (targetDay - currentDay + 7) % 7
        if (daysUntilTarget === 0 && next <= fromDate) {
          next.setUTCDate(next.getUTCDate() + 7)
        } else {
          next.setUTCDate(next.getUTCDate() + daysUntilTarget)
        }
      }
      break

    case 'monthly':
      if (config.dayOfMonth) {
        next.setUTCDate(config.dayOfMonth)
        if (next <= fromDate) {
          next.setUTCMonth(next.getUTCMonth() + 1)
        }
      }
      break
  }

  return next
}

/**
 * Get human-readable schedule description
 */
export const getScheduleDescription = (
  config: Pick<ReportConfig, 'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'timeOfDay'>
): string => {
  const time = config.timeOfDay

  switch (config.frequency) {
    case 'daily':
      return `Daily at ${time}`
    case 'weekly':
      return `Weekly on ${config.dayOfWeek} at ${time}`
    case 'monthly':
      return `Monthly on day ${config.dayOfMonth} at ${time}`
    default:
      return 'Unknown schedule'
  }
}

/**
 * Validate recipients list
 */
export const validateRecipients = (
  recipients: ReportRecipient[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (recipients.length === 0) {
    errors.push('At least one recipient is required')
  }

  const emails = new Set<string>()
  for (const recipient of recipients) {
    if (emails.has(recipient.email.toLowerCase())) {
      errors.push(`Duplicate email: ${recipient.email}`)
    }
    emails.add(recipient.email.toLowerCase())
  }

  return { valid: errors.length === 0, errors }
}
