import { createHash, randomBytes } from 'node:crypto'
import type PocketBase from 'pocketbase'
import type { ApiKey, ApiKeyPermission, CreateApiKey } from '../domain/api-key'
import { API_KEY_LENGTH, API_KEY_PREFIX, DEFAULT_RATE_LIMIT } from '../domain/api-key'

const COLLECTION = 'api_keys'

const generateApiKey = (): string => {
  const key = randomBytes(API_KEY_LENGTH).toString('base64url')
  return `${API_KEY_PREFIX}${key}`
}

const hashApiKey = (key: string): string => {
  return createHash('sha256').update(key).digest('hex')
}

const getKeyPrefix = (key: string): string => {
  return key.substring(0, 12)
}

export const createApiKeyRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<ApiKey | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToApiKey(record)
    } catch {
      return null
    }
  },

  async findByKeyPrefix(keyPrefix: string): Promise<ApiKey | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: `keyPrefix = "${keyPrefix}"`
      })
      if (records.items.length === 0) return null
      return mapRecordToApiKey(records.items[0])
    } catch {
      return null
    }
  },

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: `keyHash = "${keyHash}"`
      })
      if (records.items.length === 0) return null
      return mapRecordToApiKey(records.items[0])
    } catch {
      return null
    }
  },

  async findAllByOrganization(organizationId: string): Promise<ApiKey[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `organizationId = "${organizationId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToApiKey)
  },

  async findAllByEvent(eventId: string): Promise<ApiKey[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `eventId = "${eventId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToApiKey)
  },

  async findAllByEdition(editionId: string): Promise<ApiKey[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToApiKey)
  },

  async create(
    input: CreateApiKey,
    createdBy: string
  ): Promise<{ apiKey: ApiKey; plainTextKey: string }> {
    const plainTextKey = generateApiKey()
    const keyHash = hashApiKey(plainTextKey)
    const keyPrefix = getKeyPrefix(plainTextKey)

    const record = await pb.collection(COLLECTION).create({
      name: input.name,
      keyHash,
      keyPrefix,
      organizationId: input.organizationId || null,
      eventId: input.eventId || null,
      editionId: input.editionId || null,
      permissions: input.permissions,
      rateLimit: input.rateLimit || DEFAULT_RATE_LIMIT,
      expiresAt: input.expiresAt ? input.expiresAt.toISOString() : null,
      isActive: true,
      createdBy
    })

    return {
      apiKey: mapRecordToApiKey(record),
      plainTextKey
    }
  },

  async updateLastUsed(id: string): Promise<void> {
    await pb.collection(COLLECTION).update(id, {
      lastUsedAt: new Date().toISOString()
    })
  },

  async revoke(id: string): Promise<void> {
    await pb.collection(COLLECTION).update(id, {
      isActive: false
    })
  },

  async reactivate(id: string): Promise<void> {
    await pb.collection(COLLECTION).update(id, {
      isActive: true
    })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async validateKey(
    keyString: string
  ): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
    if (!keyString.startsWith(API_KEY_PREFIX)) {
      return { valid: false, error: 'Invalid key format' }
    }

    const keyHash = hashApiKey(keyString)
    const apiKey = await this.findByHash(keyHash)

    if (!apiKey) {
      return { valid: false, error: 'Key not found' }
    }

    if (!apiKey.isActive) {
      return { valid: false, error: 'Key has been revoked' }
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { valid: false, error: 'Key has expired' }
    }

    // Update last used timestamp
    await this.updateLastUsed(apiKey.id)

    return { valid: true, apiKey }
  }
})

const mapRecordToApiKey = (record: Record<string, unknown>): ApiKey => ({
  id: record.id as string,
  name: record.name as string,
  keyHash: record.keyHash as string,
  keyPrefix: record.keyPrefix as string,
  organizationId: record.organizationId as string | undefined,
  eventId: record.eventId as string | undefined,
  editionId: record.editionId as string | undefined,
  permissions: (record.permissions as ApiKeyPermission[]) || [],
  rateLimit: (record.rateLimit as number) || DEFAULT_RATE_LIMIT,
  lastUsedAt: record.lastUsedAt ? new Date(record.lastUsedAt as string) : undefined,
  expiresAt: record.expiresAt ? new Date(record.expiresAt as string) : undefined,
  isActive: record.isActive as boolean,
  createdBy: record.createdBy as string,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ApiKeyRepository = ReturnType<typeof createApiKeyRepository>
