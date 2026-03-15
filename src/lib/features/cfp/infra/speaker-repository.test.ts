import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpeakerRepository } from './speaker-repository'

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    getFirstListItem: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'spk1',
  userId: 'user1',
  email: 'speaker@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  bio: 'Full-stack developer',
  company: 'Acme',
  jobTitle: 'CTO',
  photoUrl: 'https://example.com/photo.jpg',
  twitter: '@jane',
  linkedin: 'jane-doe',
  github: 'janedoe',
  city: 'Paris',
  country: 'France',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('SpeakerRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createSpeakerRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a speaker when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('spk1')

      expect(mockPb.collection).toHaveBeenCalledWith('speakers')
      expect(result?.id).toBe('spk1')
      expect(result?.email).toBe('speaker@example.com')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should return a speaker by email', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findByEmail('speaker@example.com')

      expect(result?.email).toBe('speaker@example.com')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findByEmail('unknown@example.com')
      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should return a speaker by userId', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findByUserId('user1')

      expect(result?.userId).toBe('user1')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findByUserId('user99')
      expect(result).toBeNull()
    })
  })

  describe('findByIds', () => {
    it('should return speakers matching the given ids', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByIds(['spk1'])

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('id = "spk1"'),
        requestKey: null
      })
      expect(result).toHaveLength(1)
    })

    it('should return empty array for empty ids', async () => {
      const result = await getRepo().findByIds([])
      expect(result).toHaveLength(0)
      expect(mockPb.mockCollection.getFullList).not.toHaveBeenCalled()
    })

    it('should join multiple ids with OR', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      await getRepo().findByIds(['spk1', 'spk2'])

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('||'),
        requestKey: null
      })
    })
  })

  describe('create', () => {
    it('should create a speaker', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().create({
        email: 'speaker@example.com',
        firstName: 'Jane',
        lastName: 'Doe'
      })

      expect(result.id).toBe('spk1')
    })
  })

  describe('update', () => {
    it('should update a speaker', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, company: 'NewCo' })
      const result = await getRepo().update('spk1', { company: 'NewCo' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('spk1', { company: 'NewCo' })
      expect(result.company).toBe('NewCo')
    })
  })

  describe('delete', () => {
    it('should delete the speaker', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('spk1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('spk1')
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('spk1')

      expect(result?.firstName).toBe('Jane')
      expect(result?.lastName).toBe('Doe')
      expect(result?.bio).toBe('Full-stack developer')
      expect(result?.company).toBe('Acme')
      expect(result?.jobTitle).toBe('CTO')
      expect(result?.twitter).toBe('@jane')
      expect(result?.linkedin).toBe('jane-doe')
      expect(result?.github).toBe('janedoe')
      expect(result?.city).toBe('Paris')
      expect(result?.country).toBe('France')
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })
  })
})
