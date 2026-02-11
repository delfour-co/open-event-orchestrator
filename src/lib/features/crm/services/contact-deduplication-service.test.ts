import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createContactDeduplicationService } from './contact-deduplication-service'

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

describe('ContactDeduplicationService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createContactDeduplicationService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createContactDeduplicationService(pb)
  })

  describe('scanForDuplicates', () => {
    it('should scan contacts and find exact email duplicates', async () => {
      pb.collection('contacts').getFullList.mockResolvedValue([
        { id: 'c1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
        { id: 'c2', email: 'john@example.com', firstName: 'Jon', lastName: 'Doe' }
      ])

      pb.collection('duplicate_pairs').getList.mockResolvedValue({ items: [] })

      const result = await service.scanForDuplicates('evt-1')

      expect(result.scannedContacts).toBe(2)
      expect(result.duplicatesFound).toBe(1)
      expect(result.newPairs).toBe(1)
      expect(pb.collection('duplicate_pairs').create).toHaveBeenCalled()
    })

    it('should not create duplicate pairs for already existing pairs', async () => {
      pb.collection('contacts').getFullList.mockResolvedValue([
        { id: 'c1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
        { id: 'c2', email: 'john@example.com', firstName: 'Jon', lastName: 'Doe' }
      ])

      pb.collection('duplicate_pairs').getList.mockResolvedValue({
        items: [{ id: 'pair-1' }]
      })

      const result = await service.scanForDuplicates('evt-1')

      expect(result.duplicatesFound).toBe(1)
      expect(result.newPairs).toBe(0)
      expect(pb.collection('duplicate_pairs').create).not.toHaveBeenCalled()
    })

    it('should find similar name duplicates', async () => {
      pb.collection('contacts').getFullList.mockResolvedValue([
        { id: 'c1', email: 'john@company1.com', firstName: 'John', lastName: 'Doe' },
        { id: 'c2', email: 'jdoe@company2.com', firstName: 'John', lastName: 'Doe' }
      ])

      pb.collection('duplicate_pairs').getList.mockResolvedValue({ items: [] })

      const result = await service.scanForDuplicates('evt-1')

      expect(result.duplicatesFound).toBe(1)
    })
  })

  describe('getDuplicatePairs', () => {
    it('should return duplicate pairs for event', async () => {
      pb.collection('duplicate_pairs').getList.mockResolvedValue({
        items: [
          {
            id: 'pair-1',
            eventId: 'evt-1',
            contactId1: 'c1',
            contactId2: 'c2',
            matchType: 'exact_email',
            confidenceScore: 100,
            status: 'pending',
            created: now.toISOString(),
            updated: now.toISOString()
          }
        ],
        totalItems: 1
      })

      const result = await service.getDuplicatePairs('evt-1')

      expect(result.pairs).toHaveLength(1)
      expect(result.pairs[0].matchType).toBe('exact_email')
      expect(result.total).toBe(1)
    })

    it('should filter by status', async () => {
      await service.getDuplicatePairs('evt-1', { status: 'pending' })

      expect(pb.collection('duplicate_pairs').getList).toHaveBeenCalledWith(
        1,
        20,
        expect.objectContaining({
          filter: expect.stringContaining('pending')
        })
      )
    })

    it('should filter by minimum confidence', async () => {
      await service.getDuplicatePairs('evt-1', { minConfidence: 85 })

      expect(pb.collection('duplicate_pairs').getList).toHaveBeenCalledWith(
        1,
        20,
        expect.objectContaining({
          filter: expect.stringContaining('85')
        })
      )
    })
  })

  describe('getDuplicatePair', () => {
    it('should return a specific pair', async () => {
      pb.collection('duplicate_pairs').getOne.mockResolvedValue({
        id: 'pair-1',
        eventId: 'evt-1',
        contactId1: 'c1',
        contactId2: 'c2',
        matchType: 'exact_email',
        confidenceScore: 100,
        status: 'pending',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.getDuplicatePair('pair-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('pair-1')
    })

    it('should return null for non-existent pair', async () => {
      pb.collection('duplicate_pairs').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.getDuplicatePair('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('compareContacts', () => {
    it('should compare two contacts', async () => {
      pb.collection('contacts')
        .getOne.mockResolvedValueOnce({
          id: 'c1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          company: 'ACME'
        })
        .mockResolvedValueOnce({
          id: 'c2',
          email: 'john.doe@example.com',
          firstName: 'Jon',
          lastName: 'Doe',
          company: ''
        })

      const result = await service.compareContacts('c1', 'c2')

      expect(result.contactId1).toBe('c1')
      expect(result.contactId2).toBe('c2')
      expect(result.fields.length).toBeGreaterThan(0)

      const lastNameField = result.fields.find((f) => f.fieldName === 'lastName')
      expect(lastNameField?.similarity).toBe(100)
    })

    it('should throw error for non-existent contact', async () => {
      pb.collection('contacts').getOne.mockResolvedValueOnce({
        id: 'c1',
        email: 'john@example.com'
      })
      pb.collection('contacts').getOne.mockResolvedValueOnce(null)

      await expect(service.compareContacts('c1', 'c2')).rejects.toThrow()
    })
  })

  describe('mergeContacts', () => {
    it('should merge two contacts successfully', async () => {
      const survivor = {
        id: 'c1',
        eventId: 'evt-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        tags: ['vip'],
        segments: ['seg1']
      }

      const merged = {
        id: 'c2',
        eventId: 'evt-1',
        email: 'john.doe@example.com',
        firstName: 'Jonathan',
        lastName: 'Doe',
        tags: ['speaker'],
        segments: ['seg2']
      }

      pb.collection('contacts').getOne.mockResolvedValueOnce(survivor).mockResolvedValueOnce(merged)

      pb.collection('duplicate_pairs').getList.mockResolvedValue({ items: [] })

      const result = await service.mergeContacts(
        'c1',
        'c2',
        [
          { fieldName: 'email', source: 'contact1' },
          { fieldName: 'firstName', source: 'contact2' }
        ],
        'user-1'
      )

      expect(result.success).toBe(true)
      expect(result.mergedContactId).toBe('c1')
      expect(result.deletedContactId).toBe('c2')

      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          email: 'john@example.com',
          firstName: 'Jonathan',
          tags: expect.arrayContaining(['vip', 'speaker']),
          segments: expect.arrayContaining(['seg1', 'seg2'])
        })
      )

      expect(pb.collection('contact_merge_history').create).toHaveBeenCalled()
      expect(pb.collection('contacts').delete).toHaveBeenCalledWith('c2')
    })

    it('should return error for non-existent contacts', async () => {
      pb.collection('contacts').getOne.mockResolvedValue(null)

      const result = await service.mergeContacts('c1', 'c2', [], 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('undoMerge', () => {
    it('should undo a merge', async () => {
      pb.collection('contact_merge_history').getOne.mockResolvedValue({
        id: 'history-1',
        survivorContactId: 'c1',
        mergedContactId: 'c2',
        survivorData: { id: 'c1', email: 'old@example.com' },
        mergedData: { id: 'c2', email: 'merged@example.com' },
        mergeDecisions: [],
        undone: false
      })

      pb.collection('contacts').create.mockResolvedValue({ id: 'c2-new' })
      pb.collection('duplicate_pairs').getList.mockResolvedValue({ items: [] })

      const result = await service.undoMerge('history-1', 'user-1')

      expect(result.success).toBe(true)
      expect(pb.collection('contacts').create).toHaveBeenCalled()
      expect(pb.collection('contacts').update).toHaveBeenCalledWith('c1', expect.any(Object))
      expect(pb.collection('contact_merge_history').update).toHaveBeenCalledWith(
        'history-1',
        expect.objectContaining({
          undone: true,
          undoneBy: 'user-1'
        })
      )
    })

    it('should not undo already undone merge', async () => {
      pb.collection('contact_merge_history').getOne.mockResolvedValue({
        id: 'history-1',
        undone: true
      })

      const result = await service.undoMerge('history-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already been undone')
    })
  })

  describe('dismissDuplicate', () => {
    it('should dismiss a duplicate pair', async () => {
      await service.dismissDuplicate('pair-1', 'user-1')

      expect(pb.collection('duplicate_pairs').update).toHaveBeenCalledWith(
        'pair-1',
        expect.objectContaining({
          status: 'dismissed',
          dismissedBy: 'user-1'
        })
      )
    })
  })

  describe('bulkMergeExactDuplicates', () => {
    it('should merge all exact duplicates', async () => {
      pb.collection('duplicate_pairs').getList.mockResolvedValue({
        items: [
          {
            id: 'pair-1',
            contactId1: 'c1',
            contactId2: 'c2',
            confidenceScore: 100,
            status: 'pending',
            matchType: 'exact_email',
            created: now.toISOString(),
            updated: now.toISOString()
          }
        ],
        totalItems: 1
      })

      pb.collection('contacts')
        .getOne.mockResolvedValueOnce({
          id: 'c1',
          eventId: 'evt-1',
          email: 'john@example.com',
          firstName: 'John',
          tags: [],
          segments: []
        })
        .mockResolvedValueOnce({
          id: 'c2',
          eventId: 'evt-1',
          email: 'john@example.com',
          firstName: 'John',
          tags: [],
          segments: []
        })
        .mockResolvedValueOnce({
          id: 'c1',
          eventId: 'evt-1',
          email: 'john@example.com',
          firstName: 'John',
          tags: [],
          segments: []
        })
        .mockResolvedValueOnce({
          id: 'c2',
          eventId: 'evt-1',
          email: 'john@example.com',
          firstName: 'John',
          tags: [],
          segments: []
        })

      const result = await service.bulkMergeExactDuplicates('evt-1', 'user-1')

      expect(result.merged).toBe(1)
      expect(result.errors).toBe(0)
    })
  })
})
