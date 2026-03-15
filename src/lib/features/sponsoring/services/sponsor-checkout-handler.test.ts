import { describe, expect, it } from 'vitest'
import { isSponsorCheckoutMetadata } from './sponsor-checkout-handler'

describe('sponsor-checkout-handler', () => {
  describe('isSponsorCheckoutMetadata', () => {
    it('should return true when metadata type is sponsor_package', () => {
      const metadata = { type: 'sponsor_package', editionId: 'ed1' }
      expect(isSponsorCheckoutMetadata(metadata)).toBe(true)
    })

    it('should return false when metadata type is different', () => {
      const metadata = { type: 'ticket', editionId: 'ed1' }
      expect(isSponsorCheckoutMetadata(metadata)).toBe(false)
    })

    it('should return false when metadata is undefined', () => {
      expect(isSponsorCheckoutMetadata(undefined)).toBe(false)
    })

    it('should return false when metadata is null', () => {
      expect(isSponsorCheckoutMetadata(null)).toBe(false)
    })

    it('should return false when metadata has no type property', () => {
      const metadata = { editionId: 'ed1' }
      expect(isSponsorCheckoutMetadata(metadata)).toBe(false)
    })
  })
})
