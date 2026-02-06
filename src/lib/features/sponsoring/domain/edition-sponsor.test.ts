import { describe, expect, it } from 'vitest'
import {
  type EditionSponsor,
  type EditionSponsorExpanded,
  PIPELINE_STATUSES,
  SPONSOR_STATUS_ORDER,
  type SponsorStatus,
  calculateStats,
  canTransitionTo,
  createEditionSponsorSchema,
  editionSponsorSchema,
  getStatusBadgeVariant,
  getStatusColor,
  getStatusLabel,
  getValidTransitions,
  groupByStatus,
  isActiveStatus,
  isPipelineStatus,
  isTerminalStatus,
  sortByPackageTier,
  sponsorStatusSchema,
  updateEditionSponsorSchema
} from './edition-sponsor'

describe('EditionSponsor Domain', () => {
  const validEditionSponsor: EditionSponsor = {
    id: 'es123',
    editionId: 'ed123',
    sponsorId: 'sp123',
    packageId: 'pkg123',
    status: 'confirmed',
    confirmedAt: new Date(),
    paidAt: new Date(),
    amount: 5000,
    notes: 'VIP sponsor',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('sponsorStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses: SponsorStatus[] = [
        'prospect',
        'contacted',
        'negotiating',
        'confirmed',
        'declined',
        'cancelled'
      ]
      for (const status of statuses) {
        expect(sponsorStatusSchema.safeParse(status).success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(sponsorStatusSchema.safeParse('unknown').success).toBe(false)
    })
  })

  describe('editionSponsorSchema', () => {
    it('should validate a complete edition sponsor', () => {
      const result = editionSponsorSchema.safeParse(validEditionSponsor)
      expect(result.success).toBe(true)
    })

    it('should validate edition sponsor with minimal fields', () => {
      const minimal = {
        id: 'es123',
        editionId: 'ed123',
        sponsorId: 'sp123',
        status: 'prospect',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = editionSponsorSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should default status to prospect', () => {
      const data = {
        id: 'es123',
        editionId: 'ed123',
        sponsorId: 'sp123',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = editionSponsorSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('prospect')
      }
    })

    it('should reject negative amount', () => {
      const invalid = { ...validEditionSponsor, amount: -100 }
      const result = editionSponsorSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject notes too long', () => {
      const invalid = { ...validEditionSponsor, notes: 'a'.repeat(5001) }
      const result = editionSponsorSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('createEditionSponsorSchema', () => {
    it('should omit id, createdAt, updatedAt', () => {
      const createData = {
        editionId: 'ed123',
        sponsorId: 'sp123',
        status: 'prospect' as const
      }
      const result = createEditionSponsorSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateEditionSponsorSchema', () => {
    it('should allow partial updates', () => {
      const updateData = {
        status: 'contacted' as const,
        notes: 'Updated notes'
      }
      const result = updateEditionSponsorSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should not allow editionId update', () => {
      const updateData = {
        editionId: 'new-ed',
        status: 'contacted' as const
      }
      const result = updateEditionSponsorSchema.safeParse(updateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('editionId')
      }
    })

    it('should not allow sponsorId update', () => {
      const updateData = {
        sponsorId: 'new-sp',
        status: 'contacted' as const
      }
      const result = updateEditionSponsorSchema.safeParse(updateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('sponsorId')
      }
    })
  })

  describe('SPONSOR_STATUS_ORDER', () => {
    it('should contain all statuses', () => {
      expect(SPONSOR_STATUS_ORDER).toHaveLength(6)
      expect(SPONSOR_STATUS_ORDER).toContain('prospect')
      expect(SPONSOR_STATUS_ORDER).toContain('confirmed')
      expect(SPONSOR_STATUS_ORDER).toContain('cancelled')
    })
  })

  describe('PIPELINE_STATUSES', () => {
    it('should contain active pipeline statuses', () => {
      expect(PIPELINE_STATUSES).toContain('prospect')
      expect(PIPELINE_STATUSES).toContain('contacted')
      expect(PIPELINE_STATUSES).toContain('negotiating')
      expect(PIPELINE_STATUSES).toContain('confirmed')
    })

    it('should not contain terminal statuses', () => {
      expect(PIPELINE_STATUSES).not.toContain('declined')
      expect(PIPELINE_STATUSES).not.toContain('cancelled')
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getStatusLabel('prospect')).toBe('Prospect')
      expect(getStatusLabel('contacted')).toBe('Contacted')
      expect(getStatusLabel('negotiating')).toBe('Negotiating')
      expect(getStatusLabel('confirmed')).toBe('Confirmed')
      expect(getStatusLabel('declined')).toBe('Declined')
      expect(getStatusLabel('cancelled')).toBe('Cancelled')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors', () => {
      expect(getStatusColor('prospect')).toBe('gray')
      expect(getStatusColor('contacted')).toBe('blue')
      expect(getStatusColor('negotiating')).toBe('yellow')
      expect(getStatusColor('confirmed')).toBe('green')
      expect(getStatusColor('declined')).toBe('red')
      expect(getStatusColor('cancelled')).toBe('slate')
    })
  })

  describe('getStatusBadgeVariant', () => {
    it('should return correct badge variants', () => {
      expect(getStatusBadgeVariant('prospect')).toBe('outline')
      expect(getStatusBadgeVariant('confirmed')).toBe('default')
      expect(getStatusBadgeVariant('declined')).toBe('destructive')
    })
  })

  describe('canTransitionTo', () => {
    it('should allow prospect to contacted', () => {
      expect(canTransitionTo('prospect', 'contacted')).toBe(true)
    })

    it('should allow prospect to declined', () => {
      expect(canTransitionTo('prospect', 'declined')).toBe(true)
    })

    it('should allow contacted to negotiating', () => {
      expect(canTransitionTo('contacted', 'negotiating')).toBe(true)
    })

    it('should allow negotiating to confirmed', () => {
      expect(canTransitionTo('negotiating', 'confirmed')).toBe(true)
    })

    it('should not allow prospect to confirmed directly', () => {
      expect(canTransitionTo('prospect', 'confirmed')).toBe(false)
    })

    it('should not allow same status transition', () => {
      expect(canTransitionTo('prospect', 'prospect')).toBe(false)
    })

    it('should allow declined to be reactivated', () => {
      expect(canTransitionTo('declined', 'prospect')).toBe(true)
      expect(canTransitionTo('declined', 'contacted')).toBe(true)
    })

    it('should allow cancelled to be reactivated', () => {
      expect(canTransitionTo('cancelled', 'prospect')).toBe(true)
    })

    it('should allow confirmed to be cancelled', () => {
      expect(canTransitionTo('confirmed', 'cancelled')).toBe(true)
    })

    it('should not allow confirmed to be declined', () => {
      expect(canTransitionTo('confirmed', 'declined')).toBe(false)
    })
  })

  describe('getValidTransitions', () => {
    it('should return valid transitions for prospect', () => {
      const transitions = getValidTransitions('prospect')
      expect(transitions).toContain('contacted')
      expect(transitions).toContain('declined')
      expect(transitions).toContain('cancelled')
      expect(transitions).not.toContain('confirmed')
    })

    it('should return valid transitions for negotiating', () => {
      const transitions = getValidTransitions('negotiating')
      expect(transitions).toContain('confirmed')
      expect(transitions).toContain('declined')
    })
  })

  describe('isActiveStatus', () => {
    it('should return true for active statuses', () => {
      expect(isActiveStatus('prospect')).toBe(true)
      expect(isActiveStatus('contacted')).toBe(true)
      expect(isActiveStatus('negotiating')).toBe(true)
      expect(isActiveStatus('confirmed')).toBe(true)
    })

    it('should return false for terminal statuses', () => {
      expect(isActiveStatus('declined')).toBe(false)
      expect(isActiveStatus('cancelled')).toBe(false)
    })
  })

  describe('isTerminalStatus', () => {
    it('should return true for terminal statuses', () => {
      expect(isTerminalStatus('declined')).toBe(true)
      expect(isTerminalStatus('cancelled')).toBe(true)
    })

    it('should return false for non-terminal statuses', () => {
      expect(isTerminalStatus('prospect')).toBe(false)
      expect(isTerminalStatus('confirmed')).toBe(false)
    })
  })

  describe('isPipelineStatus', () => {
    it('should return true for pipeline statuses', () => {
      expect(isPipelineStatus('prospect')).toBe(true)
      expect(isPipelineStatus('confirmed')).toBe(true)
    })

    it('should return false for non-pipeline statuses', () => {
      expect(isPipelineStatus('declined')).toBe(false)
      expect(isPipelineStatus('cancelled')).toBe(false)
    })
  })

  describe('calculateStats', () => {
    it('should calculate stats correctly', () => {
      const sponsors: EditionSponsor[] = [
        { ...validEditionSponsor, id: '1', status: 'prospect', amount: undefined },
        { ...validEditionSponsor, id: '2', status: 'confirmed', amount: 5000 },
        { ...validEditionSponsor, id: '3', status: 'confirmed', amount: 3000, paidAt: undefined },
        { ...validEditionSponsor, id: '4', status: 'declined', amount: undefined }
      ]

      const stats = calculateStats(sponsors)

      expect(stats.total).toBe(4)
      expect(stats.byStatus.prospect).toBe(1)
      expect(stats.byStatus.confirmed).toBe(2)
      expect(stats.byStatus.declined).toBe(1)
      expect(stats.confirmed).toBe(2)
      expect(stats.totalAmount).toBe(8000)
      expect(stats.paidAmount).toBe(5000)
    })

    it('should handle empty array', () => {
      const stats = calculateStats([])
      expect(stats.total).toBe(0)
      expect(stats.confirmed).toBe(0)
      expect(stats.totalAmount).toBe(0)
    })
  })

  describe('groupByStatus', () => {
    it('should group sponsors by status', () => {
      const sponsors: EditionSponsorExpanded[] = [
        { ...validEditionSponsor, id: '1', status: 'prospect' },
        { ...validEditionSponsor, id: '2', status: 'confirmed' },
        { ...validEditionSponsor, id: '3', status: 'prospect' }
      ]

      const groups = groupByStatus(sponsors)

      expect(groups.prospect).toHaveLength(2)
      expect(groups.confirmed).toHaveLength(1)
      expect(groups.declined).toHaveLength(0)
    })

    it('should return empty arrays for all statuses when no sponsors', () => {
      const groups = groupByStatus([])
      expect(groups.prospect).toHaveLength(0)
      expect(groups.confirmed).toHaveLength(0)
      expect(groups.declined).toHaveLength(0)
    })
  })

  describe('sortByPackageTier', () => {
    it('should sort sponsors by package tier', () => {
      const sponsors: EditionSponsorExpanded[] = [
        {
          ...validEditionSponsor,
          id: '1',
          package: { tier: 3 } as EditionSponsorExpanded['package']
        },
        {
          ...validEditionSponsor,
          id: '2',
          package: { tier: 1 } as EditionSponsorExpanded['package']
        },
        {
          ...validEditionSponsor,
          id: '3',
          package: { tier: 2 } as EditionSponsorExpanded['package']
        }
      ]

      const sorted = sortByPackageTier(sponsors)
      expect(sorted.map((s) => s.package?.tier)).toEqual([1, 2, 3])
    })

    it('should put sponsors without package at end', () => {
      const sponsors: EditionSponsorExpanded[] = [
        { ...validEditionSponsor, id: '1', package: undefined },
        {
          ...validEditionSponsor,
          id: '2',
          package: { tier: 1 } as EditionSponsorExpanded['package']
        }
      ]

      const sorted = sortByPackageTier(sponsors)
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('1')
    })
  })
})
