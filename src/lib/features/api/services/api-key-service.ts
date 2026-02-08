import type PocketBase from 'pocketbase'
import type { ApiKey, ApiKeyPermission, ApiKeyScope, CreateApiKey } from '../domain'
import { hasPermission, isApiKeyValid, matchesScope } from '../domain'
import { createApiKeyRepository } from '../infra'

export interface ValidateApiKeyResult {
  valid: boolean
  apiKey?: ApiKey
  scope?: ApiKeyScope
  error?: string
}

export interface GenerateApiKeyResult {
  apiKey: ApiKey
  plainTextKey: string
}

export const createApiKeyService = (pb: PocketBase) => {
  const repo = createApiKeyRepository(pb)

  return {
    async generate(input: CreateApiKey, createdBy: string): Promise<GenerateApiKeyResult> {
      const { apiKey, plainTextKey } = await repo.create(input, createdBy)
      return { apiKey, plainTextKey }
    },

    async validate(keyString: string): Promise<ValidateApiKeyResult> {
      const result = await repo.validateKey(keyString)

      if (!result.valid || !result.apiKey) {
        return { valid: false, error: result.error }
      }

      const apiKey = result.apiKey

      if (!isApiKeyValid(apiKey)) {
        return { valid: false, error: 'API key is not valid' }
      }

      const scope: ApiKeyScope = {
        organizationId: apiKey.organizationId,
        eventId: apiKey.eventId,
        editionId: apiKey.editionId
      }

      return { valid: true, apiKey, scope }
    },

    async revoke(keyId: string): Promise<void> {
      await repo.revoke(keyId)
    },

    async reactivate(keyId: string): Promise<void> {
      await repo.reactivate(keyId)
    },

    async delete(keyId: string): Promise<void> {
      await repo.delete(keyId)
    },

    async listByOrganization(organizationId: string): Promise<ApiKey[]> {
      return repo.findAllByOrganization(organizationId)
    },

    async listByEvent(eventId: string): Promise<ApiKey[]> {
      return repo.findAllByEvent(eventId)
    },

    async listByEdition(editionId: string): Promise<ApiKey[]> {
      return repo.findAllByEdition(editionId)
    },

    async getById(id: string): Promise<ApiKey | null> {
      return repo.findById(id)
    },

    checkPermission(apiKey: ApiKey, permission: ApiKeyPermission): boolean {
      return hasPermission(apiKey, permission)
    },

    checkScope(apiKey: ApiKey, scope: ApiKeyScope): boolean {
      return matchesScope(apiKey, scope)
    },

    async checkAccess(
      apiKey: ApiKey,
      permission: ApiKeyPermission,
      scope: ApiKeyScope
    ): Promise<{ allowed: boolean; error?: string }> {
      if (!isApiKeyValid(apiKey)) {
        return { allowed: false, error: 'API key is not valid or has expired' }
      }

      if (!hasPermission(apiKey, permission)) {
        return { allowed: false, error: `Missing permission: ${permission}` }
      }

      if (!matchesScope(apiKey, scope)) {
        return { allowed: false, error: 'API key does not have access to this resource' }
      }

      return { allowed: true }
    }
  }
}

export type ApiKeyService = ReturnType<typeof createApiKeyService>
