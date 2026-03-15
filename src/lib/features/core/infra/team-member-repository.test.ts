import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTeamMemberRepository } from './team-member-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...parts: string[]) => parts.join(' && ')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeTeamMemberRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'tm1',
  editionId: 'ed1',
  slug: 'john-doe',
  name: 'John Doe',
  team: 'Core Team',
  role: 'Lead Organizer',
  bio: 'A short bio',
  photo: 'photo.jpg',
  photoUrl: 'https://example.com/photo.jpg',
  socials: [{ name: 'twitter', icon: 'twitter', url: 'https://twitter.com/john' }],
  displayOrder: 1,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('TeamMemberRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return team member when found', async () => {
      const record = makeTeamMemberRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tm1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('tm1')
      expect(result?.editionId).toBe('ed1')
      expect(result?.slug).toBe('john-doe')
      expect(result?.name).toBe('John Doe')
      expect(result?.team).toBe('Core Team')
      expect(result?.role).toBe('Lead Organizer')
      expect(result?.bio).toBe('A short bio')
      expect(result?.photo).toBe('photo.jpg')
      expect(result?.photoUrl).toBe('https://example.com/photo.jpg')
      expect(result?.socials).toEqual([
        { name: 'twitter', icon: 'twitter', url: 'https://twitter.com/john' }
      ])
      expect(result?.displayOrder).toBe(1)
      expect(result?.created).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(result?.updated).toEqual(new Date('2024-01-02T00:00:00Z'))
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should map empty optional fields to undefined', async () => {
      const record = makeTeamMemberRecord({
        team: '',
        role: '',
        bio: '',
        photo: '',
        photoUrl: ''
      })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tm1')

      expect(result?.team).toBeUndefined()
      expect(result?.role).toBeUndefined()
      expect(result?.bio).toBeUndefined()
      expect(result?.photo).toBeUndefined()
      expect(result?.photoUrl).toBeUndefined()
    })

    it('should default socials to empty array when not an array', async () => {
      const record = makeTeamMemberRecord({ socials: null })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tm1')

      expect(result?.socials).toEqual([])
    })

    it('should default displayOrder to 0 when falsy', async () => {
      const record = makeTeamMemberRecord({ displayOrder: 0 })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tm1')

      expect(result?.displayOrder).toBe(0)
    })
  })

  describe('findBySlug', () => {
    it('should return team member when found by edition and slug', async () => {
      const record = makeTeamMemberRecord()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue(record)
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('ed1', 'john-doe')

      expect(result).not.toBeNull()
      expect(result?.slug).toBe('john-doe')
      expect(mockPb._mockCollection).toHaveBeenCalledWith('team_members')
    })

    it('should return null when slug not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('ed1', 'nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return team members sorted by displayOrder and name', async () => {
      const records = [
        makeTeamMemberRecord({ id: 'tm1', displayOrder: 0 }),
        makeTeamMemberRecord({ id: 'tm2', displayOrder: 1 })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('ed1'),
          sort: 'displayOrder,name'
        })
      )
    })
  })

  describe('findByTeam', () => {
    it('should return team members filtered by edition and team', async () => {
      const records = [makeTeamMemberRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByTeam('ed1', 'Core Team')

      expect(result).toHaveLength(1)
      const filter = mockGetFullList.mock.calls[0][0].filter
      expect(filter).toContain('ed1')
      expect(filter).toContain('Core Team')
    })
  })

  describe('getTeams', () => {
    it('should return unique sorted team names', async () => {
      const records = [
        { team: 'Volunteers' },
        { team: 'Core Team' },
        { team: 'Volunteers' },
        { team: 'Staff' }
      ]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.getTeams('ed1')

      expect(result).toEqual(['Core Team', 'Staff', 'Volunteers'])
    })

    it('should return empty array when no teams', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.getTeams('ed1')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a team member with all fields', async () => {
      const record = makeTeamMemberRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        slug: 'john-doe',
        name: 'John Doe',
        team: 'Core Team',
        role: 'Lead Organizer',
        bio: 'A short bio',
        photoUrl: 'https://example.com/photo.jpg',
        socials: [{ name: 'twitter', icon: 'twitter', url: 'https://twitter.com/john' }],
        displayOrder: 1
      })

      expect(mockCreate).toHaveBeenCalledWith({
        editionId: 'ed1',
        slug: 'john-doe',
        name: 'John Doe',
        team: 'Core Team',
        role: 'Lead Organizer',
        bio: 'A short bio',
        photoUrl: 'https://example.com/photo.jpg',
        socials: [{ name: 'twitter', icon: 'twitter', url: 'https://twitter.com/john' }],
        displayOrder: 1
      })
      expect(result.id).toBe('tm1')
      expect(result.name).toBe('John Doe')
    })

    it('should default optional fields when not provided', async () => {
      const record = makeTeamMemberRecord({ team: '', role: '', bio: '', photoUrl: '' })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        slug: 'jane',
        name: 'Jane'
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          team: '',
          role: '',
          bio: '',
          photoUrl: '',
          socials: [],
          displayOrder: 0
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeTeamMemberRecord({ name: 'Updated Name', role: 'New Role' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('tm1', { name: 'Updated Name', role: 'New Role' })

      expect(mockUpdate).toHaveBeenCalledWith('tm1', {
        name: 'Updated Name',
        role: 'New Role'
      })
      expect(result.name).toBe('Updated Name')
    })

    it('should not include undefined fields in update', async () => {
      const record = makeTeamMemberRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      await repo.update('tm1', { name: 'Only Name' })

      const callArg = mockUpdate.mock.calls[0][1]
      expect(callArg).toEqual({ name: 'Only Name' })
      expect(callArg).not.toHaveProperty('role')
      expect(callArg).not.toHaveProperty('team')
    })
  })

  describe('updatePhoto', () => {
    it('should update photo with FormData', async () => {
      const record = makeTeamMemberRecord({ photo: 'new-photo.jpg' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      const result = await repo.updatePhoto('tm1', file)

      expect(mockUpdate).toHaveBeenCalledWith('tm1', expect.any(FormData))
      expect(result.photo).toBe('new-photo.jpg')
    })
  })

  describe('removePhoto', () => {
    it('should set photo to null', async () => {
      const record = makeTeamMemberRecord({ photo: '' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      await repo.removePhoto('tm1')

      expect(mockUpdate).toHaveBeenCalledWith('tm1', { photo: null })
    })
  })

  describe('delete', () => {
    it('should delete team member by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      await repo.delete('tm1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('team_members')
      expect(mockDelete).toHaveBeenCalledWith('tm1')
    })
  })

  describe('reorder', () => {
    it('should update displayOrder for each member', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTeamMemberRepository(mockPb as unknown as PocketBase)
      await repo.reorder('ed1', ['tm3', 'tm1', 'tm2'])

      expect(mockUpdate).toHaveBeenCalledTimes(3)
      expect(mockUpdate).toHaveBeenCalledWith('tm3', { displayOrder: 0 })
      expect(mockUpdate).toHaveBeenCalledWith('tm1', { displayOrder: 1 })
      expect(mockUpdate).toHaveBeenCalledWith('tm2', { displayOrder: 2 })
    })
  })
})
