import { z } from 'zod'

export const WEBHOOK_EVENTS = [
  'talk.submitted',
  'talk.accepted',
  'talk.rejected',
  'order.created',
  'order.completed',
  'order.refunded',
  'ticket.checked_in',
  'sponsor.confirmed'
] as const

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number]

export const webhookEventSchema = z.enum(WEBHOOK_EVENTS)

export const webhookSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  url: z.string().url(),
  secret: z.string().min(32),
  organizationId: z.string().optional(),
  eventId: z.string().optional(),
  editionId: z.string().optional(),
  events: z.array(webhookEventSchema).min(1),
  isActive: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
  retryCount: z.number().int().min(0).max(10).default(3),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Webhook = z.infer<typeof webhookSchema>

export const createWebhookSchema = webhookSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateWebhook = z.infer<typeof createWebhookSchema>

export const updateWebhookSchema = webhookSchema
  .omit({
    id: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true
  })
  .partial()

export type UpdateWebhook = z.infer<typeof updateWebhookSchema>

export const webhookDeliveryStatusSchema = z.enum(['pending', 'success', 'failed', 'retrying'])

export type WebhookDeliveryStatus = z.infer<typeof webhookDeliveryStatusSchema>

export const webhookDeliverySchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  event: webhookEventSchema,
  payload: z.record(z.unknown()),
  statusCode: z.number().optional(),
  responseBody: z.string().optional(),
  attempt: z.number().int().min(1).default(1),
  nextRetryAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  error: z.string().optional(),
  createdAt: z.date()
})

export type WebhookDelivery = z.infer<typeof webhookDeliverySchema>

export const createWebhookDeliverySchema = webhookDeliverySchema.omit({
  id: true,
  statusCode: true,
  responseBody: true,
  deliveredAt: true,
  error: true,
  createdAt: true
})

export type CreateWebhookDelivery = z.infer<typeof createWebhookDeliverySchema>

export interface WebhookScope {
  organizationId?: string
  eventId?: string
  editionId?: string
}

export const SECRET_LENGTH = 32

export const generateWebhookSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(SECRET_LENGTH)
  crypto.getRandomValues(randomValues)
  for (const value of randomValues) {
    result += chars[value % chars.length]
  }
  return result
}

export const isWebhookActive = (webhook: Webhook): boolean => {
  return webhook.isActive
}

export const webhookMatchesEvent = (webhook: Webhook, event: WebhookEventType): boolean => {
  return webhook.events.includes(event)
}

export const webhookMatchesScope = (webhook: Webhook, scope: WebhookScope): boolean => {
  if (webhook.editionId && scope.editionId && webhook.editionId !== scope.editionId) {
    return false
  }
  if (webhook.eventId && scope.eventId && webhook.eventId !== scope.eventId) {
    return false
  }
  if (
    webhook.organizationId &&
    scope.organizationId &&
    webhook.organizationId !== scope.organizationId
  ) {
    return false
  }
  return true
}

export const shouldRetry = (delivery: WebhookDelivery, maxRetries: number): boolean => {
  return delivery.attempt < maxRetries && !delivery.deliveredAt
}

export const getNextRetryDelay = (attempt: number): number => {
  // Exponential backoff: 1min, 5min, 30min
  const delays = [60_000, 300_000, 1_800_000]
  return delays[Math.min(attempt - 1, delays.length - 1)]
}

export const calculateNextRetryTime = (attempt: number): Date => {
  const delay = getNextRetryDelay(attempt)
  return new Date(Date.now() + delay)
}

export const getWebhookEventLabel = (event: WebhookEventType): string => {
  const labels: Record<WebhookEventType, string> = {
    'talk.submitted': 'Talk Submitted',
    'talk.accepted': 'Talk Accepted',
    'talk.rejected': 'Talk Rejected',
    'order.created': 'Order Created',
    'order.completed': 'Order Completed',
    'order.refunded': 'Order Refunded',
    'ticket.checked_in': 'Ticket Checked In',
    'sponsor.confirmed': 'Sponsor Confirmed'
  }
  return labels[event]
}

export const getWebhookEventCategory = (event: WebhookEventType): string => {
  if (event.startsWith('talk.')) return 'CFP'
  if (event.startsWith('order.')) return 'Billing'
  if (event.startsWith('ticket.')) return 'Tickets'
  if (event.startsWith('sponsor.')) return 'Sponsoring'
  return 'Other'
}

export const groupWebhookEventsByCategory = (): Record<string, WebhookEventType[]> => {
  const groups: Record<string, WebhookEventType[]> = {}
  for (const event of WEBHOOK_EVENTS) {
    const category = getWebhookEventCategory(event)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(event)
  }
  return groups
}
