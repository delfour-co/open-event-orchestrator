import { describe, expect, it } from 'vitest'
import {
  type ContactEventParticipation,
  PARTICIPATION_WEIGHTS,
  buildCrossEventSummary,
  buildParticipationDescription,
  calculateLoyaltyScore,
  getLoyaltyLevel,
  getParticipationTypes,
  groupParticipationsByEdition,
  sortParticipationsByDate
} from './contact-history'

describe('contact-history', () => {
  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const twoYearsAgo = new Date(now)
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const createParticipation = (
    overrides: Partial<ContactEventParticipation> = {}
  ): ContactEventParticipation => ({
    id: 'p1',
    contactId: 'c1',
    eventId: 'evt1',
    editionId: 'ed1',
    participationType: 'ticket_purchased',
    occurredAt: now,
    createdAt: now,
    ...overrides
  })

  describe('calculateLoyaltyScore', () => {
    it('should return 0 for empty participations', () => {
      expect(calculateLoyaltyScore([])).toBe(0)
    })

    it('should calculate base score for unique editions', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ editionId: 'ed1' }),
        createParticipation({ id: 'p2', editionId: 'ed2' })
      ]

      const score = calculateLoyaltyScore(participations)
      // 2 editions * 10 = 20 base
      // + ticket_purchased weight (5) * 2 = 10
      // + recency bonus 20
      expect(score).toBeGreaterThanOrEqual(50)
    })

    it('should add participation type weights', () => {
      const singleTicket: ContactEventParticipation[] = [
        createParticipation({ participationType: 'ticket_purchased' })
      ]

      const speakerParticipation: ContactEventParticipation[] = [
        createParticipation({ participationType: 'speaker' })
      ]

      const ticketScore = calculateLoyaltyScore(singleTicket)
      const speakerScore = calculateLoyaltyScore(speakerParticipation)

      expect(speakerScore).toBeGreaterThan(ticketScore)
    })

    it('should add bonus for multiple events', () => {
      const singleEvent: ContactEventParticipation[] = [
        createParticipation({ eventId: 'evt1', editionId: 'ed1' }),
        createParticipation({ id: 'p2', eventId: 'evt1', editionId: 'ed2' })
      ]

      const multipleEvents: ContactEventParticipation[] = [
        createParticipation({ eventId: 'evt1', editionId: 'ed1' }),
        createParticipation({ id: 'p2', eventId: 'evt2', editionId: 'ed2' })
      ]

      const singleEventScore = calculateLoyaltyScore(singleEvent)
      const multipleEventsScore = calculateLoyaltyScore(multipleEvents)

      expect(multipleEventsScore).toBeGreaterThan(singleEventScore)
    })

    it('should add recency bonus for recent participation', () => {
      const recentParticipation: ContactEventParticipation[] = [
        createParticipation({ occurredAt: sixMonthsAgo })
      ]

      const oldParticipation: ContactEventParticipation[] = [
        createParticipation({ occurredAt: twoYearsAgo })
      ]

      const recentScore = calculateLoyaltyScore(recentParticipation)
      const oldScore = calculateLoyaltyScore(oldParticipation)

      expect(recentScore).toBeGreaterThan(oldScore)
    })
  })

  describe('getParticipationTypes', () => {
    it('should return unique participation types', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ participationType: 'ticket_purchased' }),
        createParticipation({ id: 'p2', participationType: 'checked_in' }),
        createParticipation({ id: 'p3', participationType: 'ticket_purchased' })
      ]

      const types = getParticipationTypes(participations)

      expect(types).toHaveLength(2)
      expect(types).toContain('ticket_purchased')
      expect(types).toContain('checked_in')
    })

    it('should return empty array for no participations', () => {
      expect(getParticipationTypes([])).toEqual([])
    })
  })

  describe('buildParticipationDescription', () => {
    const participation = createParticipation()

    it('should build description for ticket_purchased', () => {
      const desc = buildParticipationDescription(
        { ...participation, participationType: 'ticket_purchased' },
        'DevConf',
        'DevConf 2024'
      )
      expect(desc).toContain('Purchased Ticket')
      expect(desc).toContain('DevConf 2024')
    })

    it('should build description for checked_in', () => {
      const desc = buildParticipationDescription(
        { ...participation, participationType: 'checked_in' },
        'DevConf',
        'DevConf 2024'
      )
      expect(desc).toContain('Checked In')
      expect(desc).toContain('DevConf 2024')
    })

    it('should build description for speaker', () => {
      const desc = buildParticipationDescription(
        { ...participation, participationType: 'speaker' },
        'DevConf',
        'DevConf 2024'
      )
      expect(desc).toContain('Spoke at')
      expect(desc).toContain('DevConf 2024')
    })

    it('should build description for volunteer', () => {
      const desc = buildParticipationDescription(
        { ...participation, participationType: 'volunteer' },
        'DevConf',
        'DevConf 2024'
      )
      expect(desc).toContain('Volunteered at')
      expect(desc).toContain('DevConf 2024')
    })
  })

  describe('groupParticipationsByEdition', () => {
    it('should group participations by edition', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ editionId: 'ed1' }),
        createParticipation({ id: 'p2', editionId: 'ed1' }),
        createParticipation({ id: 'p3', editionId: 'ed2' })
      ]

      const grouped = groupParticipationsByEdition(participations)

      expect(grouped.size).toBe(2)
      expect(grouped.get('ed1')).toHaveLength(2)
      expect(grouped.get('ed2')).toHaveLength(1)
    })

    it('should return empty map for no participations', () => {
      const grouped = groupParticipationsByEdition([])
      expect(grouped.size).toBe(0)
    })
  })

  describe('sortParticipationsByDate', () => {
    it('should sort by date descending (most recent first)', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ id: 'p1', occurredAt: twoYearsAgo }),
        createParticipation({ id: 'p2', occurredAt: now }),
        createParticipation({ id: 'p3', occurredAt: sixMonthsAgo })
      ]

      const sorted = sortParticipationsByDate(participations)

      expect(sorted[0].id).toBe('p2')
      expect(sorted[1].id).toBe('p3')
      expect(sorted[2].id).toBe('p1')
    })

    it('should not mutate original array', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ id: 'p1', occurredAt: twoYearsAgo }),
        createParticipation({ id: 'p2', occurredAt: now })
      ]

      const sorted = sortParticipationsByDate(participations)

      expect(participations[0].id).toBe('p1')
      expect(sorted[0].id).toBe('p2')
    })
  })

  describe('buildCrossEventSummary', () => {
    const contact = {
      id: 'c1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }

    it('should build summary with contact info', () => {
      const summary = buildCrossEventSummary(contact, [])

      expect(summary.contactId).toBe('c1')
      expect(summary.email).toBe('john@example.com')
      expect(summary.firstName).toBe('John')
      expect(summary.lastName).toBe('Doe')
    })

    it('should calculate total events and editions', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ eventId: 'evt1', editionId: 'ed1' }),
        createParticipation({ id: 'p2', eventId: 'evt1', editionId: 'ed2' }),
        createParticipation({ id: 'p3', eventId: 'evt2', editionId: 'ed3' })
      ]

      const summary = buildCrossEventSummary(contact, participations)

      expect(summary.totalEvents).toBe(2)
      expect(summary.totalEditions).toBe(3)
    })

    it('should set first and last participation dates', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ id: 'p1', occurredAt: twoYearsAgo }),
        createParticipation({ id: 'p2', occurredAt: now }),
        createParticipation({ id: 'p3', occurredAt: sixMonthsAgo })
      ]

      const summary = buildCrossEventSummary(contact, participations)

      expect(summary.firstParticipation).toEqual(twoYearsAgo)
      expect(summary.lastParticipation).toEqual(now)
    })

    it('should return null dates for no participations', () => {
      const summary = buildCrossEventSummary(contact, [])

      expect(summary.firstParticipation).toBeNull()
      expect(summary.lastParticipation).toBeNull()
    })

    it('should include participation types', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ participationType: 'ticket_purchased' }),
        createParticipation({ id: 'p2', participationType: 'speaker' })
      ]

      const summary = buildCrossEventSummary(contact, participations)

      expect(summary.participationTypes).toContain('ticket_purchased')
      expect(summary.participationTypes).toContain('speaker')
    })

    it('should calculate loyalty score', () => {
      const participations: ContactEventParticipation[] = [
        createParticipation({ participationType: 'speaker' }),
        createParticipation({ id: 'p2', participationType: 'volunteer' })
      ]

      const summary = buildCrossEventSummary(contact, participations)

      expect(summary.loyaltyScore).toBeGreaterThan(0)
    })
  })

  describe('getLoyaltyLevel', () => {
    it('should return champion for score >= 100', () => {
      expect(getLoyaltyLevel(100)).toBe('champion')
      expect(getLoyaltyLevel(150)).toBe('champion')
    })

    it('should return loyal for score 50-99', () => {
      expect(getLoyaltyLevel(50)).toBe('loyal')
      expect(getLoyaltyLevel(99)).toBe('loyal')
    })

    it('should return returning for score 20-49', () => {
      expect(getLoyaltyLevel(20)).toBe('returning')
      expect(getLoyaltyLevel(49)).toBe('returning')
    })

    it('should return new for score < 20', () => {
      expect(getLoyaltyLevel(0)).toBe('new')
      expect(getLoyaltyLevel(19)).toBe('new')
    })
  })

  describe('PARTICIPATION_WEIGHTS', () => {
    it('should have higher weights for more engaged participation', () => {
      expect(PARTICIPATION_WEIGHTS.speaker).toBeGreaterThan(PARTICIPATION_WEIGHTS.ticket_purchased)
      expect(PARTICIPATION_WEIGHTS.volunteer).toBeGreaterThan(PARTICIPATION_WEIGHTS.registered)
      expect(PARTICIPATION_WEIGHTS.checked_in).toBeGreaterThan(
        PARTICIPATION_WEIGHTS.ticket_purchased
      )
    })
  })
})
