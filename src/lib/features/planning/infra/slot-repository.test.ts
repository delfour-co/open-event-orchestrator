import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSlotRepository } from './slot-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...parts: string[]) => parts.join(' && '),
  filterContains: (field: string, value: string) => `${field} ~ "${value}"`
}))

vi.mock('../domain', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    slotsOverlap: vi.fn()
  }
})

import { slotsOverlap } from '../domain'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeSlotRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'slot1',
  editionId: 'ed1',
  roomId: 'room1',
  date: '2024-06-15T00:00:00Z',
  startTime: '09:00',
  endTime: '10:00',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('SlotRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.mocked(slotsOverlap).mockReset()
  })

  describe('findById', () => {
    it('should return slot when found', async () => {
      const record = makeSlotRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('slot1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('slot1')
      expect(result?.startTime).toBe('09:00')
      expect(result?.endTime).toBe('10:00')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should map date field to Date object', async () => {
      const record = makeSlotRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('slot1')

      expect(result?.date).toEqual(new Date('2024-06-15T00:00:00Z'))
    })
  })

  describe('findByEdition', () => {
    it('should return slots sorted by date and startTime', async () => {
      const records = [
        makeSlotRecord({ id: 'slot1', startTime: '09:00' }),
        makeSlotRecord({ id: 'slot2', startTime: '10:00' })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'date,startTime' })
      )
    })

    it('should return empty array when no slots', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByRoom', () => {
    it('should return slots filtered by roomId', async () => {
      const records = [makeSlotRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByRoom('room1')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('room1'),
          sort: 'date,startTime'
        })
      )
    })

    it('should return empty array when room has no slots', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByRoom('room-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByDate', () => {
    it('should return slots for specific date and edition', async () => {
      const records = [makeSlotRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByDate('ed1', new Date('2024-06-15'))

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: 'startTime' }))
    })

    it('should return empty array when no slots for date', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByDate('ed1', new Date('2024-12-25'))

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a slot and map the result', async () => {
      const record = makeSlotRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        roomId: 'room1',
        date: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(mockPb._mockCollection).toHaveBeenCalledWith('slots')
      expect(result.id).toBe('slot1')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'ed1',
          roomId: 'room1',
          startTime: '09:00',
          endTime: '10:00'
        })
      )
    })

    it('should serialize date to ISO string', async () => {
      const record = makeSlotRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const date = new Date('2024-06-15T00:00:00Z')
      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        roomId: 'room1',
        date,
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ date: date.toISOString() }))
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeSlotRecord({ startTime: '10:00' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'slot1', startTime: '10:00' })

      expect(mockUpdate).toHaveBeenCalledWith('slot1', { startTime: '10:00' })
      expect(result.startTime).toBe('10:00')
    })

    it('should serialize date to ISO string when updating', async () => {
      const record = makeSlotRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const date = new Date('2024-06-20T00:00:00Z')
      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'slot1', date })

      expect(mockUpdate).toHaveBeenCalledWith('slot1', { date: date.toISOString() })
    })

    it('should not include undefined fields in update data', async () => {
      const record = makeSlotRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'slot1', endTime: '11:00' })

      expect(mockUpdate).toHaveBeenCalledWith('slot1', { endTime: '11:00' })
    })
  })

  describe('delete', () => {
    it('should delete slot by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      await repo.delete('slot1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('slots')
      expect(mockDelete).toHaveBeenCalledWith('slot1')
    })
  })

  describe('checkOverlap', () => {
    it('should return null when no overlap found', async () => {
      const records = [makeSlotRecord({ id: 'other-slot' })]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })
      vi.mocked(slotsOverlap).mockReturnValue(false)

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.checkOverlap({
        editionId: 'ed1',
        roomId: 'room1',
        date: new Date('2024-06-15'),
        startTime: '11:00',
        endTime: '12:00',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(result).toBeNull()
    })

    it('should return overlapping slot when found', async () => {
      const existingRecord = makeSlotRecord({ id: 'other-slot' })
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([existingRecord])
      })
      vi.mocked(slotsOverlap).mockReturnValue(true)

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.checkOverlap({
        editionId: 'ed1',
        roomId: 'room1',
        date: new Date('2024-06-15'),
        startTime: '09:30',
        endTime: '10:30',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(result).not.toBeNull()
      expect(result?.id).toBe('other-slot')
    })

    it('should skip self when checking overlap with id', async () => {
      const records = [makeSlotRecord({ id: 'slot1' })]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createSlotRepository(mockPb as unknown as PocketBase)
      const result = await repo.checkOverlap({
        id: 'slot1',
        editionId: 'ed1',
        roomId: 'room1',
        date: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '10:00',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(result).toBeNull()
      expect(slotsOverlap).not.toHaveBeenCalled()
    })
  })
})
