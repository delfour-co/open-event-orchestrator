import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrganizationRepository } from './organization-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeOrgRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'org1',
  name: 'Test Org',
  slug: 'test-org',
  description: 'A test organization',
  logo: 'logo.png',
  website: 'https://example.com',
  primaryColor: '#ff0000',
  secondaryColor: '#00ff00',
  twitter: '@test',
  linkedin: 'test-linkedin',
  github: 'test-github',
  youtube: 'test-youtube',
  timezone: 'Europe/Paris',
  defaultLocale: 'fr',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('OrganizationRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create an organization and map the result', async () => {
      const record = makeOrgRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({ name: 'Test Org', slug: 'test-org' } as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('organizations')
      expect(mockCreate).toHaveBeenCalledWith({ name: 'Test Org', slug: 'test-org' })
      expect(result.id).toBe('org1')
      expect(result.name).toBe('Test Org')
      expect(result.slug).toBe('test-org')
      expect(result.description).toBe('A test organization')
      expect(result.logo).toBe('logo.png')
      expect(result.website).toBe('https://example.com')
      expect(result.primaryColor).toBe('#ff0000')
      expect(result.twitter).toBe('@test')
      expect(result.timezone).toBe('Europe/Paris')
      expect(result.defaultLocale).toBe('fr')
      expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(result.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'))
    })

    it('should map empty optional fields to undefined', async () => {
      const record = makeOrgRecord({
        description: '',
        logo: '',
        website: '',
        primaryColor: '',
        secondaryColor: '',
        twitter: '',
        linkedin: '',
        github: '',
        youtube: '',
        timezone: '',
        defaultLocale: ''
      })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({ name: 'Test Org', slug: 'test-org' } as never)

      expect(result.description).toBeUndefined()
      expect(result.logo).toBeUndefined()
      expect(result.website).toBeUndefined()
      expect(result.primaryColor).toBeUndefined()
      expect(result.secondaryColor).toBeUndefined()
      expect(result.twitter).toBeUndefined()
      expect(result.linkedin).toBeUndefined()
      expect(result.github).toBeUndefined()
      expect(result.youtube).toBeUndefined()
      expect(result.timezone).toBeUndefined()
      expect(result.defaultLocale).toBeUndefined()
    })
  })

  describe('findById', () => {
    it('should return organization when found', async () => {
      const record = makeOrgRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('org1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('org1')
      expect(result?.name).toBe('Test Org')
      expect(mockPb._mockCollection).toHaveBeenCalledWith('organizations')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('should return organization when found by slug', async () => {
      const record = makeOrgRecord()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue(record)
      })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('test-org')

      expect(result).not.toBeNull()
      expect(result?.slug).toBe('test-org')
      expect(mockPb._mockCollection).toHaveBeenCalledWith('organizations')
    })

    it('should return null when slug not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all organizations', async () => {
      const records = [
        makeOrgRecord({ id: 'org1', name: 'Org 1' }),
        makeOrgRecord({ id: 'org2', name: 'Org 2' })
      ]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findAll()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('org1')
      expect(result[1].id).toBe('org2')
    })

    it('should return empty array when no organizations exist', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findAll()

      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('should update organization and return mapped result', async () => {
      const record = makeOrgRecord({ name: 'Updated Org' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('org1', { name: 'Updated Org' } as never)

      expect(mockUpdate).toHaveBeenCalledWith('org1', { name: 'Updated Org' })
      expect(result.name).toBe('Updated Org')
    })
  })

  describe('delete', () => {
    it('should delete organization by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createOrganizationRepository(mockPb as unknown as PocketBase)
      await repo.delete('org1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('organizations')
      expect(mockDelete).toHaveBeenCalledWith('org1')
    })
  })
})
