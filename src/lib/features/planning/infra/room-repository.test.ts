import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoomRepository } from './room-repository'

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

const makeRoomRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'room1',
  editionId: 'ed1',
  name: 'Main Hall',
  capacity: 200,
  floor: '1st',
  description: 'Large conference room',
  equipment: ['projector', 'microphone'],
  equipmentNotes: 'Bring adapters',
  order: 1,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('RoomRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return room when found', async () => {
      const record = makeRoomRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('room1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('room1')
      expect(result?.name).toBe('Main Hall')
      expect(result?.capacity).toBe(200)
      expect(result?.equipment).toEqual(['projector', 'microphone'])
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should map dates correctly', async () => {
      const record = makeRoomRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('room1')

      expect(result?.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(result?.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'))
    })
  })

  describe('findByEdition', () => {
    it('should return rooms filtered by editionId', async () => {
      const records = [
        makeRoomRecord({ id: 'room1', name: 'Room A' }),
        makeRoomRecord({ id: 'room2', name: 'Room B' })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('room1')
      expect(result[1].id).toBe('room2')
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('ed1'),
          sort: 'order,name'
        })
      )
    })

    it('should return empty array when no rooms', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed-empty')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a room and map the result', async () => {
      const record = makeRoomRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        name: 'Main Hall',
        capacity: 200,
        floor: '1st',
        description: 'Large conference room',
        equipment: ['projector', 'microphone'],
        equipmentNotes: 'Bring adapters',
        order: 1
      })

      expect(mockPb._mockCollection).toHaveBeenCalledWith('rooms')
      expect(result.id).toBe('room1')
      expect(result.name).toBe('Main Hall')
    })

    it('should default equipment to empty array and order to 0', async () => {
      const record = makeRoomRecord({ equipment: [], order: 0 })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      await repo.create({ editionId: 'ed1', name: 'Room' } as never)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ equipment: [], order: 0 }))
    })

    it('should map empty equipment to empty array', async () => {
      const record = makeRoomRecord({ equipment: null })
      mockPb._mockCollection.mockReturnValue({
        create: vi.fn().mockResolvedValue(record)
      })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({ editionId: 'ed1', name: 'Room' } as never)

      expect(result.equipment).toEqual([])
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeRoomRecord({ name: 'Updated Room' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'room1', name: 'Updated Room' })

      expect(mockUpdate).toHaveBeenCalledWith('room1', { name: 'Updated Room' })
      expect(result.name).toBe('Updated Room')
    })

    it('should not include undefined fields in update data', async () => {
      const record = makeRoomRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'room1', capacity: 100 })

      expect(mockUpdate).toHaveBeenCalledWith('room1', { capacity: 100 })
    })

    it('should update all fields when provided', async () => {
      const record = makeRoomRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      await repo.update({
        id: 'room1',
        name: 'New Name',
        capacity: 50,
        floor: '2nd',
        description: 'Desc',
        equipment: ['screen'],
        equipmentNotes: 'Notes',
        order: 5
      })

      expect(mockUpdate).toHaveBeenCalledWith('room1', {
        name: 'New Name',
        capacity: 50,
        floor: '2nd',
        description: 'Desc',
        equipment: ['screen'],
        equipmentNotes: 'Notes',
        order: 5
      })
    })
  })

  describe('delete', () => {
    it('should delete room by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createRoomRepository(mockPb as unknown as PocketBase)
      await repo.delete('room1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('rooms')
      expect(mockDelete).toHaveBeenCalledWith('room1')
    })
  })
})
