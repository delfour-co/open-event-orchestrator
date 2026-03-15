import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTicketTemplateRepository } from './ticket-template-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  const mockFiles = {
    getURL: vi.fn().mockReturnValue('https://cdn.example.com/logo.png')
  }
  return {
    collection: vi.fn(() => mockCollection),
    files: mockFiles,
    mockCollection
  }
}

const MOCK_RECORD = {
  id: 'tpl1',
  editionId: 'edition1',
  primaryColor: '#3B82F6',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  accentColor: '#10B981',
  logoUrl: 'https://example.com/logo.png',
  logoFile: 'logo.png',
  showVenue: true,
  showDate: true,
  showQrCode: true,
  customFooterText: 'Welcome!',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('TicketTemplateRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createTicketTemplateRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a template when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('tpl1')

      expect(mockPb.collection).toHaveBeenCalledWith('ticket_templates')
      expect(result?.id).toBe('tpl1')
      expect(result?.primaryColor).toBe('#3B82F6')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return the template for an edition', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [MOCK_RECORD] })
      const result = await getRepo().findByEdition('edition1')

      expect(result?.editionId).toBe('edition1')
    })

    it('should return null when no template exists', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [] })
      const result = await getRepo().findByEdition('edition1')
      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockPb.mockCollection.getList.mockRejectedValue(new Error('Error'))
      const result = await getRepo().findByEdition('edition1')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a template', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().create({ editionId: 'edition1' })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith({ editionId: 'edition1' })
      expect(result.id).toBe('tpl1')
    })
  })

  describe('update', () => {
    it('should update a template', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, primaryColor: '#FF0000' })
      const result = await getRepo().update('tpl1', { primaryColor: '#FF0000' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('tpl1', { primaryColor: '#FF0000' })
      expect(result.primaryColor).toBe('#FF0000')
    })
  })

  describe('updateWithLogo', () => {
    it('should build FormData and update with logo file', async () => {
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      const logoFile = new File(['img'], 'logo.png', { type: 'image/png' })

      await getRepo().updateWithLogo('tpl1', { primaryColor: '#FF0000' }, logoFile)

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('tpl1', expect.any(FormData))
    })
  })

  describe('createWithLogo', () => {
    it('should build FormData and create with logo file', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const logoFile = new File(['img'], 'logo.png', { type: 'image/png' })

      await getRepo().createWithLogo({ editionId: 'edition1' }, logoFile)

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(expect.any(FormData))
    })
  })

  describe('removeLogo', () => {
    it('should set logoFile and logoUrl to null', async () => {
      mockPb.mockCollection.update.mockResolvedValue({
        ...MOCK_RECORD,
        logoFile: null,
        logoUrl: null
      })
      await getRepo().removeLogo('tpl1')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('tpl1', {
        logoFile: null,
        logoUrl: null
      })
    })
  })

  describe('delete', () => {
    it('should delete the template', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('tpl1')

      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('tpl1')
    })
  })

  describe('getLogoUrl', () => {
    it('should return logoUrl when set', () => {
      const template = {
        id: 'tpl1',
        editionId: 'edition1',
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        accentColor: '#10B981',
        logoUrl: 'https://example.com/logo.png',
        logoFile: undefined,
        showVenue: true,
        showDate: true,
        showQrCode: true,
        customFooterText: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = getRepo().getLogoUrl(template)
      expect(result).toBe('https://example.com/logo.png')
    })

    it('should return PB file URL when logoFile is set but logoUrl is not', () => {
      const template = {
        id: 'tpl1',
        editionId: 'edition1',
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        accentColor: '#10B981',
        logoUrl: undefined,
        logoFile: 'uploaded-logo.png',
        showVenue: true,
        showDate: true,
        showQrCode: true,
        customFooterText: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = getRepo().getLogoUrl(template)
      expect(result).toBe('https://cdn.example.com/logo.png')
    })

    it('should return undefined when neither logoUrl nor logoFile', () => {
      const template = {
        id: 'tpl1',
        editionId: 'edition1',
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        accentColor: '#10B981',
        logoUrl: undefined,
        logoFile: undefined,
        showVenue: true,
        showDate: true,
        showQrCode: true,
        customFooterText: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = getRepo().getLogoUrl(template)
      expect(result).toBeUndefined()
    })
  })

  describe('mapping', () => {
    it('should default colors and booleans', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({
        id: 'tpl2',
        editionId: 'edition1',
        primaryColor: '',
        backgroundColor: '',
        textColor: '',
        accentColor: '',
        logoUrl: null,
        logoFile: null,
        showVenue: false,
        showDate: false,
        showQrCode: false,
        customFooterText: null,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      })
      const result = await getRepo().findById('tpl2')

      expect(result?.primaryColor).toBe('#3B82F6')
      expect(result?.backgroundColor).toBe('#FFFFFF')
      expect(result?.textColor).toBe('#1F2937')
      expect(result?.accentColor).toBe('#10B981')
      expect(result?.showVenue).toBe(false)
      expect(result?.showDate).toBe(false)
      expect(result?.showQrCode).toBe(false)
    })
  })
})
