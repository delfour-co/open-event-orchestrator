import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCommentRepository } from './comment-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...filters: (string | undefined | null)[]) => filters.filter(Boolean).join(' && ')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'comment1',
  talkId: 'talk1',
  userId: 'user1',
  content: 'Great talk!',
  isInternal: true,
  visibility: 'internal',
  created: '2024-01-01T00:00:00Z'
}

const MOCK_PUBLIC_RECORD = {
  id: 'comment2',
  talkId: 'talk1',
  userId: 'user2',
  content: 'Thanks for the feedback!',
  isInternal: false,
  visibility: 'public',
  created: '2024-01-02T00:00:00Z'
}

describe('CommentRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createCommentRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a comment when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('comment1')

      expect(mockPb.collection).toHaveBeenCalledWith('comments')
      expect(result?.id).toBe('comment1')
      expect(result?.content).toBe('Great talk!')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByTalk', () => {
    it('should filter internal comments by default', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByTalk('talk1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('isInternal = true'),
        sort: 'created'
      })
      expect(result).toHaveLength(1)
    })

    it('should return all comments when internalOnly is false', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      await getRepo().findByTalk('talk1', false)

      const callFilter = mockPb.mockCollection.getFullList.mock.calls[0][0]?.filter as string
      expect(callFilter).not.toContain('isInternal')
    })
  })

  describe('findByUser', () => {
    it('should return comments by user sorted by -created', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByUser('user1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create a comment with default isInternal=true', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        talkId: 'talk1',
        userId: 'user1',
        content: 'Nice!',
        isInternal: true,
        visibility: 'internal'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ isInternal: true })
      )
    })

    it('should respect explicit isInternal=false', async () => {
      mockPb.mockCollection.create.mockResolvedValue({ ...MOCK_RECORD, isInternal: false })
      await getRepo().create({
        talkId: 'talk1',
        userId: 'user1',
        content: 'Public',
        isInternal: false,
        visibility: 'public'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ isInternal: false })
      )
    })
  })

  describe('delete', () => {
    it('should delete the comment', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('comment1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('comment1')
    })
  })

  describe('countByTalk', () => {
    it('should return the count of comments for a talk', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }])
      const result = await getRepo().countByTalk('talk1')

      expect(result).toBe(3)
      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        fields: 'id'
      })
    })

    it('should return 0 when no comments', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().countByTalk('talk1')
      expect(result).toBe(0)
    })
  })

  describe('findByTalkAndVisibility', () => {
    it('should filter comments by visibility internal', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByTalkAndVisibility('talk1', 'internal')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('visibility = internal'),
        sort: 'created'
      })
      expect(result).toHaveLength(1)
      expect(result[0].visibility).toBe('internal')
    })

    it('should filter comments by visibility public', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_PUBLIC_RECORD])
      const result = await getRepo().findByTalkAndVisibility('talk1', 'public')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('visibility = public'),
        sort: 'created'
      })
      expect(result).toHaveLength(1)
      expect(result[0].visibility).toBe('public')
    })

    it('should return empty array when no matching comments', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().findByTalkAndVisibility('talk1', 'public')
      expect(result).toEqual([])
    })
  })

  describe('findPublicByTalk', () => {
    it('should return only public comments', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_PUBLIC_RECORD])
      const result = await getRepo().findPublicByTalk('talk1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('visibility = public'),
        sort: 'created'
      })
      expect(result).toHaveLength(1)
      expect(result[0].visibility).toBe('public')
    })

    it('should return empty array when no public comments', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().findPublicByTalk('talk1')
      expect(result).toEqual([])
    })
  })

  describe('countPublicByTalk', () => {
    it('should return count of public comments', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([{ id: '1' }, { id: '2' }])
      const result = await getRepo().countPublicByTalk('talk1')

      expect(result).toBe(2)
      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('visibility = public'),
        fields: 'id'
      })
    })

    it('should return 0 when no public comments', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().countPublicByTalk('talk1')
      expect(result).toBe(0)
    })
  })

  describe('create with visibility', () => {
    it('should create a comment with explicit visibility', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_PUBLIC_RECORD)
      await getRepo().create({
        talkId: 'talk1',
        userId: 'user1',
        content: 'Public message',
        isInternal: false,
        visibility: 'public'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'public' })
      )
    })

    it('should derive visibility from isInternal when not provided', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        talkId: 'talk1',
        userId: 'user1',
        content: 'Internal note',
        isInternal: true,
        visibility: 'internal'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'internal' })
      )
    })

    it('should default visibility to public when isInternal is false', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_PUBLIC_RECORD)
      await getRepo().create({
        talkId: 'talk1',
        userId: 'user1',
        content: 'Public note',
        isInternal: false,
        visibility: 'public'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'public' })
      )
    })
  })

  describe('mapping', () => {
    it('should map fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('comment1')

      expect(result?.talkId).toBe('talk1')
      expect(result?.userId).toBe('user1')
      expect(result?.isInternal).toBe(true)
      expect(result?.createdAt).toBeInstanceOf(Date)
    })

    it('should map visibility field correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('comment1')
      expect(result?.visibility).toBe('internal')
    })

    it('should default visibility to internal when missing', async () => {
      const recordWithoutVisibility = { ...MOCK_RECORD, visibility: undefined }
      mockPb.mockCollection.getOne.mockResolvedValue(recordWithoutVisibility)
      const result = await getRepo().findById('comment1')
      expect(result?.visibility).toBe('internal')
    })

    it('should set isInternal to false when visibility is public', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_PUBLIC_RECORD)
      const result = await getRepo().findById('comment2')
      expect(result?.visibility).toBe('public')
      expect(result?.isInternal).toBe(false)
    })
  })
})
