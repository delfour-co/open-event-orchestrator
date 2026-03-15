import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSessionRepository } from './session-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...parts: string[]) => parts.join(' && ')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeSessionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'sess1',
  editionId: 'ed1',
  slotId: 'slot1',
  talkId: 'talk1',
  trackId: 'track1',
  title: 'Session Title',
  description: 'Session description',
  type: 'talk',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('SessionRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return session when found', async () => {
      const record = makeSessionRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('sess1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('sess1')
      expect(result?.title).toBe('Session Title')
      expect(result?.type).toBe('talk')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should default type to talk when empty', async () => {
      const record = makeSessionRecord({ type: '' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('sess1')

      expect(result?.type).toBe('talk')
    })
  })

  describe('findByEdition', () => {
    it('should return sessions filtered by editionId', async () => {
      const records = [makeSessionRecord({ id: 'sess1' }), makeSessionRecord({ id: 'sess2' })]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
    })

    it('should return empty array when no sessions', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed-empty')

      expect(result).toEqual([])
    })
  })

  describe('findBySlot', () => {
    it('should return session when found by slotId', async () => {
      const record = makeSessionRecord()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue(record)
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlot('slot1')

      expect(result).not.toBeNull()
      expect(result?.slotId).toBe('slot1')
    })

    it('should return null when slot has no session', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlot('slot-empty')

      expect(result).toBeNull()
    })
  })

  describe('findByTalk', () => {
    it('should return session when found by talkId', async () => {
      const record = makeSessionRecord()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue(record)
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByTalk('talk1')

      expect(result).not.toBeNull()
      expect(result?.talkId).toBe('talk1')
    })

    it('should return null when talk has no session', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByTalk('talk-none')

      expect(result).toBeNull()
    })
  })

  describe('findByTrack', () => {
    it('should return sessions filtered by trackId', async () => {
      const records = [makeSessionRecord({ id: 'sess1' })]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByTrack('track1')

      expect(result).toHaveLength(1)
    })

    it('should return empty array when no sessions for track', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByTrack('track-empty')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a session and map the result', async () => {
      const record = makeSessionRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        slotId: 'slot1',
        talkId: 'talk1',
        trackId: 'track1',
        title: 'Session Title',
        description: 'Session description',
        type: 'talk'
      })

      expect(mockPb._mockCollection).toHaveBeenCalledWith('sessions')
      expect(result.id).toBe('sess1')
      expect(result.title).toBe('Session Title')
    })

    it('should default type to talk when not provided', async () => {
      const record = makeSessionRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        slotId: 'slot1',
        title: 'Title'
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ type: 'talk' }))
    })

    it('should set talkId and trackId to null when not provided', async () => {
      const record = makeSessionRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        slotId: 'slot1',
        title: 'Title'
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ talkId: null, trackId: null })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeSessionRecord({ title: 'Updated' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'sess1', title: 'Updated' })

      expect(mockUpdate).toHaveBeenCalledWith('sess1', { title: 'Updated' })
      expect(result.title).toBe('Updated')
    })

    it('should set talkId to null when empty string provided', async () => {
      const record = makeSessionRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'sess1', talkId: '' })

      expect(mockUpdate).toHaveBeenCalledWith('sess1', { talkId: null })
    })

    it('should not include undefined fields in update data', async () => {
      const record = makeSessionRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'sess1', type: 'keynote' as never })

      expect(mockUpdate).toHaveBeenCalledWith('sess1', { type: 'keynote' })
    })
  })

  describe('delete', () => {
    it('should delete session by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      await repo.delete('sess1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('sessions')
      expect(mockDelete).toHaveBeenCalledWith('sess1')
    })
  })

  describe('isSlotOccupied', () => {
    it('should return true when slot has a session', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [makeSessionRecord()] })
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.isSlotOccupied('slot1')

      expect(result).toBe(true)
    })

    it('should return false when slot is empty', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [] })
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.isSlotOccupied('slot-empty')

      expect(result).toBe(false)
    })

    it('should exclude a session by id when checking', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      await repo.isSlotOccupied('slot1', 'sess1')

      expect(mockGetList).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({
          filter: expect.stringContaining('sess1')
        })
      )
    })

    it('should return false on error', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockRejectedValue(new Error('Error'))
      })

      const repo = createSessionRepository(mockPb as unknown as PocketBase)
      const result = await repo.isSlotOccupied('slot1')

      expect(result).toBe(false)
    })
  })
})
