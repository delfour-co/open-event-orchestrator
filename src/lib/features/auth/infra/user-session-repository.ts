import type PocketBase from 'pocketbase'
import { type UserSession, parseUserAgent, userSessionSchema } from '../domain/user-session'

export interface UserSessionRepository {
  /**
   * Find or create a session using a stable session ID
   */
  upsertSession(params: {
    userId: string
    sessionId: string
    userAgent: string
    ipAddress: string
  }): Promise<UserSession>

  /**
   * Get all sessions for a user
   */
  getSessionsForUser(userId: string): Promise<UserSession[]>

  /**
   * Get the current session by session ID
   */
  getCurrentSession(userId: string, sessionId: string): Promise<UserSession | null>

  /**
   * Delete a specific session
   */
  deleteSession(sessionId: string): Promise<void>

  /**
   * Delete all sessions for a user except the current one
   */
  deleteOtherSessions(userId: string, currentSessionId: string): Promise<number>

  /**
   * Delete all sessions for a user (on logout)
   */
  deleteAllSessions(userId: string): Promise<void>

  /**
   * Update last active timestamp for a session
   */
  updateLastActive(sessionId: string): Promise<void>
}

interface PocketBaseSession {
  id: string
  userId: string
  tokenHash: string
  userAgent: string
  ipAddress: string
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
  device?: string
  city?: string
  country?: string
  lastActive: string
  created: string
  updated: string
}

function mapToUserSession(record: PocketBaseSession): UserSession {
  return userSessionSchema.parse({
    id: record.id,
    userId: record.userId,
    tokenHash: record.tokenHash,
    userAgent: record.userAgent || '',
    ipAddress: record.ipAddress || '',
    browser: record.browser,
    browserVersion: record.browserVersion,
    os: record.os,
    osVersion: record.osVersion,
    device: record.device,
    city: record.city,
    country: record.country,
    lastActive: new Date(record.lastActive),
    createdAt: new Date(record.created),
    updatedAt: new Date(record.updated)
  })
}

export function createUserSessionRepository(pb: PocketBase): UserSessionRepository {
  return {
    async upsertSession({ userId, sessionId, userAgent, ipAddress }) {
      const parsed = parseUserAgent(userAgent)

      // Try to find existing session by sessionId (stored in tokenHash field)
      try {
        const existing = await pb
          .collection('user_sessions')
          .getFirstListItem<PocketBaseSession>(`userId = "${userId}" && tokenHash = "${sessionId}"`)

        // Update last active
        const updated = await pb
          .collection('user_sessions')
          .update<PocketBaseSession>(existing.id, {
            lastActive: new Date().toISOString(),
            userAgent,
            ipAddress,
            ...parsed
          })

        return mapToUserSession(updated)
      } catch {
        // Session doesn't exist, create new one
        const created = await pb.collection('user_sessions').create<PocketBaseSession>({
          userId,
          tokenHash: sessionId, // Store sessionId in tokenHash field
          userAgent,
          ipAddress,
          lastActive: new Date().toISOString(),
          ...parsed
        })

        return mapToUserSession(created)
      }
    },

    async getSessionsForUser(userId) {
      const records = await pb.collection('user_sessions').getFullList<PocketBaseSession>({
        filter: `userId = "${userId}"`,
        sort: '-lastActive'
      })

      return records.map(mapToUserSession)
    },

    async getCurrentSession(userId, sessionId) {
      try {
        const record = await pb
          .collection('user_sessions')
          .getFirstListItem<PocketBaseSession>(`userId = "${userId}" && tokenHash = "${sessionId}"`)
        return mapToUserSession(record)
      } catch {
        return null
      }
    },

    async deleteSession(sessionId) {
      await pb.collection('user_sessions').delete(sessionId)
    },

    async deleteOtherSessions(userId, currentSessionId) {
      const sessions = await pb.collection('user_sessions').getFullList<PocketBaseSession>({
        filter: `userId = "${userId}" && tokenHash != "${currentSessionId}"`
      })

      for (const session of sessions) {
        await pb.collection('user_sessions').delete(session.id)
      }

      return sessions.length
    },

    async deleteAllSessions(userId) {
      const sessions = await pb.collection('user_sessions').getFullList<PocketBaseSession>({
        filter: `userId = "${userId}"`
      })

      for (const session of sessions) {
        await pb.collection('user_sessions').delete(session.id)
      }
    },

    async updateLastActive(sessionId) {
      await pb.collection('user_sessions').update(sessionId, {
        lastActive: new Date().toISOString()
      })
    }
  }
}
