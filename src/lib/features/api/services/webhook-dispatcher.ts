import { createHmac } from 'node:crypto'
import type PocketBase from 'pocketbase'
import {
  type Webhook,
  type WebhookDelivery,
  type WebhookEventType,
  type WebhookScope,
  calculateNextRetryTime,
  shouldRetry,
  webhookMatchesEvent,
  webhookMatchesScope
} from '../domain/webhook'
import { createWebhookDeliveryRepository } from '../infra/webhook-delivery-repository'
import { createWebhookRepository } from '../infra/webhook-repository'

export interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: Record<string, unknown>
}

export interface DispatchResult {
  webhookId: string
  deliveryId: string
  success: boolean
  statusCode?: number
  error?: string
}

export interface DeliveryResult {
  success: boolean
  statusCode?: number
  responseBody?: string
  error?: string
}

const DELIVERY_TIMEOUT_MS = 30_000
const MAX_RESPONSE_BODY_LENGTH = 10_000

export const createWebhookDispatcher = (pb: PocketBase) => {
  const webhookRepo = createWebhookRepository(pb)
  const deliveryRepo = createWebhookDeliveryRepository(pb)

  const signPayload = (payload: string, secret: string): string => {
    return createHmac('sha256', secret).update(payload).digest('hex')
  }

  const sendWebhook = async (
    webhook: Webhook,
    payload: WebhookPayload
  ): Promise<DeliveryResult> => {
    const payloadString = JSON.stringify(payload)
    const signature = signPayload(payloadString, webhook.secret)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-OEO-Signature': `sha256=${signature}`,
      'X-OEO-Event': payload.event,
      'X-OEO-Timestamp': payload.timestamp,
      ...(webhook.headers || {})
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      let responseBody = ''
      try {
        responseBody = await response.text()
        if (responseBody.length > MAX_RESPONSE_BODY_LENGTH) {
          responseBody = `${responseBody.substring(0, MAX_RESPONSE_BODY_LENGTH)}... (truncated)`
        }
      } catch {
        responseBody = ''
      }

      const success = response.ok
      return {
        success,
        statusCode: response.status,
        responseBody,
        error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  interface ValidationResult {
    valid: boolean
    error?: string
    alreadyDelivered?: boolean
    statusCode?: number
    delivery?: WebhookDelivery
    webhook?: Webhook
  }

  const validateDelivery = async (deliveryId: string): Promise<ValidationResult> => {
    const delivery = await deliveryRepo.findById(deliveryId)
    if (!delivery) {
      return { valid: false, error: 'Delivery not found' }
    }

    if (delivery.deliveredAt) {
      return { valid: false, alreadyDelivered: true, statusCode: delivery.statusCode }
    }

    const webhook = await webhookRepo.findById(delivery.webhookId)
    if (!webhook) {
      await deliveryRepo.markFailed(deliveryId, 'Webhook not found')
      return { valid: false, error: 'Webhook not found' }
    }

    if (!webhook.isActive) {
      await deliveryRepo.markFailed(deliveryId, 'Webhook is inactive')
      return { valid: false, error: 'Webhook is inactive' }
    }

    return { valid: true, delivery, webhook }
  }

  const handleDeliveryResult = async (
    deliveryId: string,
    delivery: WebhookDelivery,
    webhook: Webhook,
    result: DeliveryResult
  ): Promise<void> => {
    if (result.success && result.statusCode !== undefined) {
      await deliveryRepo.markDelivered(deliveryId, result.statusCode, result.responseBody)
      return
    }

    const nextAttempt = delivery.attempt + 1
    const shouldRetryAgain = shouldRetry({ ...delivery, attempt: nextAttempt }, webhook.retryCount)
    const nextRetryAt = shouldRetryAgain ? calculateNextRetryTime(nextAttempt) : undefined

    await deliveryRepo.markFailed(
      deliveryId,
      result.error || 'Delivery failed',
      nextRetryAt,
      nextAttempt
    )
  }

  return {
    async dispatch(
      event: WebhookEventType,
      data: Record<string, unknown>,
      scope: WebhookScope
    ): Promise<DispatchResult[]> {
      const webhooks = await webhookRepo.findByScope(scope)
      const matchingWebhooks = webhooks.filter(
        (wh) => webhookMatchesEvent(wh, event) && webhookMatchesScope(wh, scope)
      )

      const results: DispatchResult[] = []
      const timestamp = new Date().toISOString()
      const payload: WebhookPayload = { event, timestamp, data }

      for (const webhook of matchingWebhooks) {
        const delivery = await deliveryRepo.create({
          webhookId: webhook.id,
          event,
          payload: payload as unknown as Record<string, unknown>,
          attempt: 1
        })

        const result = await sendWebhook(webhook, payload)

        if (result.success && result.statusCode !== undefined) {
          await deliveryRepo.markDelivered(delivery.id, result.statusCode, result.responseBody)
          results.push({
            webhookId: webhook.id,
            deliveryId: delivery.id,
            success: true,
            statusCode: result.statusCode
          })
        } else {
          const shouldRetryDelivery = shouldRetry({ ...delivery, attempt: 1 }, webhook.retryCount)
          const nextRetryAt = shouldRetryDelivery ? calculateNextRetryTime(1) : undefined

          await deliveryRepo.markFailed(
            delivery.id,
            result.error || 'Delivery failed',
            nextRetryAt,
            1
          )

          results.push({
            webhookId: webhook.id,
            deliveryId: delivery.id,
            success: false,
            statusCode: result.statusCode,
            error: result.error
          })
        }
      }

      return results
    },

    async processDelivery(deliveryId: string): Promise<DeliveryResult> {
      const validation = await validateDelivery(deliveryId)
      if (!validation.valid) {
        if (validation.alreadyDelivered) {
          return { success: true, statusCode: validation.statusCode }
        }
        return { success: false, error: validation.error }
      }

      // validation.valid guarantees delivery and webhook are defined
      const delivery = validation.delivery as WebhookDelivery
      const webhook = validation.webhook as Webhook
      const payload = delivery.payload as unknown as WebhookPayload
      const result = await sendWebhook(webhook, payload)

      await handleDeliveryResult(deliveryId, delivery, webhook, result)
      return result
    },

    async processPendingRetries(): Promise<DispatchResult[]> {
      const pendingDeliveries = await deliveryRepo.findPendingRetries()
      const results: DispatchResult[] = []

      for (const delivery of pendingDeliveries) {
        const result = await this.processDelivery(delivery.id)
        results.push({
          webhookId: delivery.webhookId,
          deliveryId: delivery.id,
          success: result.success,
          statusCode: result.statusCode,
          error: result.error
        })
      }

      return results
    },

    async getDeliveryHistory(
      webhookId: string,
      page = 1,
      perPage = 50
    ): Promise<WebhookDelivery[]> {
      return deliveryRepo.findByWebhook(webhookId, page, perPage)
    },

    async getDeliveryStats(
      webhookId: string
    ): Promise<{ total: number; delivered: number; failed: number }> {
      return deliveryRepo.countByWebhook(webhookId)
    },

    async retryDelivery(deliveryId: string): Promise<DeliveryResult> {
      const delivery = await deliveryRepo.findById(deliveryId)
      if (!delivery) {
        return { success: false, error: 'Delivery not found' }
      }

      await deliveryRepo.updateResult(deliveryId, {
        attempt: 1,
        error: undefined,
        nextRetryAt: undefined
      })

      return this.processDelivery(deliveryId)
    },

    signPayload
  }
}

export type WebhookDispatcher = ReturnType<typeof createWebhookDispatcher>
