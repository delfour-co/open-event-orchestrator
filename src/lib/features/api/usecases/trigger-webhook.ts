import type PocketBase from 'pocketbase'
import type { WebhookEventType, WebhookScope } from '../domain/webhook'
import { type DispatchResult, createWebhookDispatcher } from '../services/webhook-dispatcher'

export interface TriggerWebhookInput {
  event: WebhookEventType
  data: Record<string, unknown>
  scope: WebhookScope
}

export interface TriggerWebhookResult {
  dispatched: number
  successful: number
  failed: number
  results: DispatchResult[]
}

export const createTriggerWebhookUseCase = (pb: PocketBase) => {
  const dispatcher = createWebhookDispatcher(pb)

  return async (input: TriggerWebhookInput): Promise<TriggerWebhookResult> => {
    const results = await dispatcher.dispatch(input.event, input.data, input.scope)

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return {
      dispatched: results.length,
      successful,
      failed,
      results
    }
  }
}

export type TriggerWebhookUseCase = ReturnType<typeof createTriggerWebhookUseCase>
