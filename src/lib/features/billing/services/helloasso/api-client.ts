import type { HelloAssoTokenManager } from './token-manager'

export interface HelloAssoCheckoutIntent {
  id: number
  redirectUrl: string
  metadata?: Record<string, string>
}

export interface HelloAssoOrder {
  id: number
  formSlug: string
  formType: string
  amount: { total: number; vat: number; discount: number }
  payer: { email: string; firstName: string; lastName: string }
  payments: Array<{ id: number; amount: number; state: string }>
  metadata?: Record<string, string>
}

export interface HelloAssoPayment {
  id: number
  amount: number
  state: string
  paymentReceiptUrl?: string
}

export interface CreateCheckoutIntentInput {
  totalAmount: number
  itemName: string
  backUrl: string
  errorUrl: string
  returnUrl: string
  containsDonation: boolean
  payer?: { email: string; firstName?: string; lastName?: string }
  metadata?: Record<string, string>
}

export interface HelloAssoApiClient {
  createCheckoutIntent(input: CreateCheckoutIntentInput): Promise<HelloAssoCheckoutIntent>
  getCheckoutIntent(intentId: number): Promise<HelloAssoCheckoutIntent>
  getOrder(orderId: number): Promise<HelloAssoOrder>
  getPayment(paymentId: number): Promise<HelloAssoPayment>
  refundPayment(paymentId: number, amount: number, comment?: string): Promise<void>
}

export const createHelloAssoApiClient = (
  tokenManager: HelloAssoTokenManager,
  orgSlug: string,
  apiBase: string
): HelloAssoApiClient => {
  async function apiRequest<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const accessToken = await tokenManager.getAccessToken()
    const url = `${apiBase}/v5${path}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HelloAsso API error (${response.status}): ${errorText}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  return {
    async createCheckoutIntent(input: CreateCheckoutIntentInput): Promise<HelloAssoCheckoutIntent> {
      const payload = {
        totalAmount: input.totalAmount,
        initialAmount: input.totalAmount,
        itemName: input.itemName,
        backUrl: input.backUrl,
        errorUrl: input.errorUrl,
        returnUrl: input.returnUrl,
        containsDonation: input.containsDonation,
        payer: input.payer,
        metadata: input.metadata
      }

      return apiRequest<HelloAssoCheckoutIntent>(
        'POST',
        `/organizations/${orgSlug}/checkout-intents`,
        payload
      )
    },

    async getCheckoutIntent(intentId: number): Promise<HelloAssoCheckoutIntent> {
      return apiRequest<HelloAssoCheckoutIntent>(
        'GET',
        `/organizations/${orgSlug}/checkout-intents/${intentId}`
      )
    },

    async getOrder(orderId: number): Promise<HelloAssoOrder> {
      return apiRequest<HelloAssoOrder>('GET', `/organizations/${orgSlug}/orders/${orderId}`)
    },

    async getPayment(paymentId: number): Promise<HelloAssoPayment> {
      return apiRequest<HelloAssoPayment>('GET', `/organizations/${orgSlug}/payments/${paymentId}`)
    },

    async refundPayment(paymentId: number, amount: number, comment?: string): Promise<void> {
      await apiRequest('POST', `/organizations/${orgSlug}/payments/${paymentId}/refund`, {
        amount,
        comment: comment || 'Refund'
      })
    }
  }
}
