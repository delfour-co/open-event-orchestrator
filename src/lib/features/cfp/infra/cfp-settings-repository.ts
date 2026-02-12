/**
 * CFP Settings Repository
 *
 * Handles persistence of CFP settings in PocketBase
 */

import type PocketBase from 'pocketbase'
import type { CfpSettings, CreateCfpSettings, UpdateCfpSettings } from '../domain/cfp-settings'
import type { ReviewMode } from '../domain/review-mode'

export interface CfpSettingsRepository {
  findByEdition(editionId: string): Promise<CfpSettings | null>
  create(settings: CreateCfpSettings): Promise<CfpSettings>
  update(settings: UpdateCfpSettings): Promise<CfpSettings>
  upsert(editionId: string, settings: Partial<CreateCfpSettings>): Promise<CfpSettings>
}

function mapToCfpSettings(record: Record<string, unknown>): CfpSettings {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    cfpOpenDate: record.cfpOpenDate ? new Date(record.cfpOpenDate as string) : undefined,
    cfpCloseDate: record.cfpCloseDate ? new Date(record.cfpCloseDate as string) : undefined,
    introText: (record.introText as string) || undefined,
    maxSubmissionsPerSpeaker: (record.maxSubmissionsPerSpeaker as number) || 3,
    requireAbstract: record.requireAbstract !== false,
    requireDescription: record.requireDescription === true,
    allowCoSpeakers: record.allowCoSpeakers !== false,
    anonymousReview: record.anonymousReview === true,
    revealSpeakersAfterDecision: record.revealSpeakersAfterDecision !== false,
    reviewMode: (record.reviewMode as ReviewMode) || 'stars',
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createCfpSettingsRepository(pb: PocketBase): CfpSettingsRepository {
  return {
    async findByEdition(editionId: string): Promise<CfpSettings | null> {
      try {
        const record = await pb
          .collection('cfp_settings')
          .getFirstListItem(`editionId="${editionId}"`)
        return mapToCfpSettings(record)
      } catch {
        return null
      }
    },

    async create(settings: CreateCfpSettings): Promise<CfpSettings> {
      const record = await pb.collection('cfp_settings').create({
        editionId: settings.editionId,
        cfpOpenDate: settings.cfpOpenDate?.toISOString() || null,
        cfpCloseDate: settings.cfpCloseDate?.toISOString() || null,
        introText: settings.introText || null,
        maxSubmissionsPerSpeaker: settings.maxSubmissionsPerSpeaker,
        requireAbstract: settings.requireAbstract,
        requireDescription: settings.requireDescription,
        allowCoSpeakers: settings.allowCoSpeakers,
        anonymousReview: settings.anonymousReview,
        revealSpeakersAfterDecision: settings.revealSpeakersAfterDecision,
        reviewMode: settings.reviewMode || 'stars'
      })
      return mapToCfpSettings(record)
    },

    async update(settings: UpdateCfpSettings): Promise<CfpSettings> {
      const data: Record<string, unknown> = {}

      if (settings.cfpOpenDate !== undefined) {
        data.cfpOpenDate = settings.cfpOpenDate?.toISOString() || null
      }
      if (settings.cfpCloseDate !== undefined) {
        data.cfpCloseDate = settings.cfpCloseDate?.toISOString() || null
      }
      if (settings.introText !== undefined) {
        data.introText = settings.introText || null
      }
      if (settings.maxSubmissionsPerSpeaker !== undefined) {
        data.maxSubmissionsPerSpeaker = settings.maxSubmissionsPerSpeaker
      }
      if (settings.requireAbstract !== undefined) {
        data.requireAbstract = settings.requireAbstract
      }
      if (settings.requireDescription !== undefined) {
        data.requireDescription = settings.requireDescription
      }
      if (settings.allowCoSpeakers !== undefined) {
        data.allowCoSpeakers = settings.allowCoSpeakers
      }
      if (settings.anonymousReview !== undefined) {
        data.anonymousReview = settings.anonymousReview
      }
      if (settings.revealSpeakersAfterDecision !== undefined) {
        data.revealSpeakersAfterDecision = settings.revealSpeakersAfterDecision
      }
      if (settings.reviewMode !== undefined) {
        data.reviewMode = settings.reviewMode
      }

      const record = await pb.collection('cfp_settings').update(settings.id, data)
      return mapToCfpSettings(record)
    },

    async upsert(editionId: string, settings: Partial<CreateCfpSettings>): Promise<CfpSettings> {
      const existing = await this.findByEdition(editionId)

      if (existing) {
        return this.update({ id: existing.id, ...settings })
      }

      return this.create({
        editionId,
        maxSubmissionsPerSpeaker: settings.maxSubmissionsPerSpeaker ?? 3,
        requireAbstract: settings.requireAbstract ?? true,
        requireDescription: settings.requireDescription ?? false,
        allowCoSpeakers: settings.allowCoSpeakers ?? true,
        anonymousReview: settings.anonymousReview ?? false,
        revealSpeakersAfterDecision: settings.revealSpeakersAfterDecision ?? true,
        reviewMode: settings.reviewMode ?? 'stars',
        ...settings
      })
    }
  }
}
