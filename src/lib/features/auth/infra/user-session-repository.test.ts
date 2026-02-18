import { describe, expect, it, vi } from 'vitest'
import { createUserSessionRepository } from './user-session-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

describe('UserSessionRepository', () => {
  describe('upsertSession', () => {
    it('should create a new session when none exists', async () => {
      const mockPb = createMockPb()
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        tokenHash: 'abc123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        ipAddress: '192.168.1.1',
        browser: 'Chrome',
        browserVersion: '120.0.0.0',
        os: 'Windows',
        osVersion: '10/11',
        device: 'Desktop',
        lastActive: '2024-01-15T10:00:00.000Z',
        created: '2024-01-15T09:00:00.000Z',
        updated: '2024-01-15T10:00:00.000Z'
      })

      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found')),
        create: mockCreate
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      const result = await repo.upsertSession({
        userId: 'user1',
        sessionId: 'session-uuid-123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        ipAddress: '192.168.1.1'
      })

      expect(result.id).toBe('session1')
      expect(result.browser).toBe('Chrome')
      expect(result.os).toBe('Windows')
      expect(mockCreate).toHaveBeenCalled()
    })

    it('should update existing session', async () => {
      const mockPb = createMockPb()
      const mockUpdate = vi.fn().mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        tokenHash: 'session-uuid-123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        ipAddress: '192.168.1.2',
        browser: 'Chrome',
        browserVersion: '120.0.0.0',
        os: 'Windows',
        osVersion: '10/11',
        device: 'Desktop',
        lastActive: '2024-01-15T11:00:00.000Z',
        created: '2024-01-15T09:00:00.000Z',
        updated: '2024-01-15T11:00:00.000Z'
      })

      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue({ id: 'session1' }),
        update: mockUpdate
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      const result = await repo.upsertSession({
        userId: 'user1',
        sessionId: 'session-uuid-123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        ipAddress: '192.168.1.2'
      })

      expect(result.id).toBe('session1')
      expect(mockUpdate).toHaveBeenCalledWith('session1', expect.any(Object))
    })
  })

  describe('getSessionsForUser', () => {
    it('should return all sessions for a user sorted by last active', async () => {
      const mockPb = createMockPb()
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          {
            id: 'session1',
            userId: 'user1',
            tokenHash: 'hash1',
            userAgent: 'Chrome',
            ipAddress: '192.168.1.1',
            browser: 'Chrome',
            os: 'Windows',
            device: 'Desktop',
            lastActive: '2024-01-15T11:00:00.000Z',
            created: '2024-01-15T09:00:00.000Z',
            updated: '2024-01-15T11:00:00.000Z'
          },
          {
            id: 'session2',
            userId: 'user1',
            tokenHash: 'hash2',
            userAgent: 'Firefox',
            ipAddress: '192.168.1.2',
            browser: 'Firefox',
            os: 'macOS',
            device: 'Desktop',
            lastActive: '2024-01-15T10:00:00.000Z',
            created: '2024-01-15T08:00:00.000Z',
            updated: '2024-01-15T10:00:00.000Z'
          }
        ])
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      const sessions = await repo.getSessionsForUser('user1')

      expect(sessions).toHaveLength(2)
      expect(sessions[0].id).toBe('session1')
      expect(sessions[1].id).toBe('session2')
    })
  })

  describe('getCurrentSession', () => {
    it('should return the current session by session ID', async () => {
      const mockPb = createMockPb()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue({
          id: 'session1',
          userId: 'user1',
          tokenHash: 'session-uuid-123',
          userAgent: 'Chrome',
          ipAddress: '192.168.1.1',
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
          lastActive: '2024-01-15T10:00:00.000Z',
          created: '2024-01-15T09:00:00.000Z',
          updated: '2024-01-15T10:00:00.000Z'
        })
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      const session = await repo.getCurrentSession('user1', 'session-uuid-123')

      expect(session).not.toBeNull()
      expect(session?.id).toBe('session1')
    })

    it('should return null when session not found', async () => {
      const mockPb = createMockPb()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      const session = await repo.getCurrentSession('user1', 'invalid-session-id')

      expect(session).toBeNull()
    })
  })

  describe('deleteSession', () => {
    it('should delete a session by id', async () => {
      const mockPb = createMockPb()
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        delete: mockDelete
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      await repo.deleteSession('session1')

      expect(mockDelete).toHaveBeenCalledWith('session1')
    })
  })

  describe('deleteOtherSessions', () => {
    it('should delete all sessions except the current one', async () => {
      const mockPb = createMockPb()
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([{ id: 'session2' }, { id: 'session3' }]),
        delete: mockDelete
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      const count = await repo.deleteOtherSessions('user1', 'current-session-id')

      expect(count).toBe(2)
      expect(mockDelete).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteAllSessions', () => {
    it('should delete all sessions for a user', async () => {
      const mockPb = createMockPb()
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi
          .fn()
          .mockResolvedValue([{ id: 'session1' }, { id: 'session2' }, { id: 'session3' }]),
        delete: mockDelete
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      await repo.deleteAllSessions('user1')

      expect(mockDelete).toHaveBeenCalledTimes(3)
    })
  })

  describe('updateLastActive', () => {
    it('should update the last active timestamp', async () => {
      const mockPb = createMockPb()
      const mockUpdate = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        update: mockUpdate
      })

      const repo = createUserSessionRepository(
        mockPb as unknown as Parameters<typeof createUserSessionRepository>[0]
      )
      await repo.updateLastActive('session1')

      expect(mockUpdate).toHaveBeenCalledWith('session1', {
        lastActive: expect.any(String)
      })
    })
  })
})
