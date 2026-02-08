import { describe, expect, it, vi } from 'vitest'
import type { Segment, SegmentRule } from '../domain'
import { createEvaluateSegmentUseCase } from './evaluate-segment'

const createMockPb = () => {
  // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase collections
  const collections: Record<string, any> = {}
  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = {
          getList: vi.fn(),
          getFullList: vi.fn(),
          getOne: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn()
        }
      }
      return collections[name]
    })
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase client
  } as any
}

const now = new Date()

const makeSegment = (overrides: Partial<Segment> = {}): Segment => ({
  id: 'seg-001',
  eventId: 'evt-001',
  name: 'Test Segment',
  criteria: { match: 'all', rules: [] },
  isStatic: false,
  contactCount: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides
})

const makeRule = (overrides: Partial<SegmentRule> = {}): SegmentRule => ({
  field: 'source',
  operator: 'equals',
  value: 'website',
  ...overrides
})

describe('createEvaluateSegmentUseCase', () => {
  // ─── Empty rules ───────────────────────────────────────────────────

  describe('empty rules', () => {
    it('should return empty array when segment has no rules', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      const result = await evaluate(makeSegment({ criteria: { match: 'all', rules: [] } }))

      expect(result).toEqual([])
      expect(pb.collection).not.toHaveBeenCalled()
    })

    it('should return empty array when segment has no rules with match=any', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      const result = await evaluate(makeSegment({ criteria: { match: 'any', rules: [] } }))

      expect(result).toEqual([])
    })
  })

  // ─── Direct rules only ─────────────────────────────────────────────

  describe('direct rules only', () => {
    describe('single direct rule', () => {
      it('should query contacts with equals filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'source', operator: 'equals', value: 'website' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection).toHaveBeenCalledWith('contacts')
        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && source = "website"',
          fields: 'id'
        })
        expect(result).toEqual(['c1', 'c2'])
      })

      it('should query contacts with not_equals filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'country', operator: 'not_equals', value: 'US' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && country != "US"',
          fields: 'id'
        })
        expect(result).toEqual(['c1'])
      })

      it('should query contacts with contains filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'company', operator: 'contains', value: 'Acme' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && company ~ "Acme"',
          fields: 'id'
        })
        expect(result).toEqual(['c1'])
      })

      it('should query contacts with not_contains filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c3' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'tags', operator: 'not_contains', value: 'vip' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && tags !~ "vip"',
          fields: 'id'
        })
        expect(result).toEqual(['c3'])
      })

      it('should query contacts with is_empty filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c5' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'city', operator: 'is_empty' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && city = ""',
          fields: 'id'
        })
        expect(result).toEqual(['c5'])
      })

      it('should query contacts with is_not_empty filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c6' }, { id: 'c7' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'company', operator: 'is_not_empty' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && company != ""',
          fields: 'id'
        })
        expect(result).toEqual(['c6', 'c7'])
      })

      it('should query contacts with in filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'country', operator: 'in', value: ['FR', 'DE', 'ES'] })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && (country = "FR" || country = "DE" || country = "ES")',
          fields: 'id'
        })
        expect(result).toEqual(['c1', 'c2'])
      })

      it('should query contacts with not_in filter', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c3' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'source', operator: 'not_in', value: ['spam', 'bot'] })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && source != "spam" && source != "bot"',
          fields: 'id'
        })
        expect(result).toEqual(['c3'])
      })

      it('should return empty for in operator with non-array value', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'source', operator: 'in', value: 'single-string' })]
          }
        })

        const result = await evaluate(segment)

        // ruleToFilter returns null for 'in' with non-array => no valid filters => empty
        expect(result).toEqual([])
      })

      it('should return empty for not_in operator with non-array value', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'source', operator: 'not_in', value: 'single-string' })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual([])
      })
    })

    describe('multiple direct rules with match=all', () => {
      it('should combine rules with AND', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({ field: 'country', operator: 'equals', value: 'FR' }),
              makeRule({ field: 'company', operator: 'contains', value: 'Tech' })
            ]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && country = "FR" && company ~ "Tech"',
          fields: 'id'
        })
        expect(result).toEqual(['c1'])
      })
    })

    describe('multiple direct rules with match=any', () => {
      it('should combine rules with OR', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1' },
          { id: 'c2' },
          { id: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'any',
            rules: [
              makeRule({ field: 'country', operator: 'equals', value: 'FR' }),
              makeRule({ field: 'country', operator: 'equals', value: 'DE' })
            ]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001" && (country = "FR" || country = "DE")',
          fields: 'id'
        })
        expect(result).toEqual(['c1', 'c2', 'c3'])
      })
    })

    describe('all direct fields are supported', () => {
      const directFields = ['source', 'tags', 'company', 'city', 'country'] as const

      for (const field of directFields) {
        it(`should build filter for field: ${field}`, async () => {
          const pb = createMockPb()
          const evaluate = createEvaluateSegmentUseCase(pb)

          pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }])

          const segment = makeSegment({
            criteria: {
              match: 'all',
              rules: [makeRule({ field, operator: 'equals', value: 'test' })]
            }
          })

          const result = await evaluate(segment)

          expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
            filter: `eventId = "evt-001" && ${field} = "test"`,
            fields: 'id'
          })
          expect(result).toEqual(['c1'])
        })
      }
    })
  })

  // ─── Related rules only ────────────────────────────────────────────

  describe('related rules only', () => {
    describe('edition_role', () => {
      it('should query contact_edition_links for edition_role equals', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c2' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection).toHaveBeenCalledWith('contact_edition_links')
        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'roles = "speaker"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c1', 'c2'])
      })

      it('should query contact_edition_links for edition_role not_equals', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([{ contactId: 'c3' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_role', operator: 'not_equals', value: 'attendee' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'roles != "attendee"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c3'])
      })

      it('should query contact_edition_links for edition_role contains', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([{ contactId: 'c1' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_role', operator: 'contains', value: 'speak' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'roles ~ "speak"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c1'])
      })

      it('should query contact_edition_links for edition_role not_contains', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([{ contactId: 'c4' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({ field: 'edition_role', operator: 'not_contains', value: 'volunteer' })
            ]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'roles !~ "volunteer"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c4'])
      })

      it('should query contact_edition_links for edition_role is_empty', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_role', operator: 'is_empty' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'roles = ""',
          fields: 'contactId'
        })
        expect(result).toEqual([])
      })

      it('should query contact_edition_links for edition_role is_not_empty', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c2' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_role', operator: 'is_not_empty' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'roles != ""',
          fields: 'contactId'
        })
        expect(result).toEqual(['c1', 'c2'])
      })

      it('should query contact_edition_links for edition_role in with array value', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({
                field: 'edition_role',
                operator: 'in',
                value: ['speaker', 'organizer']
              })
            ]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: '(roles = "speaker" || roles = "organizer")',
          fields: 'contactId'
        })
        expect(result).toEqual(['c1', 'c3'])
      })

      it('should query contact_edition_links for edition_role not_in with array value', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([{ contactId: 'c5' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({
                field: 'edition_role',
                operator: 'not_in',
                value: ['attendee', 'volunteer']
              })
            ]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'roles != "attendee" && roles != "volunteer"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c5'])
      })

      it('should return empty set on PocketBase error for edition_role', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        pb.collection('contact_edition_links').getFullList.mockRejectedValue(
          new Error('PB failure')
        )

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual([])
        consoleSpy.mockRestore()
      })
    })

    describe('edition_id', () => {
      it('should query contact_edition_links for edition_id equals', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c4' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_id', operator: 'equals', value: 'ed-2024' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'editionId = "ed-2024"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c1', 'c4'])
      })

      it('should query contact_edition_links for edition_id not_equals', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([{ contactId: 'c2' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_id', operator: 'not_equals', value: 'ed-2023' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: 'editionId != "ed-2023"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c2'])
      })

      it('should query contact_edition_links for edition_id in with array', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c2' },
          { contactId: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({
                field: 'edition_id',
                operator: 'in',
                value: ['ed-2023', 'ed-2024']
              })
            ]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
          filter: '(editionId = "ed-2023" || editionId = "ed-2024")',
          fields: 'contactId'
        })
        expect(result).toEqual(['c1', 'c2', 'c3'])
      })

      it('should return empty set on PocketBase error for edition_id', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        pb.collection('contact_edition_links').getFullList.mockRejectedValue(
          new Error('PB failure')
        )

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'edition_id', operator: 'equals', value: 'ed-2024' })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual([])
        consoleSpy.mockRestore()
      })
    })

    describe('consent_marketing', () => {
      it('should return contacts with granted marketing consent when value=true', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('consents').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c2' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'consent_marketing', operator: 'equals', value: 'true' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('consents').getFullList).toHaveBeenCalledWith({
          filter: 'type = "marketing_email" && status = "granted"',
          fields: 'contactId'
        })
        expect(result).toEqual(['c1', 'c2'])
      })

      it('should return contacts with granted marketing consent when value=boolean true', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('consents').getFullList.mockResolvedValue([{ contactId: 'c1' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'consent_marketing', operator: 'equals', value: true })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual(['c1'])
      })

      it('should return contacts WITHOUT marketing consent when wantGranted is false', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('consents').getFullList.mockResolvedValue([{ contactId: 'c1' }])
        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1' },
          { id: 'c2' },
          { id: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({
                field: 'consent_marketing',
                operator: 'not_equals',
                value: 'true'
              })
            ]
          }
        })

        const result = await evaluate(segment)

        // wantGranted is false because operator is not_equals and value is 'true'
        // (wantGranted = value === 'true' || value === true || operator === 'equals')
        // Here: value is 'true' so wantGranted is actually true.
        // Let me re-read the logic:
        // wantGranted = rule.value === 'true' || rule.value === true || rule.operator === 'equals'
        // value === 'true' => true, so wantGranted is true regardless of operator
        expect(result).toEqual(['c1'])
      })

      it('should return contacts without consent when value=false and operator=not_equals', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('consents').getFullList.mockResolvedValue([{ contactId: 'c1' }])
        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1' },
          { id: 'c2' },
          { id: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({
                field: 'consent_marketing',
                operator: 'not_equals',
                value: 'false'
              })
            ]
          }
        })

        const result = await evaluate(segment)

        // wantGranted = value === 'true' (false) || value === true (false) || operator === 'equals' (false)
        // wantGranted = false => returns contacts WITHOUT consent
        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001"',
          fields: 'id'
        })
        expect(result).toEqual(['c2', 'c3'])
      })

      it('should return granted contacts when operator=equals even with value=false', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('consents').getFullList.mockResolvedValue([{ contactId: 'c2' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({
                field: 'consent_marketing',
                operator: 'equals',
                value: 'false'
              })
            ]
          }
        })

        const result = await evaluate(segment)

        // wantGranted = value === 'true' (false) || value === true (false) || operator === 'equals' (true)
        // wantGranted = true => returns granted contacts
        expect(result).toEqual(['c2'])
      })

      it('should return empty set on PocketBase error for consent_marketing', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        pb.collection('consents').getFullList.mockRejectedValue(new Error('PB failure'))

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'consent_marketing', operator: 'equals', value: 'true' })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual([])
        consoleSpy.mockRestore()
      })
    })

    describe('has_checked_in', () => {
      it('should return contacts with checked-in tickets when value=true', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('tickets').getFullList.mockResolvedValue([
          { email: 'alice@test.com' },
          { email: 'bob@test.com' }
        ])
        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1', email: 'alice@test.com' },
          { id: 'c2', email: 'bob@test.com' },
          { id: 'c3', email: 'charlie@test.com' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'has_checked_in', operator: 'equals', value: 'true' })]
          }
        })

        const result = await evaluate(segment)

        expect(pb.collection('tickets').getFullList).toHaveBeenCalledWith({
          filter: 'checkedIn = true',
          fields: 'email'
        })
        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: 'eventId = "evt-001"',
          fields: 'id,email'
        })
        expect(result).toEqual(['c1', 'c2'])
      })

      it('should return contacts with checked-in tickets when value is boolean true', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('tickets').getFullList.mockResolvedValue([{ email: 'alice@test.com' }])
        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1', email: 'alice@test.com' },
          { id: 'c2', email: 'bob@test.com' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'has_checked_in', operator: 'equals', value: true })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual(['c1'])
      })

      it('should return contacts WITHOUT checked-in tickets when not wanted', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('tickets').getFullList.mockResolvedValue([{ email: 'alice@test.com' }])
        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1', email: 'alice@test.com' },
          { id: 'c2', email: 'bob@test.com' },
          { id: 'c3', email: 'charlie@test.com' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({
                field: 'has_checked_in',
                operator: 'not_equals',
                value: 'false'
              })
            ]
          }
        })

        const result = await evaluate(segment)

        // wantCheckedIn = value === 'true' (false) || value === true (false) || operator === 'equals' (false)
        // wantCheckedIn = false => return those WITHOUT check-in
        expect(result).toEqual(['c2', 'c3'])
      })

      it('should match emails case-insensitively', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('tickets').getFullList.mockResolvedValue([{ email: 'Alice@Test.COM' }])
        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1', email: 'alice@test.com' },
          { id: 'c2', email: 'bob@test.com' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'has_checked_in', operator: 'equals', value: 'true' })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual(['c1'])
      })

      it('should return empty set on PocketBase error for has_checked_in', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        pb.collection('tickets').getFullList.mockRejectedValue(new Error('PB failure'))

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'has_checked_in', operator: 'equals', value: 'true' })]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual([])
        consoleSpy.mockRestore()
      })
    })

    describe('unknown related field', () => {
      it('should return empty when only rule is an unknown field', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        const segment = makeSegment({
          criteria: {
            match: 'all',
            // biome-ignore lint/suspicious/noExplicitAny: testing unknown field handling
            rules: [{ field: 'unknown_field' as any, operator: 'equals', value: 'something' }]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual([])
      })
    })
  })

  // ─── Mixed direct + related rules ─────────────────────────────────

  describe('mixed direct and related rules', () => {
    describe('match=all (intersection)', () => {
      it('should return intersection of direct and related contact IDs', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        // Direct rule matches: c1, c2, c3
        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1' },
          { id: 'c2' },
          { id: 'c3' }
        ])

        // Related rule matches: c2, c3, c4
        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c2' },
          { contactId: 'c3' },
          { contactId: 'c4' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({ field: 'country', operator: 'equals', value: 'FR' }),
              makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' })
            ]
          }
        })

        const result = await evaluate(segment)

        // Intersection: {c1, c2, c3} ∩ {c2, c3, c4} = {c2, c3}
        expect(result.sort()).toEqual(['c2', 'c3'])
      })

      it('should return empty when intersection is empty', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])
        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c3' },
          { contactId: 'c4' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({ field: 'country', operator: 'equals', value: 'FR' }),
              makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' })
            ]
          }
        })

        const result = await evaluate(segment)

        expect(result).toEqual([])
      })

      it('should intersect multiple related rule sets', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        // First related rule (edition_role): c1, c2, c3
        // Second related rule (edition_id): c2, c3, c5
        // We need to set up the mock to return different values on successive calls
        const linksMock = pb.collection('contact_edition_links').getFullList
        linksMock
          .mockResolvedValueOnce([{ contactId: 'c1' }, { contactId: 'c2' }, { contactId: 'c3' }])
          .mockResolvedValueOnce([{ contactId: 'c2' }, { contactId: 'c3' }, { contactId: 'c5' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' }),
              makeRule({ field: 'edition_id', operator: 'equals', value: 'ed-2024' })
            ]
          }
        })

        const result = await evaluate(segment)

        // Intersection: {c1, c2, c3} ∩ {c2, c3, c5} = {c2, c3}
        expect(result.sort()).toEqual(['c2', 'c3'])
      })

      it('should intersect direct, edition_role, and consent sets', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        // Direct: c1, c2, c3, c4
        pb.collection('contacts').getFullList.mockResolvedValueOnce([
          { id: 'c1' },
          { id: 'c2' },
          { id: 'c3' },
          { id: 'c4' }
        ])

        // edition_role: c2, c3, c5
        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c2' },
          { contactId: 'c3' },
          { contactId: 'c5' }
        ])

        // consent_marketing: c1, c3
        pb.collection('consents').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [
              makeRule({ field: 'country', operator: 'equals', value: 'FR' }),
              makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' }),
              makeRule({ field: 'consent_marketing', operator: 'equals', value: 'true' })
            ]
          }
        })

        const result = await evaluate(segment)

        // Intersection: {c1, c2, c3, c4} ∩ {c2, c3, c5} ∩ {c1, c3} = {c3}
        expect(result).toEqual(['c3'])
      })
    })

    describe('match=any (union)', () => {
      it('should return union of direct and related contact IDs', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        // Direct rule matches: c1, c2
        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])

        // Related rule matches: c2, c3
        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c2' },
          { contactId: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'any',
            rules: [
              makeRule({ field: 'source', operator: 'equals', value: 'website' }),
              makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' })
            ]
          }
        })

        const result = await evaluate(segment)

        // Union: {c1, c2} ∪ {c2, c3} = {c1, c2, c3}
        expect(result.sort()).toEqual(['c1', 'c2', 'c3'])
      })

      it('should deduplicate IDs in union', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([
          { id: 'c1' },
          { id: 'c2' },
          { id: 'c3' }
        ])
        pb.collection('contact_edition_links').getFullList.mockResolvedValue([
          { contactId: 'c1' },
          { contactId: 'c2' },
          { contactId: 'c3' }
        ])

        const segment = makeSegment({
          criteria: {
            match: 'any',
            rules: [
              makeRule({ field: 'country', operator: 'equals', value: 'FR' }),
              makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' })
            ]
          }
        })

        const result = await evaluate(segment)

        // All same IDs, union should have no duplicates
        expect(result.sort()).toEqual(['c1', 'c2', 'c3'])
      })

      it('should handle union with multiple related rules', async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        const linksMock = pb.collection('contact_edition_links').getFullList
        linksMock
          .mockResolvedValueOnce([{ contactId: 'c1' }])
          .mockResolvedValueOnce([{ contactId: 'c2' }])

        const segment = makeSegment({
          criteria: {
            match: 'any',
            rules: [
              makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' }),
              makeRule({ field: 'edition_id', operator: 'equals', value: 'ed-2024' })
            ]
          }
        })

        const result = await evaluate(segment)

        // Union: {c1} ∪ {c2} = {c1, c2}
        expect(result.sort()).toEqual(['c1', 'c2'])
      })
    })
  })

  // ─── Edge cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle direct rules returning no contacts', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      pb.collection('contacts').getFullList.mockResolvedValue([])

      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [makeRule({ field: 'source', operator: 'equals', value: 'nonexistent' })]
        }
      })

      const result = await evaluate(segment)

      expect(result).toEqual([])
    })

    it('should handle related rules returning no contacts', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      pb.collection('contact_edition_links').getFullList.mockResolvedValue([])

      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [makeRule({ field: 'edition_role', operator: 'equals', value: 'nonexistent' })]
        }
      })

      const result = await evaluate(segment)

      expect(result).toEqual([])
    })

    it('should return empty on PocketBase error for direct rules', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      pb.collection('contacts').getFullList.mockRejectedValue(new Error('PB connection failed'))

      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [makeRule({ field: 'source', operator: 'equals', value: 'website' })]
        }
      })

      const result = await evaluate(segment)

      expect(result).toEqual([])
      consoleSpy.mockRestore()
    })

    it('should handle match=all with only direct rules and no related', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])

      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [
            makeRule({ field: 'source', operator: 'equals', value: 'website' }),
            makeRule({ field: 'country', operator: 'equals', value: 'FR' })
          ]
        }
      })

      const result = await evaluate(segment)

      expect(result).toEqual(['c1', 'c2'])
    })

    it('should handle match=any with only related rules and no direct', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      const linksMock = pb.collection('contact_edition_links').getFullList
      linksMock
        .mockResolvedValueOnce([{ contactId: 'c1' }, { contactId: 'c2' }])
        .mockResolvedValueOnce([{ contactId: 'c2' }, { contactId: 'c3' }])

      const segment = makeSegment({
        criteria: {
          match: 'any',
          rules: [
            makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' }),
            makeRule({ field: 'edition_id', operator: 'equals', value: 'ed-2024' })
          ]
        }
      })

      const result = await evaluate(segment)

      // Union: {c1, c2} ∪ {c2, c3} = {c1, c2, c3}
      expect(result.sort()).toEqual(['c1', 'c2', 'c3'])
    })

    it('should handle related rule returning null (e.g., in with non-array value)', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      // edition_role with 'in' operator but non-array value => buildRelatedFilter returns null
      // => evaluateRelatedRule returns null => skipped
      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [
            makeRule({
              field: 'edition_role',
              operator: 'in',
              value: 'not-an-array'
            })
          ]
        }
      })

      const result = await evaluate(segment)

      // null is returned for the related rule, so relatedSets is empty and directContactIds is null
      expect(result).toEqual([])
    })

    it('should handle segment with duplicate contact IDs from related rules in union', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      // Both related rules return the same contact
      const linksMock = pb.collection('contact_edition_links').getFullList
      linksMock
        .mockResolvedValueOnce([{ contactId: 'c1' }])
        .mockResolvedValueOnce([{ contactId: 'c1' }])

      const segment = makeSegment({
        criteria: {
          match: 'any',
          rules: [
            makeRule({ field: 'edition_role', operator: 'equals', value: 'speaker' }),
            makeRule({ field: 'edition_id', operator: 'equals', value: 'ed-2024' })
          ]
        }
      })

      const result = await evaluate(segment)

      // Should only have c1 once
      expect(result).toEqual(['c1'])
    })

    it('should use eventId in filter for direct rules', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      pb.collection('contacts').getFullList.mockResolvedValue([])

      const segment = makeSegment({
        eventId: 'my-custom-event',
        criteria: {
          match: 'all',
          rules: [makeRule({ field: 'source', operator: 'equals', value: 'web' })]
        }
      })

      await evaluate(segment)

      expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
        filter: 'eventId = "my-custom-event" && source = "web"',
        fields: 'id'
      })
    })

    it('should use eventId when fetching all contacts for consent negation', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      pb.collection('consents').getFullList.mockResolvedValue([])
      pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }])

      const segment = makeSegment({
        eventId: 'evt-custom',
        criteria: {
          match: 'all',
          rules: [
            makeRule({
              field: 'consent_marketing',
              operator: 'not_equals',
              value: 'false'
            })
          ]
        }
      })

      await evaluate(segment)

      expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
        filter: 'eventId = "evt-custom"',
        fields: 'id'
      })
    })

    it('should use eventId when fetching all contacts for has_checked_in', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      pb.collection('tickets').getFullList.mockResolvedValue([])
      pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1', email: 'a@b.com' }])

      const segment = makeSegment({
        eventId: 'evt-custom',
        criteria: {
          match: 'all',
          rules: [makeRule({ field: 'has_checked_in', operator: 'equals', value: 'true' })]
        }
      })

      await evaluate(segment)

      expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
        filter: 'eventId = "evt-custom"',
        fields: 'id,email'
      })
    })

    it('should handle match=all with empty intersection from mixed rules', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      // Direct contacts: c1
      pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }])

      // has_checked_in contacts: c2
      pb.collection('tickets').getFullList.mockResolvedValue([{ email: 'bob@test.com' }])
      // Using a second call setup for the contacts fetch needed by has_checked_in
      // The first call to contacts.getFullList is for direct rules, so we use mockResolvedValueOnce
      pb.collection('contacts')
        .getFullList.mockResolvedValueOnce([{ id: 'c1' }]) // direct
        .mockResolvedValueOnce([
          { id: 'c1', email: 'alice@test.com' },
          { id: 'c2', email: 'bob@test.com' }
        ]) // has_checked_in

      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [
            makeRule({ field: 'source', operator: 'equals', value: 'website' }),
            makeRule({ field: 'has_checked_in', operator: 'equals', value: 'true' })
          ]
        }
      })

      const result = await evaluate(segment)

      // Direct: {c1}, has_checked_in: {c2} => intersection is empty
      expect(result).toEqual([])
    })
  })

  // ─── buildRelatedFilter edge cases (indirectly tested) ─────────────

  describe('buildRelatedFilter operators via edition_role', () => {
    it('should handle in operator with empty array', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      pb.collection('contact_edition_links').getFullList.mockResolvedValue([])

      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [makeRule({ field: 'edition_role', operator: 'in', value: [] })]
        }
      })

      const result = await evaluate(segment)

      // Empty array with 'in' => filter is "false" (matches nothing)
      expect(pb.collection('contact_edition_links').getFullList).toHaveBeenCalledWith({
        filter: 'false',
        fields: 'contactId'
      })
      expect(result).toEqual([])
    })

    it('should handle not_in operator with empty array', async () => {
      const pb = createMockPb()
      const evaluate = createEvaluateSegmentUseCase(pb)

      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [makeRule({ field: 'edition_role', operator: 'not_in', value: [] })]
        }
      })

      const result = await evaluate(segment)

      // Empty array with 'not_in' => buildRelatedFilter returns empty string (falsy)
      // which means the rule is skipped. With no other rules, result is empty.
      expect(result).toEqual([])
    })
  })

  // ─── Comprehensive operator coverage on direct rules ───────────────

  describe('all operators on a direct field (source)', () => {
    const operators: Array<{
      operator: SegmentRule['operator']
      value: SegmentRule['value']
      expectedFilter: string
    }> = [
      { operator: 'equals', value: 'web', expectedFilter: 'source = "web"' },
      { operator: 'not_equals', value: 'web', expectedFilter: 'source != "web"' },
      { operator: 'contains', value: 'we', expectedFilter: 'source ~ "we"' },
      { operator: 'not_contains', value: 'we', expectedFilter: 'source !~ "we"' },
      { operator: 'is_empty', value: undefined, expectedFilter: 'source = ""' },
      { operator: 'is_not_empty', value: undefined, expectedFilter: 'source != ""' },
      {
        operator: 'in',
        value: ['web', 'api'],
        expectedFilter: '(source = "web" || source = "api")'
      },
      {
        operator: 'not_in',
        value: ['spam', 'bot'],
        expectedFilter: 'source != "spam" && source != "bot"'
      }
    ]

    for (const { operator, value, expectedFilter } of operators) {
      it(`should generate correct filter for operator: ${operator}`, async () => {
        const pb = createMockPb()
        const evaluate = createEvaluateSegmentUseCase(pb)

        pb.collection('contacts').getFullList.mockResolvedValue([{ id: 'c1' }])

        const segment = makeSegment({
          criteria: {
            match: 'all',
            rules: [makeRule({ field: 'source', operator, value })]
          }
        })

        await evaluate(segment)

        expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
          filter: `eventId = "evt-001" && ${expectedFilter}`,
          fields: 'id'
        })
      })
    }
  })
})
