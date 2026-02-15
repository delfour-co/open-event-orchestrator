import type PocketBase from 'pocketbase'
import type {
  CreateFeedbackSettings,
  FeedbackSettings,
  UpdateFeedbackSettings
} from '../domain/feedback-settings'

export class FeedbackSettingsRepository {
  constructor(private pb: PocketBase) {}

  async create(data: CreateFeedbackSettings): Promise<FeedbackSettings> {
    const record = await this.pb.collection('feedback_settings').create({
      editionId: data.editionId,
      sessionRatingEnabled: data.sessionRatingEnabled,
      sessionRatingMode: data.sessionRatingMode,
      sessionCommentRequired: data.sessionCommentRequired,
      eventFeedbackEnabled: data.eventFeedbackEnabled,
      feedbackIntroText: data.feedbackIntroText
    })

    return this.mapRecord(record)
  }

  async update(data: UpdateFeedbackSettings): Promise<FeedbackSettings> {
    const updateData: Record<string, unknown> = {}

    if (data.sessionRatingEnabled !== undefined)
      updateData.sessionRatingEnabled = data.sessionRatingEnabled
    if (data.sessionRatingMode !== undefined) updateData.sessionRatingMode = data.sessionRatingMode
    if (data.sessionCommentRequired !== undefined)
      updateData.sessionCommentRequired = data.sessionCommentRequired
    if (data.eventFeedbackEnabled !== undefined)
      updateData.eventFeedbackEnabled = data.eventFeedbackEnabled
    if (data.feedbackIntroText !== undefined) updateData.feedbackIntroText = data.feedbackIntroText

    const record = await this.pb.collection('feedback_settings').update(data.id, updateData)

    return this.mapRecord(record)
  }

  async delete(id: string): Promise<void> {
    await this.pb.collection('feedback_settings').delete(id)
  }

  async getById(id: string): Promise<FeedbackSettings | null> {
    try {
      const record = await this.pb.collection('feedback_settings').getOne(id)
      return this.mapRecord(record)
    } catch {
      return null
    }
  }

  async getByEdition(editionId: string): Promise<FeedbackSettings | null> {
    try {
      const records = await this.pb.collection('feedback_settings').getFullList({
        filter: `editionId = "${editionId}"`
      })

      if (records.length === 0) return null
      return this.mapRecord(records[0])
    } catch {
      return null
    }
  }

  private mapRecord(record: Record<string, unknown>): FeedbackSettings {
    return {
      id: record.id as string,
      editionId: record.editionId as string,
      sessionRatingEnabled: (record.sessionRatingEnabled as boolean) ?? true,
      sessionRatingMode:
        (record.sessionRatingMode as FeedbackSettings['sessionRatingMode']) ?? 'stars',
      sessionCommentRequired: (record.sessionCommentRequired as boolean) ?? false,
      eventFeedbackEnabled: (record.eventFeedbackEnabled as boolean) ?? true,
      feedbackIntroText: record.feedbackIntroText as string | undefined,
      createdAt: new Date(record.created as string),
      updatedAt: new Date(record.updated as string)
    }
  }
}
