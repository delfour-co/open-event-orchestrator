import { describe, expect, it } from 'vitest'
import type { Benefit } from './package'
import {
  type SponsorDeliverable,
  calculateDeliverableStats,
  canTransitionDeliverableTo,
  createDeliverableSchema,
  createDeliverablesFromBenefits,
  deliverableStatusSchema,
  getDeliverableStatusBadgeVariant,
  getDeliverableStatusColor,
  getDeliverableStatusLabel,
  getValidDeliverableTransitions,
  groupDeliverablesByStatus,
  isDeliverableDueSoon,
  isDeliverableOverdue,
  sortDeliverablesByDueDate,
  sponsorDeliverableSchema,
  updateDeliverableSchema
} from './sponsor-deliverable'

describe('deliverableStatusSchema', () => {
  it('should accept valid statuses', () => {
    expect(deliverableStatusSchema.parse('pending')).toBe('pending')
    expect(deliverableStatusSchema.parse('in_progress')).toBe('in_progress')
    expect(deliverableStatusSchema.parse('delivered')).toBe('delivered')
  })

  it('should reject invalid status', () => {
    expect(() => deliverableStatusSchema.parse('invalid')).toThrow()
    expect(() => deliverableStatusSchema.parse('')).toThrow()
  })
})

describe('sponsorDeliverableSchema', () => {
  it('should validate a complete deliverable', () => {
    const deliverable = {
      id: 'del123',
      editionSponsorId: 'es123',
      benefitName: 'Logo on website',
      description: 'Display logo on homepage',
      status: 'pending',
      dueDate: new Date('2025-06-01'),
      deliveredAt: undefined,
      notes: 'Waiting for logo file',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = sponsorDeliverableSchema.parse(deliverable)
    expect(result.id).toBe('del123')
    expect(result.benefitName).toBe('Logo on website')
    expect(result.status).toBe('pending')
  })

  it('should validate minimal deliverable', () => {
    const deliverable = {
      id: 'del123',
      editionSponsorId: 'es123',
      benefitName: 'Logo',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = sponsorDeliverableSchema.parse(deliverable)
    expect(result.id).toBe('del123')
    expect(result.description).toBeUndefined()
    expect(result.dueDate).toBeUndefined()
  })

  it('should reject empty benefit name', () => {
    const deliverable = {
      id: 'del123',
      editionSponsorId: 'es123',
      benefitName: '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(() => sponsorDeliverableSchema.parse(deliverable)).toThrow()
  })
})

describe('createDeliverableSchema', () => {
  it('should validate create input', () => {
    const input = {
      editionSponsorId: 'es123',
      benefitName: 'Speaking slot',
      status: 'pending'
    }

    const result = createDeliverableSchema.parse(input)
    expect(result.editionSponsorId).toBe('es123')
    expect(result.benefitName).toBe('Speaking slot')
  })

  it('should default status to pending', () => {
    const input = {
      editionSponsorId: 'es123',
      benefitName: 'Booth'
    }

    const result = createDeliverableSchema.parse(input)
    expect(result.status).toBe('pending')
  })
})

describe('updateDeliverableSchema', () => {
  it('should allow partial updates', () => {
    const update = { status: 'delivered' as const }
    const result = updateDeliverableSchema.parse(update)
    expect(result.status).toBe('delivered')
  })

  it('should allow updating description only', () => {
    const update = { description: 'New description' }
    const result = updateDeliverableSchema.parse(update)
    expect(result.description).toBe('New description')
    expect(result.status).toBeUndefined()
  })
})

describe('getDeliverableStatusLabel', () => {
  it('should return correct labels', () => {
    expect(getDeliverableStatusLabel('pending')).toBe('Pending')
    expect(getDeliverableStatusLabel('in_progress')).toBe('In Progress')
    expect(getDeliverableStatusLabel('delivered')).toBe('Delivered')
  })
})

describe('getDeliverableStatusColor', () => {
  it('should return correct colors', () => {
    expect(getDeliverableStatusColor('pending')).toBe('gray')
    expect(getDeliverableStatusColor('in_progress')).toBe('blue')
    expect(getDeliverableStatusColor('delivered')).toBe('green')
  })
})

describe('getDeliverableStatusBadgeVariant', () => {
  it('should return correct variants', () => {
    expect(getDeliverableStatusBadgeVariant('pending')).toBe('outline')
    expect(getDeliverableStatusBadgeVariant('in_progress')).toBe('secondary')
    expect(getDeliverableStatusBadgeVariant('delivered')).toBe('default')
  })
})

describe('canTransitionDeliverableTo', () => {
  it('should allow valid transitions from pending', () => {
    expect(canTransitionDeliverableTo('pending', 'in_progress')).toBe(true)
    expect(canTransitionDeliverableTo('pending', 'delivered')).toBe(true)
  })

  it('should allow valid transitions from in_progress', () => {
    expect(canTransitionDeliverableTo('in_progress', 'pending')).toBe(true)
    expect(canTransitionDeliverableTo('in_progress', 'delivered')).toBe(true)
  })

  it('should allow reverting from delivered', () => {
    expect(canTransitionDeliverableTo('delivered', 'in_progress')).toBe(true)
    expect(canTransitionDeliverableTo('delivered', 'pending')).toBe(true)
  })

  it('should not allow same status transition', () => {
    expect(canTransitionDeliverableTo('pending', 'pending')).toBe(false)
    expect(canTransitionDeliverableTo('delivered', 'delivered')).toBe(false)
  })
})

describe('getValidDeliverableTransitions', () => {
  it('should return valid transitions for pending', () => {
    const transitions = getValidDeliverableTransitions('pending')
    expect(transitions).toContain('in_progress')
    expect(transitions).toContain('delivered')
  })

  it('should return valid transitions for in_progress', () => {
    const transitions = getValidDeliverableTransitions('in_progress')
    expect(transitions).toContain('pending')
    expect(transitions).toContain('delivered')
  })

  it('should return valid transitions for delivered', () => {
    const transitions = getValidDeliverableTransitions('delivered')
    expect(transitions).toContain('in_progress')
    expect(transitions).toContain('pending')
  })
})

describe('isDeliverableOverdue', () => {
  it('should return true for past due date with non-delivered status', () => {
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'pending',
      dueDate: new Date('2020-01-01'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableOverdue(deliverable)).toBe(true)
  })

  it('should return false for delivered status even with past due date', () => {
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'delivered',
      dueDate: new Date('2020-01-01'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableOverdue(deliverable)).toBe(false)
  })

  it('should return false for future due date', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'pending',
      dueDate: futureDate,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableOverdue(deliverable)).toBe(false)
  })

  it('should return false when no due date', () => {
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableOverdue(deliverable)).toBe(false)
  })
})

describe('isDeliverableDueSoon', () => {
  it('should return true for due date within threshold', () => {
    const soonDate = new Date()
    soonDate.setDate(soonDate.getDate() + 3)
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'pending',
      dueDate: soonDate,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableDueSoon(deliverable, 7)).toBe(true)
  })

  it('should return false for due date beyond threshold', () => {
    const farDate = new Date()
    farDate.setDate(farDate.getDate() + 30)
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'pending',
      dueDate: farDate,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableDueSoon(deliverable, 7)).toBe(false)
  })

  it('should return false for delivered status', () => {
    const soonDate = new Date()
    soonDate.setDate(soonDate.getDate() + 3)
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'delivered',
      dueDate: soonDate,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableDueSoon(deliverable, 7)).toBe(false)
  })

  it('should return false for past due date', () => {
    const deliverable: SponsorDeliverable = {
      id: 'del1',
      editionSponsorId: 'es1',
      benefitName: 'Test',
      status: 'pending',
      dueDate: new Date('2020-01-01'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    expect(isDeliverableDueSoon(deliverable, 7)).toBe(false)
  })
})

describe('calculateDeliverableStats', () => {
  it('should calculate stats correctly', () => {
    const now = new Date()
    const pastDate = new Date('2020-01-01')
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)

    const deliverables: SponsorDeliverable[] = [
      {
        id: '1',
        editionSponsorId: 'es1',
        benefitName: 'A',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        editionSponsorId: 'es1',
        benefitName: 'B',
        status: 'in_progress',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        editionSponsorId: 'es1',
        benefitName: 'C',
        status: 'delivered',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '4',
        editionSponsorId: 'es1',
        benefitName: 'D',
        status: 'pending',
        dueDate: pastDate,
        createdAt: now,
        updatedAt: now
      }
    ]

    const stats = calculateDeliverableStats(deliverables)

    expect(stats.total).toBe(4)
    expect(stats.pending).toBe(2)
    expect(stats.inProgress).toBe(1)
    expect(stats.delivered).toBe(1)
    expect(stats.overdue).toBe(1)
    expect(stats.completionRate).toBe(25)
    expect(stats.byStatus.pending).toBe(2)
    expect(stats.byStatus.in_progress).toBe(1)
    expect(stats.byStatus.delivered).toBe(1)
  })

  it('should handle empty array', () => {
    const stats = calculateDeliverableStats([])
    expect(stats.total).toBe(0)
    expect(stats.completionRate).toBe(0)
  })
})

describe('groupDeliverablesByStatus', () => {
  it('should group deliverables correctly', () => {
    const now = new Date()
    const deliverables: SponsorDeliverable[] = [
      {
        id: '1',
        editionSponsorId: 'es1',
        benefitName: 'A',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        editionSponsorId: 'es1',
        benefitName: 'B',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        editionSponsorId: 'es1',
        benefitName: 'C',
        status: 'delivered',
        createdAt: now,
        updatedAt: now
      }
    ]

    const groups = groupDeliverablesByStatus(deliverables)

    expect(groups.pending).toHaveLength(2)
    expect(groups.in_progress).toHaveLength(0)
    expect(groups.delivered).toHaveLength(1)
  })
})

describe('sortDeliverablesByDueDate', () => {
  it('should sort by due date ascending', () => {
    const now = new Date()
    const deliverables: SponsorDeliverable[] = [
      {
        id: '1',
        editionSponsorId: 'es1',
        benefitName: 'A',
        status: 'pending',
        dueDate: new Date('2025-03-01'),
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        editionSponsorId: 'es1',
        benefitName: 'B',
        status: 'pending',
        dueDate: new Date('2025-01-01'),
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        editionSponsorId: 'es1',
        benefitName: 'C',
        status: 'pending',
        dueDate: new Date('2025-02-01'),
        createdAt: now,
        updatedAt: now
      }
    ]

    const sorted = sortDeliverablesByDueDate(deliverables)

    expect(sorted[0].benefitName).toBe('B')
    expect(sorted[1].benefitName).toBe('C')
    expect(sorted[2].benefitName).toBe('A')
  })

  it('should put items without due date at end', () => {
    const now = new Date()
    const deliverables: SponsorDeliverable[] = [
      {
        id: '1',
        editionSponsorId: 'es1',
        benefitName: 'A',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        editionSponsorId: 'es1',
        benefitName: 'B',
        status: 'pending',
        dueDate: new Date('2025-01-01'),
        createdAt: now,
        updatedAt: now
      }
    ]

    const sorted = sortDeliverablesByDueDate(deliverables)

    expect(sorted[0].benefitName).toBe('B')
    expect(sorted[1].benefitName).toBe('A')
  })
})

describe('createDeliverablesFromBenefits', () => {
  it('should create deliverables for included benefits only', () => {
    const benefits: Benefit[] = [
      { name: 'Logo on website', included: true },
      { name: 'Speaking slot', included: true },
      { name: 'Booth', included: false }
    ]

    const deliverables = createDeliverablesFromBenefits('es123', benefits)

    expect(deliverables).toHaveLength(2)
    expect(deliverables[0].benefitName).toBe('Logo on website')
    expect(deliverables[1].benefitName).toBe('Speaking slot')
    expect(deliverables[0].editionSponsorId).toBe('es123')
    expect(deliverables[0].status).toBe('pending')
  })

  it('should set default due date if provided', () => {
    const benefits: Benefit[] = [{ name: 'Logo on website', included: true }]
    const dueDate = new Date('2025-06-01')

    const deliverables = createDeliverablesFromBenefits('es123', benefits, dueDate)

    expect(deliverables[0].dueDate).toEqual(dueDate)
  })

  it('should return empty array for no included benefits', () => {
    const benefits: Benefit[] = [
      { name: 'Logo', included: false },
      { name: 'Booth', included: false }
    ]

    const deliverables = createDeliverablesFromBenefits('es123', benefits)

    expect(deliverables).toHaveLength(0)
  })

  it('should handle empty benefits array', () => {
    const deliverables = createDeliverablesFromBenefits('es123', [])
    expect(deliverables).toHaveLength(0)
  })
})
