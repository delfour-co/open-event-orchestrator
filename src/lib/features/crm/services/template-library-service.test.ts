import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTemplateLibraryService } from './template-library-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-id',
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    update: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('TemplateLibraryService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createTemplateLibraryService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createTemplateLibraryService(pb)
  })

  describe('create', () => {
    it('should create a template', async () => {
      const result = await service.create({
        eventId: 'evt-1',
        name: 'Welcome Email',
        category: 'invitation',
        subject: 'Welcome!',
        htmlContent: '<p>Hello</p>'
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('library_templates').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-1',
          name: 'Welcome Email',
          category: 'invitation',
          subject: 'Welcome!',
          isFavorite: false,
          isPinned: false,
          usageCount: 0
        })
      )
    })

    it('should create global template', async () => {
      await service.create({
        name: 'Global Template',
        category: 'newsletter',
        subject: 'Newsletter',
        htmlContent: '<p>News</p>',
        isGlobal: true
      })

      expect(pb.collection('library_templates').create).toHaveBeenCalledWith(
        expect.objectContaining({
          isGlobal: true
        })
      )
    })
  })

  describe('update', () => {
    it('should update a template', async () => {
      await service.update('t1', { name: 'Updated Name', isFavorite: true })

      expect(pb.collection('library_templates').update).toHaveBeenCalledWith('t1', {
        name: 'Updated Name',
        isFavorite: true
      })
    })
  })

  describe('delete', () => {
    it('should delete a template', async () => {
      await service.delete('t1')

      expect(pb.collection('library_templates').delete).toHaveBeenCalledWith('t1')
    })
  })

  describe('getById', () => {
    it('should return template by id', async () => {
      pb.collection('library_templates').getOne.mockResolvedValue({
        id: 't1',
        name: 'Test',
        category: 'invitation',
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        tags: [],
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.getById('t1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('t1')
    })

    it('should return null for non-existent template', async () => {
      pb.collection('library_templates').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.getById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getByEvent', () => {
    it('should return templates for event', async () => {
      pb.collection('library_templates').getFullList.mockResolvedValue([
        {
          id: 't1',
          eventId: 'evt-1',
          name: 'Template 1',
          category: 'invitation',
          subject: 'Subject',
          htmlContent: '<p>Content</p>',
          tags: [],
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getByEvent('evt-1')

      expect(result).toHaveLength(1)
      expect(pb.collection('library_templates').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('evt-1')
        })
      )
    })

    it('should filter by category', async () => {
      await service.getByEvent('evt-1', { category: 'invitation' })

      expect(pb.collection('library_templates').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('invitation')
        })
      )
    })
  })

  describe('getGlobalTemplates', () => {
    it('should return global templates', async () => {
      pb.collection('library_templates').getFullList.mockResolvedValue([
        {
          id: 't1',
          name: 'Global',
          isGlobal: true,
          category: 'newsletter',
          subject: 'Subject',
          htmlContent: '<p>Content</p>',
          tags: [],
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getGlobalTemplates()

      expect(result).toHaveLength(1)
      expect(pb.collection('library_templates').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('isGlobal = true')
        })
      )
    })
  })

  describe('search', () => {
    it('should search templates with query', async () => {
      await service.search('evt-1', { query: 'welcome' })

      expect(pb.collection('library_templates').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('welcome')
        })
      )
    })

    it('should include global templates when eventId provided', async () => {
      await service.search('evt-1', {})

      expect(pb.collection('library_templates').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('isGlobal = true')
        })
      )
    })
  })

  describe('clone', () => {
    it('should clone a template', async () => {
      pb.collection('library_templates').getOne.mockResolvedValue({
        id: 't1',
        eventId: 'evt-1',
        name: 'Original',
        description: 'Description',
        category: 'invitation',
        subject: 'Subject',
        htmlContent: '<p>Content</p>',
        textContent: 'Content',
        tags: ['tag1', 'tag2'],
        isGlobal: false,
        isFavorite: true,
        isPinned: false,
        usageCount: 10,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.clone('t1')

      expect(result.name).toBe('Original (copy)')
      expect(pb.collection('library_templates').create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Original (copy)',
          eventId: 'evt-1',
          category: 'invitation',
          isGlobal: false
        })
      )
    })

    it('should clone to different event', async () => {
      pb.collection('library_templates').getOne.mockResolvedValue({
        id: 't1',
        eventId: 'evt-1',
        name: 'Original',
        category: 'invitation',
        subject: 'Subject',
        htmlContent: '<p>Content</p>',
        tags: [],
        created: now.toISOString(),
        updated: now.toISOString()
      })

      await service.clone('t1', 'evt-2')

      expect(pb.collection('library_templates').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-2'
        })
      )
    })

    it('should throw for non-existent template', async () => {
      pb.collection('library_templates').getOne.mockRejectedValue(new Error('Not found'))

      await expect(service.clone('non-existent')).rejects.toThrow('Template not found')
    })
  })

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      pb.collection('library_templates').getOne.mockResolvedValue({
        id: 't1',
        name: 'Test',
        category: 'invitation',
        subject: 'Subject',
        htmlContent: '<p>Content</p>',
        tags: [],
        isFavorite: false,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      await service.toggleFavorite('t1')

      expect(pb.collection('library_templates').update).toHaveBeenCalledWith('t1', {
        isFavorite: true
      })
    })
  })

  describe('togglePinned', () => {
    it('should toggle pinned status', async () => {
      pb.collection('library_templates').getOne.mockResolvedValue({
        id: 't1',
        name: 'Test',
        category: 'invitation',
        subject: 'Subject',
        htmlContent: '<p>Content</p>',
        tags: [],
        isPinned: true,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      await service.togglePinned('t1')

      expect(pb.collection('library_templates').update).toHaveBeenCalledWith('t1', {
        isPinned: false
      })
    })
  })

  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      pb.collection('library_templates').getOne.mockResolvedValue({
        id: 't1',
        name: 'Test',
        category: 'invitation',
        subject: 'Subject',
        htmlContent: '<p>Content</p>',
        tags: [],
        usageCount: 5,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      await service.incrementUsage('t1')

      expect(pb.collection('library_templates').update).toHaveBeenCalledWith('t1', {
        usageCount: 6
      })
    })
  })

  describe('getCategories', () => {
    it('should return all categories', () => {
      const categories = service.getCategories()

      expect(categories).toContain('invitation')
      expect(categories).toContain('confirmation')
      expect(categories).toContain('reminder')
      expect(categories).toContain('thank_you')
      expect(categories).toContain('newsletter')
      expect(categories).toContain('cfp')
    })
  })

  describe('getAllTags', () => {
    it('should return unique tags', async () => {
      pb.collection('library_templates').getFullList.mockResolvedValue([
        { tags: ['marketing', 'newsletter'] },
        { tags: ['marketing', 'event'] }
      ])

      const result = await service.getAllTags('evt-1')

      expect(result).toEqual(['event', 'marketing', 'newsletter'])
    })
  })

  describe('cloneCampaign', () => {
    it('should clone a campaign', async () => {
      pb.collection('email_campaigns').getOne.mockResolvedValue({
        id: 'c1',
        eventId: 'evt-1',
        editionId: 'ed-1',
        name: 'Original Campaign',
        subject: 'Subject',
        htmlContent: '<p>Content</p>',
        textContent: 'Content',
        segmentId: 'seg-1',
        status: 'sent',
        recipientCount: 100
      })

      pb.collection('email_campaigns').create.mockResolvedValue({ id: 'c2' })

      const result = await service.cloneCampaign('c1')

      expect(result).toBe('c2')
      expect(pb.collection('email_campaigns').create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Original Campaign (copy)',
          status: 'draft',
          recipientCount: 0,
          deliveredCount: 0
        })
      )
    })
  })
})
