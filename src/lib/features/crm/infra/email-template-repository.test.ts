import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmailTemplateRepository } from './email-template-repository'

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

const makeTemplateRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'tpl1',
  eventId: 'evt1',
  name: 'Welcome Template',
  subject: 'Welcome {{firstName}}!',
  bodyHtml: '<p>Hello {{firstName}}</p>',
  bodyText: 'Hello {{firstName}}',
  variables: ['firstName', 'lastName'],
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('EmailTemplateRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return template when found', async () => {
      const record = makeTemplateRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tpl1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('tpl1')
      expect(result?.name).toBe('Welcome Template')
      expect(result?.variables).toEqual(['firstName', 'lastName'])
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should parse variables from JSON string', async () => {
      const record = makeTemplateRecord({ variables: '["firstName","email"]' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tpl1')

      expect(result?.variables).toEqual(['firstName', 'email'])
    })

    it('should return empty variables when invalid', async () => {
      const record = makeTemplateRecord({ variables: 'invalid' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tpl1')

      expect(result?.variables).toEqual([])
    })

    it('should return empty variables when null', async () => {
      const record = makeTemplateRecord({ variables: null })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tpl1')

      expect(result?.variables).toEqual([])
    })
  })

  describe('findByEvent', () => {
    it('should return templates filtered by eventId', async () => {
      const records = [makeTemplateRecord({ id: 'tpl1' }), makeTemplateRecord({ id: 'tpl2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('evt1'),
          sort: '-created'
        })
      )
    })

    it('should return empty array when no templates', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt-empty')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a template and stringify variables', async () => {
      const record = makeTemplateRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        eventId: 'evt1',
        name: 'Welcome Template',
        subject: 'Welcome!',
        bodyHtml: '<p>Hello</p>',
        bodyText: 'Hello',
        variables: ['firstName', 'lastName']
      })

      expect(mockPb._mockCollection).toHaveBeenCalledWith('email_templates')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ variables: '["firstName","lastName"]' })
      )
      expect(result.id).toBe('tpl1')
    })
  })

  describe('update', () => {
    it('should update template and stringify variables when provided', async () => {
      const record = makeTemplateRecord({ name: 'Updated' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('tpl1', {
        name: 'Updated',
        variables: ['email']
      } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'tpl1',
        expect.objectContaining({ variables: '["email"]' })
      )
      expect(result.name).toBe('Updated')
    })

    it('should update without stringifying when variables not provided', async () => {
      const record = makeTemplateRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      await repo.update('tpl1', { name: 'New Name' } as never)

      const updateCall = mockUpdate.mock.calls[0][1]
      expect(updateCall.name).toBe('New Name')
    })

    it('should update subject and body fields', async () => {
      const record = makeTemplateRecord({ subject: 'New Subject' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      await repo.update('tpl1', {
        subject: 'New Subject',
        bodyHtml: '<p>New</p>',
        bodyText: 'New'
      } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'tpl1',
        expect.objectContaining({
          subject: 'New Subject',
          bodyHtml: '<p>New</p>',
          bodyText: 'New'
        })
      )
    })
  })

  describe('delete', () => {
    it('should delete template by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createEmailTemplateRepository(mockPb as unknown as PocketBase)
      await repo.delete('tpl1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('email_templates')
      expect(mockDelete).toHaveBeenCalledWith('tpl1')
    })
  })
})
