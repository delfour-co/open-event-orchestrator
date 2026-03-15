import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmailLogRepository } from './email-log-repository'

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
    update: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'log1',
  talkId: 'talk1',
  speakerId: 'speaker1',
  editionId: 'edition1',
  type: 'acceptance',
  to: 'speaker@example.com',
  subject: 'Your talk was accepted',
  sentAt: '2024-01-15T10:00:00Z',
  status: 'sent',
  error: undefined,
  created: '2024-01-15T10:00:00Z',
  updated: '2024-01-15T10:00:00Z'
}

describe('EmailLogRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createEmailLogRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return an email log when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('log1')

      expect(mockPb.collection).toHaveBeenCalledWith('email_logs')
      expect(result?.id).toBe('log1')
      expect(result?.to).toBe('speaker@example.com')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByTalk', () => {
    it('should return logs for a talk sorted by -sentAt', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByTalk('talk1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: '-sentAt'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('findBySpeaker', () => {
    it('should return logs for a speaker', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findBySpeaker('speaker1')

      expect(result).toHaveLength(1)
      expect(result[0].speakerId).toBe('speaker1')
    })
  })

  describe('findByEdition', () => {
    it('should return logs for an edition', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEdition('edition1')

      expect(result).toHaveLength(1)
    })
  })

  describe('findByType', () => {
    it('should filter by edition and type', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByType('edition1', 'acceptance')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('&&'),
        sort: '-sentAt'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create an email log with sentAt timestamp', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        speakerId: 'speaker1',
        editionId: 'edition1',
        type: 'acceptance',
        to: 'speaker@example.com',
        subject: 'Accepted',
        status: 'sent'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ sentAt: expect.any(String) })
      )
    })
  })

  describe('updateStatus', () => {
    it('should update status and error', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'failed' })
      const result = await getRepo().updateStatus('log1', 'failed', 'SMTP timeout')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('log1', {
        status: 'failed',
        error: 'SMTP timeout'
      })
      expect(result.status).toBe('failed')
    })

    it('should update status without error', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'sent' })
      await getRepo().updateStatus('log1', 'sent')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('log1', {
        status: 'sent',
        error: undefined
      })
    })
  })

  describe('countByEdition', () => {
    it('should count logs by status', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([
        { type: 'acceptance', status: 'sent' },
        { type: 'rejection', status: 'sent' },
        { type: 'acceptance', status: 'failed' },
        { type: 'acceptance', status: 'pending' }
      ])

      const result = await getRepo().countByEdition('edition1')

      expect(result.total).toBe(4)
      expect(result.sent).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.pending).toBe(1)
    })

    it('should return zero counts when no logs', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().countByEdition('edition1')

      expect(result.total).toBe(0)
      expect(result.sent).toBe(0)
    })
  })

  describe('mapping', () => {
    it('should map all fields including sentAt as Date', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('log1')

      expect(result?.sentAt).toBeInstanceOf(Date)
      expect(result?.type).toBe('acceptance')
      expect(result?.subject).toBe('Your talk was accepted')
    })
  })
})
