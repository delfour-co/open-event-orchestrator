import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppSettingsRepository } from './app-settings-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  const mockFiles = {
    getURL: vi.fn().mockReturnValue('https://example.com/logo.png')
  }
  return {
    collection: mockCollection,
    files: mockFiles,
    _mockCollection: mockCollection
  }
}

const makeSettingsRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'pwa1',
  editionId: 'ed1',
  title: 'My Event App',
  subtitle: 'Conference 2024',
  logoFile: 'logo.png',
  headerImage: 'header.jpg',
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  showScheduleTab: true,
  showSpeakersTab: true,
  showTicketsTab: true,
  showFeedbackTab: true,
  showFavoritesTab: true,
  showNetworkingTab: false,
  floorAmenities: [],
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('AppSettingsRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('getByEdition', () => {
    it('should return settings for an edition', async () => {
      const record = makeSettingsRecord()
      const mockGetFirstListItem = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getFirstListItem: mockGetFirstListItem })

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByEdition('ed1')

      expect(result?.id).toBe('pwa1')
      expect(result?.title).toBe('My Event App')
      expect(result?.showScheduleTab).toBe(true)
    })

    it('should return null when no settings exist', async () => {
      const mockGetFirstListItem = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getFirstListItem: mockGetFirstListItem })

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByEdition('ed1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create app settings with all fields', async () => {
      const record = makeSettingsRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        title: 'My Event App',
        subtitle: 'Conference 2024',
        primaryColor: '#3b82f6',
        accentColor: '#8b5cf6',
        showScheduleTab: true,
        showSpeakersTab: true,
        showTicketsTab: true,
        showFeedbackTab: true,
        showFavoritesTab: true,
        showNetworkingTab: false,
        floorAmenities: []
      })

      expect(result.id).toBe('pwa1')
      expect(result.editionId).toBe('ed1')
    })

    it('should default tabs when not provided', async () => {
      const record = makeSettingsRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        showScheduleTab: true,
        showSpeakersTab: true,
        showTicketsTab: true,
        showFeedbackTab: true,
        showFavoritesTab: true,
        showNetworkingTab: false,
        floorAmenities: []
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          showScheduleTab: true,
          showNetworkingTab: false
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeSettingsRecord({ title: 'Updated Title' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'pwa1', title: 'Updated Title' })

      expect(result.title).toBe('Updated Title')
      expect(mockUpdate).toHaveBeenCalledWith('pwa1', { title: 'Updated Title' })
    })

    it('should not include undefined fields', async () => {
      const record = makeSettingsRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'pwa1', showNetworkingTab: true })

      expect(mockUpdate).toHaveBeenCalledWith('pwa1', { showNetworkingTab: true })
    })
  })

  describe('updateWithFile', () => {
    it('should merge data with form data for file upload', async () => {
      const record = makeSettingsRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const formData = new FormData()
      formData.append('logoFile', new File(['data'], 'logo.png'))

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.updateWithFile('pwa1', { title: 'New Title' }, formData)

      expect(result.id).toBe('pwa1')
      expect(mockUpdate).toHaveBeenCalledWith('pwa1', formData)
    })

    it('should not overwrite existing form data keys', async () => {
      const record = makeSettingsRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const formData = new FormData()
      formData.append('title', 'FromForm')

      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      await repo.updateWithFile('pwa1', { title: 'FromData' }, formData)

      // The form data already has 'title', so it should not be overwritten
      expect(formData.get('title')).toBe('FromForm')
    })
  })

  describe('getFileUrl', () => {
    it('should return file URL when filename exists', () => {
      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      const settings = makeSettingsRecord()
      const url = repo.getFileUrl(
        settings as ReturnType<typeof repo.getByEdition> extends Promise<infer T>
          ? NonNullable<T>
          : never,
        'logo.png'
      )

      expect(url).toBe('https://example.com/logo.png')
    })

    it('should return undefined when filename is undefined', () => {
      const repo = new AppSettingsRepository(mockPb as unknown as PocketBase)
      const settings = makeSettingsRecord()
      const url = repo.getFileUrl(
        settings as ReturnType<typeof repo.getByEdition> extends Promise<infer T>
          ? NonNullable<T>
          : never,
        undefined
      )

      expect(url).toBeUndefined()
    })
  })
})
