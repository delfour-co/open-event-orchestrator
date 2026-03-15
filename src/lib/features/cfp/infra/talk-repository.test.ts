import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTalkRepository } from './talk-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...filters: (string | undefined | null)[]) => filters.filter(Boolean).join(' && '),
  filterContains: (field: string, value: string) => `${field} ~ "${value}"`,
  filterIn: (field: string, values: string[]) =>
    `(${values.map((v) => `${field} = "${v}"`).join(' || ')})`
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getList: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'talk1',
  editionId: 'edition1',
  title: 'Building APIs',
  abstract: 'Learn about APIs',
  description: 'Detailed description',
  categoryId: 'cat1',
  formatId: 'fmt1',
  language: 'en',
  level: 'intermediate',
  speakerIds: ['spk1', 'spk2'],
  status: 'submitted',
  submittedAt: '2024-01-15T10:00:00Z',
  notes: 'Internal note',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('TalkRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createTalkRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a talk when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('talk1')

      expect(mockPb.collection).toHaveBeenCalledWith('talks')
      expect(result?.id).toBe('talk1')
      expect(result?.title).toBe('Building APIs')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return talks with default pagination', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [MOCK_RECORD] })
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(1, 50, {
        filter: expect.any(String),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
    })

    it('should pass custom options', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [] })
      await getRepo().findByEdition('edition1', { page: 2, perPage: 10, sort: 'title' })

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(2, 10, {
        filter: expect.any(String),
        sort: 'title'
      })
    })
  })

  describe('findBySpeaker', () => {
    it('should filter by speaker using contains', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findBySpeaker('spk1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('spk1'),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('findByFilters', () => {
    it('should combine multiple filters', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [MOCK_RECORD] })
      const result = await getRepo().findByFilters({
        editionId: 'edition1',
        status: 'submitted',
        categoryId: 'cat1'
      })

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(1, 50, {
        filter: expect.stringContaining('&&'),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
    })

    it('should handle array of statuses', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [] })
      await getRepo().findByFilters({
        status: ['submitted', 'accepted']
      })

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(1, 50, {
        filter: expect.stringContaining('||'),
        sort: '-created'
      })
    })

    it('should handle empty filters', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [] })
      await getRepo().findByFilters({})

      expect(mockPb.mockCollection.getList).toHaveBeenCalled()
    })
  })

  describe('countByEdition', () => {
    it('should count talks by status', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([
        { status: 'submitted' },
        { status: 'submitted' },
        { status: 'accepted' },
        { status: 'rejected' }
      ])

      const result = await getRepo().countByEdition('edition1')

      expect(result.submitted).toBe(2)
      expect(result.accepted).toBe(1)
      expect(result.rejected).toBe(1)
      expect(result.draft).toBe(0)
    })
  })

  describe('create', () => {
    it('should create a talk with draft status', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        editionId: 'edition1',
        title: 'New Talk',
        abstract: 'Abstract',
        language: 'en',
        speakerIds: ['spk1']
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' })
      )
    })
  })

  describe('update', () => {
    it('should update a talk', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, title: 'Updated' })
      const result = await getRepo().update('talk1', { title: 'Updated' })

      expect(result.title).toBe('Updated')
    })
  })

  describe('updateStatus', () => {
    it('should set submittedAt when status is submitted', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'submitted' })
      await getRepo().updateStatus('talk1', 'submitted')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith(
        'talk1',
        expect.objectContaining({ status: 'submitted', submittedAt: expect.any(String) })
      )
    })

    it('should not set submittedAt for other statuses', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'accepted' })
      await getRepo().updateStatus('talk1', 'accepted')

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs).toEqual({ status: 'accepted' })
    })
  })

  describe('delete', () => {
    it('should delete the talk', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('talk1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('talk1')
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('talk1')

      expect(result?.abstract).toBe('Learn about APIs')
      expect(result?.description).toBe('Detailed description')
      expect(result?.language).toBe('en')
      expect(result?.level).toBe('intermediate')
      expect(result?.speakerIds).toEqual(['spk1', 'spk2'])
      expect(result?.submittedAt).toBeInstanceOf(Date)
      expect(result?.notes).toBe('Internal note')
      expect(result?.createdAt).toBeInstanceOf(Date)
    })

    it('should handle missing submittedAt', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({ ...MOCK_RECORD, submittedAt: null })
      const result = await getRepo().findById('talk1')

      expect(result?.submittedAt).toBeUndefined()
    })
  })
})
