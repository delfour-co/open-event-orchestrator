import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createConsentRepository } from './consent-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce(
      (acc, str, i) => acc + str + (values[i] !== undefined ? `"${values[i]}"` : ''),
      ''
    )
}))

const makeConsentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'consent1',
  contactId: 'contact1',
  type: 'marketing',
  status: 'granted',
  grantedAt: '2024-06-15T10:00:00Z',
  withdrawnAt: null,
  source: 'form',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('ConsentRepository', () => {
  let pb: PocketBase
  let mockCollection: Record<string, ReturnType<typeof vi.fn>>

  beforeEach(() => {
    mockCollection = {
      create: vi.fn(),
      getOne: vi.fn(),
      getFullList: vi.fn(),
      getList: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
    pb = { collection: vi.fn().mockReturnValue(mockCollection) } as unknown as PocketBase
  })

  describe('findById', () => {
    it('should return mapped consent when found', async () => {
      mockCollection.getOne.mockResolvedValue(makeConsentRecord())
      const repo = createConsentRepository(pb)
      const result = await repo.findById('consent1')
      expect(pb.collection).toHaveBeenCalledWith('consents')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('consent1')
      expect(result?.type).toBe('marketing')
      expect(result?.status).toBe('granted')
      expect(result?.grantedAt).toEqual(new Date('2024-06-15T10:00:00Z'))
    })

    it('should return null when not found', async () => {
      mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const repo = createConsentRepository(pb)
      const result = await repo.findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByContact', () => {
    it('should return all consents for a contact', async () => {
      mockCollection.getFullList.mockResolvedValue([
        makeConsentRecord(),
        makeConsentRecord({ id: 'consent2', type: 'analytics' })
      ])
      const repo = createConsentRepository(pb)
      const result = await repo.findByContact('contact1')
      expect(result).toHaveLength(2)
      expect(mockCollection.getFullList).toHaveBeenCalledWith(
        expect.objectContaining({ sort: '-created' })
      )
    })
  })

  describe('findByContactAndType', () => {
    it('should return consent matching contact and type', async () => {
      mockCollection.getList.mockResolvedValue({ items: [makeConsentRecord()] })
      const repo = createConsentRepository(pb)
      const result = await repo.findByContactAndType('contact1', 'marketing')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('marketing')
    })

    it('should return null when no match', async () => {
      mockCollection.getList.mockResolvedValue({ items: [] })
      const repo = createConsentRepository(pb)
      const result = await repo.findByContactAndType('contact1', 'marketing')
      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockCollection.getList.mockRejectedValue(new Error('error'))
      const repo = createConsentRepository(pb)
      const result = await repo.findByContactAndType('contact1', 'marketing')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create consent with date serialization', async () => {
      mockCollection.create.mockResolvedValue(makeConsentRecord())
      const repo = createConsentRepository(pb)
      const result = await repo.create({
        contactId: 'contact1',
        type: 'marketing',
        status: 'granted',
        source: 'form',
        grantedAt: new Date('2024-06-15T10:00:00Z')
      } as never)
      expect(mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          grantedAt: '2024-06-15T10:00:00.000Z'
        })
      )
      expect(result.id).toBe('consent1')
    })
  })

  describe('update', () => {
    it('should update consent with date serialization', async () => {
      mockCollection.update.mockResolvedValue(makeConsentRecord({ status: 'withdrawn' }))
      const repo = createConsentRepository(pb)
      const result = await repo.update('consent1', {
        withdrawnAt: new Date('2024-07-01T00:00:00Z')
      } as never)
      expect(mockCollection.update).toHaveBeenCalledWith(
        'consent1',
        expect.objectContaining({
          withdrawnAt: '2024-07-01T00:00:00.000Z'
        })
      )
      expect(result).not.toBeNull()
    })
  })

  describe('grantConsent', () => {
    it('should update existing consent to granted', async () => {
      mockCollection.getList.mockResolvedValue({
        items: [makeConsentRecord({ status: 'withdrawn' })]
      })
      mockCollection.update.mockResolvedValue(makeConsentRecord({ status: 'granted' }))
      const repo = createConsentRepository(pb)
      const result = await repo.grantConsent('contact1', 'marketing', 'form', '1.2.3.4')
      expect(mockCollection.update).toHaveBeenCalledWith(
        'consent1',
        expect.objectContaining({
          status: 'granted',
          source: 'form',
          ipAddress: '1.2.3.4'
        })
      )
      expect(result.status).toBe('granted')
    })

    it('should create new consent if none exists', async () => {
      mockCollection.getList.mockResolvedValue({ items: [] })
      mockCollection.create.mockResolvedValue(makeConsentRecord())
      const repo = createConsentRepository(pb)
      const result = await repo.grantConsent('contact1', 'marketing', 'form')
      expect(mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'contact1',
          type: 'marketing',
          status: 'granted',
          source: 'form'
        })
      )
      expect(result).not.toBeNull()
    })
  })

  describe('withdrawConsent', () => {
    it('should withdraw existing consent', async () => {
      mockCollection.getList.mockResolvedValue({ items: [makeConsentRecord()] })
      mockCollection.update.mockResolvedValue(makeConsentRecord({ status: 'withdrawn' }))
      const repo = createConsentRepository(pb)
      const result = await repo.withdrawConsent('contact1', 'marketing')
      expect(mockCollection.update).toHaveBeenCalledWith(
        'consent1',
        expect.objectContaining({
          status: 'withdrawn'
        })
      )
      expect(result).not.toBeNull()
    })

    it('should return null if no existing consent', async () => {
      mockCollection.getList.mockResolvedValue({ items: [] })
      const repo = createConsentRepository(pb)
      const result = await repo.withdrawConsent('contact1', 'marketing')
      expect(result).toBeNull()
    })
  })

  describe('deleteByContact', () => {
    it('should delete all consents for a contact', async () => {
      mockCollection.getFullList.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])
      mockCollection.delete.mockResolvedValue(undefined)
      const repo = createConsentRepository(pb)
      await repo.deleteByContact('contact1')
      expect(mockCollection.delete).toHaveBeenCalledTimes(2)
      expect(mockCollection.delete).toHaveBeenCalledWith('c1')
      expect(mockCollection.delete).toHaveBeenCalledWith('c2')
    })
  })

  describe('mapping', () => {
    it('should map default values for missing fields', async () => {
      mockCollection.getOne.mockResolvedValue(
        makeConsentRecord({
          status: null,
          grantedAt: null,
          withdrawnAt: null,
          source: null,
          ipAddress: undefined,
          userAgent: undefined
        })
      )
      const repo = createConsentRepository(pb)
      const result = await repo.findById('consent1')
      expect(result?.status).toBe('denied')
      expect(result?.grantedAt).toBeUndefined()
      expect(result?.withdrawnAt).toBeUndefined()
      expect(result?.source).toBe('manual')
    })
  })
})
