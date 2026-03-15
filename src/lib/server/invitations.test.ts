import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) => {
    let result = ''
    for (let i = 0; i < strings.length; i++) {
      result += strings[i]
      if (i < values.length) result += `"${values[i]}"`
    }
    return result
  },
  filterAnd: (...conditions: string[]) => conditions.filter(Boolean).join(' && ')
}))

import { processPendingInvitations } from './invitations'

describe('invitations', () => {
  let mockPb: PocketBase
  let mockCollections: Record<string, Record<string, ReturnType<typeof vi.fn>>>

  beforeEach(() => {
    mockCollections = {
      organization_invitations: {
        getFullList: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({})
      },
      organization_members: {
        getFirstListItem: vi.fn(),
        create: vi.fn().mockResolvedValue({})
      },
      users: {
        getOne: vi.fn().mockResolvedValue({ role: 'attendee' }),
        update: vi.fn().mockResolvedValue({})
      }
    }

    mockPb = {
      collection: vi.fn((name: string) => mockCollections[name])
    } as unknown as PocketBase
  })

  describe('processPendingInvitations', () => {
    it('should return 0 when there are no pending invitations', async () => {
      mockCollections.organization_invitations.getFullList.mockResolvedValue([])

      const count = await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(count).toBe(0)
    })

    it('should mark expired invitations as expired', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      mockCollections.organization_invitations.getFullList.mockResolvedValue([
        {
          id: 'inv1',
          organizationId: 'org1',
          role: 'organizer',
          expiresAt: pastDate.toISOString(),
          status: 'pending'
        }
      ])

      const count = await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(count).toBe(0)
      expect(mockCollections.organization_invitations.update).toHaveBeenCalledWith('inv1', {
        status: 'expired'
      })
    })

    it('should mark invitation as accepted when user is already a member', async () => {
      mockCollections.organization_invitations.getFullList.mockResolvedValue([
        {
          id: 'inv2',
          organizationId: 'org1',
          role: 'organizer',
          expiresAt: null,
          status: 'pending'
        }
      ])

      // User is already a member
      mockCollections.organization_members.getFirstListItem.mockResolvedValue({
        id: 'member1',
        userId: 'user1',
        organizationId: 'org1'
      })

      const count = await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(count).toBe(0)
      expect(mockCollections.organization_invitations.update).toHaveBeenCalledWith('inv2', {
        status: 'accepted'
      })
    })

    it('should add user to organization and accept invitation', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      mockCollections.organization_invitations.getFullList.mockResolvedValue([
        {
          id: 'inv3',
          organizationId: 'org1',
          role: 'organizer',
          expiresAt: futureDate.toISOString(),
          status: 'pending'
        }
      ])

      // User is NOT a member (throws)
      mockCollections.organization_members.getFirstListItem.mockRejectedValue(
        new Error('Not found')
      )

      const count = await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(count).toBe(1)
      expect(mockCollections.organization_members.create).toHaveBeenCalledWith({
        organizationId: 'org1',
        userId: 'user1',
        role: 'organizer'
      })
      expect(mockCollections.organization_invitations.update).toHaveBeenCalledWith('inv3', {
        status: 'accepted'
      })
    })

    it('should process invitation without expiresAt as non-expired', async () => {
      mockCollections.organization_invitations.getFullList.mockResolvedValue([
        {
          id: 'inv4',
          organizationId: 'org1',
          role: 'reviewer',
          expiresAt: null,
          status: 'pending'
        }
      ])

      mockCollections.organization_members.getFirstListItem.mockRejectedValue(
        new Error('Not found')
      )

      const count = await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(count).toBe(1)
    })

    it('should update user role to the highest granted role', async () => {
      mockCollections.organization_invitations.getFullList.mockResolvedValue([
        {
          id: 'inv5',
          organizationId: 'org1',
          role: 'reviewer',
          expiresAt: null,
          status: 'pending'
        },
        {
          id: 'inv6',
          organizationId: 'org2',
          role: 'admin',
          expiresAt: null,
          status: 'pending'
        }
      ])

      mockCollections.organization_members.getFirstListItem.mockRejectedValue(
        new Error('Not found')
      )
      mockCollections.users.getOne.mockResolvedValue({ role: 'attendee' })

      const count = await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(count).toBe(2)
      expect(mockCollections.users.update).toHaveBeenCalledWith('user1', { role: 'admin' })
    })

    it('should not downgrade user role', async () => {
      mockCollections.organization_invitations.getFullList.mockResolvedValue([
        {
          id: 'inv7',
          organizationId: 'org1',
          role: 'reviewer',
          expiresAt: null,
          status: 'pending'
        }
      ])

      mockCollections.organization_members.getFirstListItem.mockRejectedValue(
        new Error('Not found')
      )
      mockCollections.users.getOne.mockResolvedValue({ role: 'admin' })

      await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(mockCollections.users.update).not.toHaveBeenCalled()
    })

    it('should handle errors silently and return 0', async () => {
      mockCollections.organization_invitations.getFullList.mockRejectedValue(new Error('DB error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const count = await processPendingInvitations(mockPb, 'user1', 'user@test.com')

      expect(count).toBe(0)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
