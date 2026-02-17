import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import type { SetupToken } from '../domain'

export type SetupTokenRepository = {
  create: (token: string, expiresAt: Date) => Promise<SetupToken>
  findByToken: (token: string) => Promise<SetupToken | null>
  markAsUsed: (id: string) => Promise<SetupToken>
  deleteExpired: () => Promise<number>
  hasValidToken: () => Promise<boolean>
}

const mapToSetupToken = (record: RecordModel): SetupToken => ({
  id: record.id,
  token: record.token,
  expiresAt: new Date(record.expiresAt),
  used: record.used || false,
  usedAt: record.usedAt ? new Date(record.usedAt) : undefined,
  createdAt: new Date(record.created),
  updatedAt: new Date(record.updated)
})

export const createSetupTokenRepository = (pb: PocketBase): SetupTokenRepository => ({
  async create(token, expiresAt) {
    const record = await pb.collection('setup_tokens').create({
      token,
      expiresAt: expiresAt.toISOString(),
      used: false
    })
    return mapToSetupToken(record)
  },

  async findByToken(token) {
    try {
      const record = await pb.collection('setup_tokens').getFirstListItem(`token="${token}"`)
      return mapToSetupToken(record)
    } catch {
      return null
    }
  },

  async markAsUsed(id) {
    const record = await pb.collection('setup_tokens').update(id, {
      used: true,
      usedAt: new Date().toISOString()
    })
    return mapToSetupToken(record)
  },

  async deleteExpired() {
    const now = new Date().toISOString()
    try {
      const expiredTokens = await pb.collection('setup_tokens').getFullList({
        filter: `expiresAt < "${now}" || used = true`
      })
      for (const token of expiredTokens) {
        await pb.collection('setup_tokens').delete(token.id)
      }
      return expiredTokens.length
    } catch {
      return 0
    }
  },

  async hasValidToken() {
    const now = new Date().toISOString()
    try {
      await pb.collection('setup_tokens').getFirstListItem(`expiresAt > "${now}" && used = false`)
      return true
    } catch {
      return false
    }
  }
})
