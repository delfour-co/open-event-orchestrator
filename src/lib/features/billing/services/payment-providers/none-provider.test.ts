import { describe, expect, it } from 'vitest'
import { createNoneProvider } from './none-provider'

describe('none-provider', () => {
  const provider = createNoneProvider()

  it('should have type none', () => {
    expect(provider.type).toBe('none')
  })

  it('should throw on createCheckout', async () => {
    await expect(provider.createCheckout({} as never)).rejects.toThrow(
      'No payment provider configured'
    )
  })

  it('should throw on createRefund', async () => {
    await expect(provider.createRefund('pi_test')).rejects.toThrow('No payment provider configured')
  })

  it('should throw on parseWebhookEvent', async () => {
    await expect(provider.parseWebhookEvent({} as never)).rejects.toThrow(
      'No payment provider configured'
    )
  })
})
