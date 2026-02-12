/**
 * Secret Link Repository
 *
 * Handles persistence of secret submission links in PocketBase
 */

import type PocketBase from 'pocketbase'
import {
  type CreateSecretLink,
  type SecretLink,
  type UpdateSecretLink,
  generateSecretToken
} from '../domain/secret-link'

export interface SecretLinkRepository {
  findById(id: string): Promise<SecretLink | null>
  findByToken(token: string): Promise<SecretLink | null>
  findByEdition(editionId: string): Promise<SecretLink[]>
  create(input: CreateSecretLink): Promise<SecretLink>
  update(input: UpdateSecretLink): Promise<SecretLink>
  delete(id: string): Promise<void>
  incrementUsage(id: string): Promise<SecretLink>
}

function mapToSecretLink(record: Record<string, unknown>): SecretLink {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    token: record.token as string,
    name: (record.name as string) || undefined,
    description: (record.description as string) || undefined,
    expiresAt: record.expiresAt ? new Date(record.expiresAt as string) : undefined,
    maxSubmissions: (record.maxSubmissions as number) || undefined,
    usedSubmissions: (record.usedSubmissions as number) || 0,
    isActive: record.isActive !== false,
    createdBy: record.createdBy as string,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createSecretLinkRepository(pb: PocketBase): SecretLinkRepository {
  return {
    async findById(id: string): Promise<SecretLink | null> {
      try {
        const record = await pb.collection('secret_links').getOne(id)
        return mapToSecretLink(record)
      } catch {
        return null
      }
    },

    async findByToken(token: string): Promise<SecretLink | null> {
      try {
        const record = await pb.collection('secret_links').getFirstListItem(`token="${token}"`)
        return mapToSecretLink(record)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<SecretLink[]> {
      const records = await pb.collection('secret_links').getFullList({
        filter: `editionId="${editionId}"`,
        sort: '-created'
      })
      return records.map(mapToSecretLink)
    },

    async create(input: CreateSecretLink): Promise<SecretLink> {
      const token = generateSecretToken()

      const record = await pb.collection('secret_links').create({
        editionId: input.editionId,
        token,
        name: input.name || null,
        description: input.description || null,
        expiresAt: input.expiresAt?.toISOString() || null,
        maxSubmissions: input.maxSubmissions || null,
        usedSubmissions: 0,
        isActive: input.isActive ?? true,
        createdBy: input.createdBy
      })

      return mapToSecretLink(record)
    },

    async update(input: UpdateSecretLink): Promise<SecretLink> {
      const data: Record<string, unknown> = {}

      if (input.name !== undefined) {
        data.name = input.name || null
      }
      if (input.description !== undefined) {
        data.description = input.description || null
      }
      if (input.expiresAt !== undefined) {
        data.expiresAt = input.expiresAt?.toISOString() || null
      }
      if (input.maxSubmissions !== undefined) {
        data.maxSubmissions = input.maxSubmissions || null
      }
      if (input.isActive !== undefined) {
        data.isActive = input.isActive
      }

      const record = await pb.collection('secret_links').update(input.id, data)
      return mapToSecretLink(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('secret_links').delete(id)
    },

    async incrementUsage(id: string): Promise<SecretLink> {
      const link = await this.findById(id)
      if (!link) {
        throw new Error('Secret link not found')
      }

      const record = await pb.collection('secret_links').update(id, {
        usedSubmissions: link.usedSubmissions + 1
      })
      return mapToSecretLink(record)
    }
  }
}
