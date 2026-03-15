import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoomAssignmentRepository } from './room-assignment-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeAssignmentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'assign1',
  editionId: 'ed1',
  roomId: 'room1',
  memberId: 'member1',
  date: '2024-06-15T00:00:00Z',
  startTime: '09:00',
  endTime: '17:00',
  notes: 'Morning shift',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('RoomAssignmentRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return assignment when found', async () => {
      const record = makeAssignmentRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('assign1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('assign1')
      expect(result?.roomId).toBe('room1')
      expect(result?.memberId).toBe('member1')
      expect(result?.notes).toBe('Morning shift')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should map date field to Date when present', async () => {
      const record = makeAssignmentRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('assign1')

      expect(result?.date).toEqual(new Date('2024-06-15T00:00:00Z'))
    })

    it('should set date to undefined when not present', async () => {
      const record = makeAssignmentRecord({ date: null })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('assign1')

      expect(result?.date).toBeUndefined()
    })
  })

  describe('findByEdition', () => {
    it('should return assignments filtered by editionId', async () => {
      const records = [
        makeAssignmentRecord({ id: 'assign1' }),
        makeAssignmentRecord({ id: 'assign2' })
      ]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
    })

    it('should return empty array when no assignments', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByRoom', () => {
    it('should return assignments filtered by roomId', async () => {
      const records = [makeAssignmentRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByRoom('room1')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('room1')
        })
      )
    })

    it('should return empty array when room has no assignments', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByRoom('room-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByMember', () => {
    it('should return assignments filtered by memberId', async () => {
      const records = [makeAssignmentRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByMember('member1')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('member1')
        })
      )
    })

    it('should return empty array when member has no assignments', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByMember('member-empty')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create an assignment and map the result', async () => {
      const record = makeAssignmentRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        roomId: 'room1',
        memberId: 'member1',
        date: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '17:00',
        notes: 'Morning shift'
      })

      expect(mockPb._mockCollection).toHaveBeenCalledWith('room_assignments')
      expect(result.id).toBe('assign1')
    })

    it('should set optional fields to null when not provided', async () => {
      const record = makeAssignmentRecord({
        date: null,
        startTime: null,
        endTime: null,
        notes: null
      })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        roomId: 'room1',
        memberId: 'member1'
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          date: null,
          startTime: null,
          endTime: null,
          notes: null
        })
      )
    })

    it('should serialize date to ISO string when provided', async () => {
      const record = makeAssignmentRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const date = new Date('2024-06-15T00:00:00Z')
      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        roomId: 'room1',
        memberId: 'member1',
        date
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ date: date.toISOString() }))
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeAssignmentRecord({ notes: 'Updated notes' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'assign1', notes: 'Updated notes' })

      expect(mockUpdate).toHaveBeenCalledWith('assign1', { notes: 'Updated notes' })
      expect(result.notes).toBe('Updated notes')
    })

    it('should set empty string notes to null', async () => {
      const record = makeAssignmentRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'assign1', notes: '' })

      expect(mockUpdate).toHaveBeenCalledWith('assign1', { notes: null })
    })

    it('should serialize date in update when provided', async () => {
      const record = makeAssignmentRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const date = new Date('2024-07-01T00:00:00Z')
      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'assign1', date })

      expect(mockUpdate).toHaveBeenCalledWith('assign1', { date: date.toISOString() })
    })
  })

  describe('delete', () => {
    it('should delete assignment by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createRoomAssignmentRepository(mockPb as unknown as PocketBase)
      await repo.delete('assign1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('room_assignments')
      expect(mockDelete).toHaveBeenCalledWith('assign1')
    })
  })
})
