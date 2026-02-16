import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorInquiryRepository } from './sponsor-inquiry-repository'

const createMockPocketBase = () => {
  const mockCollection = {
    getFullList: vi.fn(),
    getOne: vi.fn(),
    getList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }

  return {
    collection: vi.fn(() => mockCollection),
    mockCollection
  }
}

describe('SponsorInquiryRepository', () => {
  let mockPb: ReturnType<typeof createMockPocketBase>

  beforeEach(() => {
    mockPb = createMockPocketBase()
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('should return an inquiry by id', async () => {
      const mockInquiry = {
        id: 'inquiry1',
        editionId: 'edition1',
        companyName: 'Acme Corp',
        contactName: 'John Doe',
        contactEmail: 'john@acme.com',
        contactPhone: '+1234567890',
        message: 'Interested in sponsoring',
        interestedPackageId: 'pkg1',
        status: 'pending',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }

      mockPb.mockCollection.getOne.mockResolvedValue(mockInquiry)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.findById('inquiry1')

      expect(mockPb.collection).toHaveBeenCalledWith('sponsor_inquiries')
      expect(mockPb.mockCollection.getOne).toHaveBeenCalledWith('inquiry1')
      expect(result?.id).toBe('inquiry1')
      expect(result?.companyName).toBe('Acme Corp')
    })

    it('should return null when inquiry not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return inquiries for an edition sorted by created desc', async () => {
      const mockInquiries = [
        {
          id: 'inquiry2',
          editionId: 'edition1',
          companyName: 'Beta Inc',
          contactName: 'Jane Doe',
          contactEmail: 'jane@beta.com',
          message: 'Interested',
          status: 'pending',
          created: '2024-01-02T00:00:00Z',
          updated: '2024-01-02T00:00:00Z'
        },
        {
          id: 'inquiry1',
          editionId: 'edition1',
          companyName: 'Acme Corp',
          contactName: 'John Doe',
          contactEmail: 'john@acme.com',
          message: 'Want to sponsor',
          status: 'contacted',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        }
      ]

      mockPb.mockCollection.getFullList.mockResolvedValue(mockInquiries)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.findByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'editionId = "edition1"',
        sort: '-created'
      })
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('inquiry2')
    })

    it('should return empty array when no inquiries exist', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.findByEdition('edition1')

      expect(result).toEqual([])
    })
  })

  describe('findByStatus', () => {
    it('should return inquiries for a specific status', async () => {
      const mockInquiries = [
        {
          id: 'inquiry1',
          editionId: 'edition1',
          companyName: 'Acme Corp',
          contactName: 'John Doe',
          contactEmail: 'john@acme.com',
          message: 'Interested',
          status: 'pending',
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        }
      ]

      mockPb.mockCollection.getFullList.mockResolvedValue(mockInquiries)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.findByStatus('edition1', 'pending')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'editionId = "edition1" && status = "pending"',
        sort: '-created'
      })
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('pending')
    })
  })

  describe('create', () => {
    it('should create a new inquiry', async () => {
      const mockCreated = {
        id: 'newinquiry',
        editionId: 'edition1',
        companyName: 'New Company',
        contactName: 'New Contact',
        contactEmail: 'new@company.com',
        contactPhone: '+1234567890',
        message: 'Interested in sponsorship',
        interestedPackageId: 'pkg1',
        status: 'pending',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }

      mockPb.mockCollection.create.mockResolvedValue(mockCreated)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.create({
        editionId: 'edition1',
        companyName: 'New Company',
        contactName: 'New Contact',
        contactEmail: 'new@company.com',
        contactPhone: '+1234567890',
        message: 'Interested in sponsorship',
        interestedPackageId: 'pkg1'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith({
        editionId: 'edition1',
        companyName: 'New Company',
        contactName: 'New Contact',
        contactEmail: 'new@company.com',
        contactPhone: '+1234567890',
        message: 'Interested in sponsorship',
        interestedPackageId: 'pkg1',
        status: 'pending'
      })
      expect(result.id).toBe('newinquiry')
      expect(result.status).toBe('pending')
    })

    it('should handle optional fields', async () => {
      const mockCreated = {
        id: 'newinquiry',
        editionId: 'edition1',
        companyName: 'New Company',
        contactName: 'New Contact',
        contactEmail: 'new@company.com',
        message: 'Interested',
        status: 'pending',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }

      mockPb.mockCollection.create.mockResolvedValue(mockCreated)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      await repo.create({
        editionId: 'edition1',
        companyName: 'New Company',
        contactName: 'New Contact',
        contactEmail: 'new@company.com',
        message: 'Interested'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith({
        editionId: 'edition1',
        companyName: 'New Company',
        contactName: 'New Contact',
        contactEmail: 'new@company.com',
        contactPhone: null,
        message: 'Interested',
        interestedPackageId: null,
        status: 'pending'
      })
    })
  })

  describe('update', () => {
    it('should update an existing inquiry', async () => {
      const mockUpdated = {
        id: 'inquiry1',
        editionId: 'edition1',
        companyName: 'Acme Corp',
        contactName: 'John Doe',
        contactEmail: 'john@acme.com',
        message: 'Interested',
        status: 'contacted',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-02T00:00:00Z'
      }

      mockPb.mockCollection.update.mockResolvedValue(mockUpdated)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.update('inquiry1', { status: 'contacted' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('inquiry1', {
        status: 'contacted'
      })
      expect(result.status).toBe('contacted')
    })
  })

  describe('updateStatus', () => {
    it('should update inquiry status', async () => {
      const mockUpdated = {
        id: 'inquiry1',
        editionId: 'edition1',
        companyName: 'Acme Corp',
        contactName: 'John Doe',
        contactEmail: 'john@acme.com',
        message: 'Interested',
        status: 'converted',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-02T00:00:00Z'
      }

      mockPb.mockCollection.update.mockResolvedValue(mockUpdated)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.updateStatus('inquiry1', 'converted')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('inquiry1', {
        status: 'converted'
      })
      expect(result.status).toBe('converted')
    })
  })

  describe('delete', () => {
    it('should delete an inquiry', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      await repo.delete('inquiry1')

      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('inquiry1')
    })
  })

  describe('countByEdition', () => {
    it('should return count of inquiries for an edition', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({
        totalItems: 5,
        items: []
      })

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.countByEdition('edition1')

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(1, 1, {
        filter: 'editionId = "edition1"',
        fields: 'id'
      })
      expect(result).toBe(5)
    })
  })

  describe('countByStatus', () => {
    it('should return count of inquiries by status', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({
        totalItems: 3,
        items: []
      })

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.countByStatus('edition1', 'pending')

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(1, 1, {
        filter: 'editionId = "edition1" && status = "pending"',
        fields: 'id'
      })
      expect(result).toBe(3)
    })
  })

  describe('mapping', () => {
    it('should correctly map record to domain type', async () => {
      const mockRecord = {
        id: 'inquiry1',
        editionId: 'edition1',
        companyName: 'Acme Corporation',
        contactName: 'John Doe',
        contactEmail: 'john@acme.com',
        contactPhone: '+1 234 567 890',
        message: 'We want to sponsor your event',
        interestedPackageId: 'pkg1',
        status: 'pending',
        created: '2024-01-15T10:30:00Z',
        updated: '2024-01-16T14:45:00Z'
      }

      mockPb.mockCollection.getOne.mockResolvedValue(mockRecord)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.findById('inquiry1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('inquiry1')
      expect(result?.editionId).toBe('edition1')
      expect(result?.companyName).toBe('Acme Corporation')
      expect(result?.contactName).toBe('John Doe')
      expect(result?.contactEmail).toBe('john@acme.com')
      expect(result?.contactPhone).toBe('+1 234 567 890')
      expect(result?.message).toBe('We want to sponsor your event')
      expect(result?.interestedPackageId).toBe('pkg1')
      expect(result?.status).toBe('pending')
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle missing optional fields', async () => {
      const mockRecord = {
        id: 'inquiry1',
        editionId: 'edition1',
        companyName: 'Acme Corp',
        contactName: 'John Doe',
        contactEmail: 'john@acme.com',
        message: 'Interested',
        status: 'pending',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }

      mockPb.mockCollection.getOne.mockResolvedValue(mockRecord)

      const repo = createSponsorInquiryRepository(
        mockPb as unknown as Parameters<typeof createSponsorInquiryRepository>[0]
      )
      const result = await repo.findById('inquiry1')

      expect(result?.contactPhone).toBeUndefined()
      expect(result?.interestedPackageId).toBeUndefined()
    })
  })
})
