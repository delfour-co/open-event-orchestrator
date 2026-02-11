import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLeadScoringService } from './lead-scoring-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-id',
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    update: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('LeadScoringService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createLeadScoringService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createLeadScoringService(pb)
  })

  describe('createRule', () => {
    it('should create a scoring rule', async () => {
      const result = await service.createRule({
        eventId: 'evt-1',
        name: 'Email Opened',
        action: 'email_opened',
        points: 5
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('lead_scoring_rules').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-1',
          name: 'Email Opened',
          action: 'email_opened',
          points: 5,
          isActive: true
        })
      )
    })
  })

  describe('updateRule', () => {
    it('should update a rule', async () => {
      await service.updateRule('rule-1', { points: 10, isActive: false })

      expect(pb.collection('lead_scoring_rules').update).toHaveBeenCalledWith('rule-1', {
        points: 10,
        isActive: false
      })
    })
  })

  describe('getRules', () => {
    it('should return rules for event', async () => {
      pb.collection('lead_scoring_rules').getFullList.mockResolvedValue([
        {
          id: 'r1',
          eventId: 'evt-1',
          name: 'Email Opened',
          action: 'email_opened',
          points: 5,
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getRules('evt-1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Email Opened')
    })
  })

  describe('initializeDefaultRules', () => {
    it('should create default rules for new event', async () => {
      pb.collection('lead_scoring_rules').getFullList.mockResolvedValue([])

      const result = await service.initializeDefaultRules('evt-1')

      expect(result.length).toBeGreaterThan(0)
      expect(pb.collection('lead_scoring_rules').create).toHaveBeenCalled()
    })

    it('should return existing rules if already initialized', async () => {
      pb.collection('lead_scoring_rules').getFullList.mockResolvedValue([
        {
          id: 'r1',
          name: 'Existing Rule',
          action: 'email_opened',
          points: 5,
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.initializeDefaultRules('evt-1')

      expect(result).toHaveLength(1)
      expect(pb.collection('lead_scoring_rules').create).not.toHaveBeenCalled()
    })
  })

  describe('applyAction', () => {
    it('should apply action and update score', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        eventId: 'evt-1',
        leadScore: 10
      })

      pb.collection('lead_scoring_rules').getFullList.mockResolvedValue([
        {
          id: 'r1',
          action: 'email_opened',
          points: 5,
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.applyAction('c1', 'email_opened')

      expect(result.success).toBe(true)
      expect(result.previousScore).toBe(10)
      expect(result.newScore).toBe(15)
      expect(result.pointsChange).toBe(5)

      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          leadScore: 15,
          leadScoreLevel: 'cold'
        })
      )

      expect(pb.collection('lead_score_history').create).toHaveBeenCalled()
    })

    it('should return success with no change if no matching rule', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        eventId: 'evt-1',
        leadScore: 10
      })

      pb.collection('lead_scoring_rules').getFullList.mockResolvedValue([])

      const result = await service.applyAction('c1', 'email_opened')

      expect(result.success).toBe(true)
      expect(result.pointsChange).toBe(0)
    })
  })

  describe('adjustScore', () => {
    it('should manually adjust score', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        leadScore: 30
      })

      const result = await service.adjustScore('c1', -20, 'Reduced due to complaint')

      expect(result.success).toBe(true)
      expect(result.previousScore).toBe(30)
      expect(result.newScore).toBe(10)

      expect(pb.collection('lead_score_history').create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'manual_adjustment',
          pointsChange: -20,
          description: 'Reduced due to complaint'
        })
      )
    })
  })

  describe('getScore', () => {
    it('should return current score and level', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        leadScore: 55
      })

      const result = await service.getScore('c1')

      expect(result.score).toBe(55)
      expect(result.level).toBe('hot')
    })

    it('should return 0 and cold for missing score', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1'
      })

      const result = await service.getScore('c1')

      expect(result.score).toBe(0)
      expect(result.level).toBe('cold')
    })
  })

  describe('getScoreHistory', () => {
    it('should return score history', async () => {
      pb.collection('lead_score_history').getList.mockResolvedValue({
        items: [
          {
            id: 'h1',
            contactId: 'c1',
            action: 'email_opened',
            pointsChange: 5,
            previousScore: 0,
            newScore: 5,
            created: now.toISOString()
          }
        ]
      })

      const result = await service.getScoreHistory('c1')

      expect(result).toHaveLength(1)
      expect(result[0].action).toBe('email_opened')
    })
  })

  describe('getTopContacts', () => {
    it('should return contacts sorted by score', async () => {
      pb.collection('contacts').getList.mockResolvedValue({
        items: [
          { id: 'c1', leadScore: 100, leadScoreLevel: 'hot' },
          { id: 'c2', leadScore: 50, leadScoreLevel: 'hot' }
        ]
      })

      const result = await service.getTopContacts('evt-1', 10)

      expect(result).toHaveLength(2)
      expect(result[0].contactId).toBe('c1')
      expect(result[0].score).toBe(100)
    })
  })

  describe('getContactsByLevel', () => {
    it('should return contacts by score level', async () => {
      pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])

      const result = await service.getContactsByLevel('evt-1', 'hot')

      expect(result).toEqual(['c1', 'c2'])
      expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('hot')
        })
      )
    })
  })

  describe('recalculateScore', () => {
    it('should recalculate score from history', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        leadScore: 100
      })

      pb.collection('lead_score_history').getFullList.mockResolvedValue([
        { pointsChange: 5 },
        { pointsChange: 10 },
        { pointsChange: -3 }
      ])

      const result = await service.recalculateScore('c1')

      expect(result.success).toBe(true)
      expect(result.newScore).toBe(12) // 5 + 10 - 3
    })
  })

  describe('applyInactivityPenalties', () => {
    it('should apply penalties to inactive contacts', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 45)

      pb.collection('lead_scoring_rules').getFullList.mockResolvedValue([
        {
          id: 'r1',
          action: 'inactivity',
          inactivityDays: 30,
          points: -10,
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      pb.collection('contacts').getFullList.mockResolvedValue([
        {
          id: 'c1',
          leadScore: 50,
          lastActivityAt: oldDate.toISOString()
        }
      ])

      const result = await service.applyInactivityPenalties('evt-1')

      expect(result.processed).toBe(1)
      expect(result.updated).toBe(1)
      expect(pb.collection('contacts').update).toHaveBeenCalled()
    })

    it('should skip if no inactivity rules', async () => {
      pb.collection('lead_scoring_rules').getFullList.mockResolvedValue([])

      const result = await service.applyInactivityPenalties('evt-1')

      expect(result.processed).toBe(0)
      expect(result.updated).toBe(0)
    })
  })
})
