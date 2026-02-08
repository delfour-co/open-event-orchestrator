import { randomBytes } from 'node:crypto'
import { filterAnd, filterOr, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { SponsorToken } from '../domain'
import { TOKEN_LENGTH, getTokenExpiryDate } from '../domain'

const COLLECTION = 'sponsor_tokens'

const generateSponsorToken = (): string => {
  return randomBytes(TOKEN_LENGTH).toString('hex')
}

export const createSponsorTokenRepository = (pb: PocketBase) => ({
  async findByToken(token: string): Promise<SponsorToken | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: safeFilter`token = ${token}`
      })
      if (records.items.length === 0) return null
      return mapRecordToToken(records.items[0])
    } catch {
      return null
    }
  },

  async findByEditionSponsor(editionSponsorId: string): Promise<SponsorToken | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: safeFilter`editionSponsorId = ${editionSponsorId}`,
        sort: '-created'
      })
      if (records.items.length === 0) return null
      return mapRecordToToken(records.items[0])
    } catch {
      return null
    }
  },

  async findValidByEditionSponsor(editionSponsorId: string): Promise<SponsorToken | null> {
    try {
      const now = new Date().toISOString()
      const expiryCondition = filterOr('expiresAt = ""', safeFilter`expiresAt > ${now}`)
      const filter = filterAnd(safeFilter`editionSponsorId = ${editionSponsorId}`, expiryCondition)
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter,
        sort: '-created'
      })
      if (records.items.length === 0) return null
      return mapRecordToToken(records.items[0])
    } catch {
      return null
    }
  },

  async create(editionSponsorId: string, expiryDays?: number): Promise<SponsorToken> {
    const token = generateSponsorToken()
    const expiresAt = expiryDays ? getTokenExpiryDate(expiryDays) : getTokenExpiryDate()

    const record = await pb.collection(COLLECTION).create({
      editionSponsorId,
      token,
      expiresAt: expiresAt.toISOString()
    })
    return mapRecordToToken(record)
  },

  async updateLastUsed(id: string): Promise<void> {
    await pb.collection(COLLECTION).update(id, {
      lastUsedAt: new Date().toISOString()
    })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async deleteByEditionSponsor(editionSponsorId: string): Promise<void> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId}`
    })
    for (const record of records) {
      await pb.collection(COLLECTION).delete(record.id)
    }
  },

  async refreshToken(editionSponsorId: string, expiryDays?: number): Promise<SponsorToken> {
    // Delete existing tokens
    await this.deleteByEditionSponsor(editionSponsorId)

    // Create new token
    return this.create(editionSponsorId, expiryDays)
  }
})

const mapRecordToToken = (record: Record<string, unknown>): SponsorToken => ({
  id: record.id as string,
  editionSponsorId: record.editionSponsorId as string,
  token: record.token as string,
  expiresAt: record.expiresAt ? new Date(record.expiresAt as string) : undefined,
  lastUsedAt: record.lastUsedAt ? new Date(record.lastUsedAt as string) : undefined,
  createdAt: new Date(record.created as string)
})

export type SponsorTokenRepository = ReturnType<typeof createSponsorTokenRepository>
