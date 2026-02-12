/**
 * Speaker Feedback Service
 *
 * Handles personalized feedback for speakers with template management,
 * variable substitution, and email sending.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import {
  type CreateFeedbackTemplate,
  type CreateSpeakerFeedback,
  type FeedbackTemplate,
  type FeedbackTemplateType,
  type FeedbackVariableContext,
  type SpeakerFeedback,
  type UpdateFeedbackTemplate,
  type UpdateSpeakerFeedback,
  anonymizeComments,
  formatReviewerComments,
  getDefaultTemplate,
  renderTemplate
} from '../domain/speaker-feedback'
import type { EmailService } from './email-service'

export interface SpeakerFeedbackService {
  // Template management
  createTemplate(input: CreateFeedbackTemplate): Promise<FeedbackTemplate>
  updateTemplate(id: string, input: UpdateFeedbackTemplate): Promise<FeedbackTemplate>
  deleteTemplate(id: string): Promise<void>
  getTemplateById(id: string): Promise<FeedbackTemplate | null>
  listTemplatesByEdition(editionId: string): Promise<FeedbackTemplate[]>
  getDefaultTemplateForType(
    editionId: string,
    type: FeedbackTemplateType
  ): Promise<FeedbackTemplate | null>
  initializeDefaultTemplates(editionId: string): Promise<FeedbackTemplate[]>

  // Feedback management
  createFeedback(input: CreateSpeakerFeedback): Promise<SpeakerFeedback>
  updateFeedback(id: string, input: UpdateSpeakerFeedback): Promise<SpeakerFeedback>
  deleteFeedback(id: string): Promise<void>
  getFeedbackById(id: string): Promise<SpeakerFeedback | null>
  getFeedbackByTalkAndSpeaker(talkId: string, speakerId: string): Promise<SpeakerFeedback | null>
  listFeedbackByTalk(talkId: string): Promise<SpeakerFeedback[]>
  listFeedbackBySpeaker(speakerId: string): Promise<SpeakerFeedback[]>

  // Feedback generation
  generateFeedbackFromTemplate(
    templateId: string,
    talkId: string,
    speakerId: string,
    createdBy: string
  ): Promise<SpeakerFeedback>
  previewFeedback(
    templateId: string,
    talkId: string,
    speakerId: string
  ): Promise<{
    subject: string
    body: string
  }>

  // Feedback sending
  sendFeedback(feedbackId: string): Promise<SpeakerFeedback>
  sendBulkFeedback(feedbackIds: string[]): Promise<
    Array<{
      id: string
      success: boolean
      error?: string
    }>
  >
  sendFeedbackToAllSpeakers(
    talkId: string,
    templateId: string,
    createdBy: string
  ): Promise<SpeakerFeedback[]>
}

export const createSpeakerFeedbackService = (
  pb: PocketBase,
  emailService: EmailService
): SpeakerFeedbackService => {
  function mapRecordToTemplate(record: RecordModel): FeedbackTemplate {
    return {
      id: record.id,
      editionId: record.editionId,
      type: record.type as FeedbackTemplateType,
      name: record.name,
      subject: record.subject,
      body: record.body,
      includeReviewerComments: record.includeReviewerComments ?? false,
      isDefault: record.isDefault ?? false,
      createdAt: new Date(record.created),
      updatedAt: new Date(record.updated)
    }
  }

  function mapRecordToFeedback(record: RecordModel): SpeakerFeedback {
    return {
      id: record.id,
      talkId: record.talkId,
      speakerId: record.speakerId,
      templateId: record.templateId,
      subject: record.subject,
      body: record.body,
      sentAt: record.sentAt ? new Date(record.sentAt) : undefined,
      status: record.status as SpeakerFeedback['status'],
      error: record.error,
      createdBy: record.createdBy,
      createdAt: new Date(record.created),
      updatedAt: new Date(record.updated)
    }
  }

  async function buildVariableContext(
    talkId: string,
    speakerId: string,
    includeReviewerComments: boolean
  ): Promise<FeedbackVariableContext> {
    // Fetch talk with expanded relations
    const talk = await pb.collection('talks').getOne(talkId, {
      expand: 'editionId,categoryId,formatId'
    })

    const edition = talk.expand?.editionId as RecordModel | undefined
    const category = talk.expand?.categoryId as RecordModel | undefined
    const format = talk.expand?.formatId as RecordModel | undefined

    // Fetch event if edition exists
    let event: RecordModel | undefined
    if (edition?.eventId) {
      try {
        event = await pb.collection('events').getOne(edition.eventId)
      } catch {
        // Event not found
      }
    }

    // Fetch speaker
    const speaker = await pb.collection('speakers').getOne(speakerId)

    // Fetch reviews if needed
    let averageRating: number | undefined
    let reviewerComments: string[] = []

    if (includeReviewerComments) {
      try {
        const reviews = await pb.collection('reviews').getFullList({
          filter: safeFilter`talkId = ${talkId}`,
          sort: '-created'
        })

        if (reviews.length > 0) {
          const ratings = reviews.map((r) => r.rating as number)
          averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

          const comments = reviews
            .filter((r) => r.comment && r.comment.trim().length > 0)
            .map((r) => ({ content: r.comment as string }))

          reviewerComments = anonymizeComments(comments)
        }
      } catch {
        // Reviews not found
      }
    }

    // Build confirmation URL
    const baseUrl = pb.baseUrl.replace('/api', '').replace(':8090', ':5173')
    const confirmationUrl = edition
      ? `${baseUrl}/cfp/${edition.slug || edition.id}/confirm/${talkId}`
      : undefined
    const cfpUrl = edition ? `${baseUrl}/cfp/${edition.slug || edition.id}` : undefined

    // Format edition dates
    let editionDates: string | undefined
    if (edition?.startDate) {
      const start = new Date(edition.startDate)
      const end = edition.endDate ? new Date(edition.endDate) : start
      const options: Intl.DateTimeFormatOptions = {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }
      if (start.getTime() === end.getTime()) {
        editionDates = start.toLocaleDateString('en-US', options)
      } else {
        editionDates = `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${end.toLocaleDateString('en-US', options)}`
      }
    }

    return {
      speakerFirstName: speaker.firstName,
      speakerLastName: speaker.lastName,
      talkTitle: talk.title,
      talkAbstract: talk.abstract,
      eventName: event?.name || edition?.name || '',
      editionName: edition?.name || '',
      editionDates,
      editionLocation: edition?.location,
      categoryName: category?.name,
      formatName: format?.name,
      averageRating,
      reviewerComments:
        reviewerComments.length > 0 ? [formatReviewerComments(reviewerComments, true)] : undefined,
      confirmationUrl,
      cfpUrl
    }
  }

  return {
    // Template management
    async createTemplate(input: CreateFeedbackTemplate): Promise<FeedbackTemplate> {
      const record = await pb.collection('feedback_templates').create({
        editionId: input.editionId,
        type: input.type,
        name: input.name,
        subject: input.subject,
        body: input.body,
        includeReviewerComments: input.includeReviewerComments ?? false,
        isDefault: input.isDefault ?? false
      })
      return mapRecordToTemplate(record)
    },

    async updateTemplate(id: string, input: UpdateFeedbackTemplate): Promise<FeedbackTemplate> {
      const data: Record<string, unknown> = {}
      if (input.type !== undefined) data.type = input.type
      if (input.name !== undefined) data.name = input.name
      if (input.subject !== undefined) data.subject = input.subject
      if (input.body !== undefined) data.body = input.body
      if (input.includeReviewerComments !== undefined)
        data.includeReviewerComments = input.includeReviewerComments
      if (input.isDefault !== undefined) data.isDefault = input.isDefault

      const record = await pb.collection('feedback_templates').update(id, data)
      return mapRecordToTemplate(record)
    },

    async deleteTemplate(id: string): Promise<void> {
      await pb.collection('feedback_templates').delete(id)
    },

    async getTemplateById(id: string): Promise<FeedbackTemplate | null> {
      try {
        const record = await pb.collection('feedback_templates').getOne(id)
        return mapRecordToTemplate(record)
      } catch {
        return null
      }
    },

    async listTemplatesByEdition(editionId: string): Promise<FeedbackTemplate[]> {
      const records = await pb.collection('feedback_templates').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'type,name'
      })
      return records.map(mapRecordToTemplate)
    },

    async getDefaultTemplateForType(
      editionId: string,
      type: FeedbackTemplateType
    ): Promise<FeedbackTemplate | null> {
      try {
        const record = await pb
          .collection('feedback_templates')
          .getFirstListItem(
            safeFilter`editionId = ${editionId} && type = ${type} && isDefault = true`
          )
        return mapRecordToTemplate(record)
      } catch {
        return null
      }
    },

    async initializeDefaultTemplates(editionId: string): Promise<FeedbackTemplate[]> {
      const templates: FeedbackTemplate[] = []

      for (const type of ['accepted', 'rejected', 'waitlisted'] as FeedbackTemplateType[]) {
        const defaultContent = getDefaultTemplate(type)
        if (!defaultContent) continue

        // Check if default already exists
        const existing = await this.getDefaultTemplateForType(editionId, type)
        if (existing) {
          templates.push(existing)
          continue
        }

        // Create default template
        const created = await this.createTemplate({
          editionId,
          type,
          name: defaultContent.name,
          subject: defaultContent.subject,
          body: defaultContent.body,
          includeReviewerComments: defaultContent.includeReviewerComments,
          isDefault: true
        })
        templates.push(created)
      }

      return templates
    },

    // Feedback management
    async createFeedback(input: CreateSpeakerFeedback): Promise<SpeakerFeedback> {
      const record = await pb.collection('speaker_feedbacks').create({
        talkId: input.talkId,
        speakerId: input.speakerId,
        templateId: input.templateId || null,
        subject: input.subject,
        body: input.body,
        sentAt: input.sentAt?.toISOString() || null,
        status: input.status || 'draft',
        error: input.error || null,
        createdBy: input.createdBy
      })
      return mapRecordToFeedback(record)
    },

    async updateFeedback(id: string, input: UpdateSpeakerFeedback): Promise<SpeakerFeedback> {
      const data: Record<string, unknown> = {}
      if (input.templateId !== undefined) data.templateId = input.templateId || null
      if (input.subject !== undefined) data.subject = input.subject
      if (input.body !== undefined) data.body = input.body
      if (input.sentAt !== undefined) data.sentAt = input.sentAt?.toISOString() || null
      if (input.status !== undefined) data.status = input.status
      if (input.error !== undefined) data.error = input.error || null

      const record = await pb.collection('speaker_feedbacks').update(id, data)
      return mapRecordToFeedback(record)
    },

    async deleteFeedback(id: string): Promise<void> {
      await pb.collection('speaker_feedbacks').delete(id)
    },

    async getFeedbackById(id: string): Promise<SpeakerFeedback | null> {
      try {
        const record = await pb.collection('speaker_feedbacks').getOne(id)
        return mapRecordToFeedback(record)
      } catch {
        return null
      }
    },

    async getFeedbackByTalkAndSpeaker(
      talkId: string,
      speakerId: string
    ): Promise<SpeakerFeedback | null> {
      try {
        const record = await pb
          .collection('speaker_feedbacks')
          .getFirstListItem(safeFilter`talkId = ${talkId} && speakerId = ${speakerId}`)
        return mapRecordToFeedback(record)
      } catch {
        return null
      }
    },

    async listFeedbackByTalk(talkId: string): Promise<SpeakerFeedback[]> {
      const records = await pb.collection('speaker_feedbacks').getFullList({
        filter: safeFilter`talkId = ${talkId}`,
        sort: '-created'
      })
      return records.map(mapRecordToFeedback)
    },

    async listFeedbackBySpeaker(speakerId: string): Promise<SpeakerFeedback[]> {
      const records = await pb.collection('speaker_feedbacks').getFullList({
        filter: safeFilter`speakerId = ${speakerId}`,
        sort: '-created'
      })
      return records.map(mapRecordToFeedback)
    },

    // Feedback generation
    async generateFeedbackFromTemplate(
      templateId: string,
      talkId: string,
      speakerId: string,
      createdBy: string
    ): Promise<SpeakerFeedback> {
      const template = await this.getTemplateById(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      const context = await buildVariableContext(
        talkId,
        speakerId,
        template.includeReviewerComments
      )

      const subject = renderTemplate(template.subject, context)
      const body = renderTemplate(template.body, context)

      // Check if feedback already exists
      const existing = await this.getFeedbackByTalkAndSpeaker(talkId, speakerId)
      if (existing) {
        // Update existing feedback
        return this.updateFeedback(existing.id, {
          templateId,
          subject,
          body,
          status: 'draft'
        })
      }

      // Create new feedback
      return this.createFeedback({
        talkId,
        speakerId,
        templateId,
        subject,
        body,
        status: 'draft',
        createdBy
      })
    },

    async previewFeedback(
      templateId: string,
      talkId: string,
      speakerId: string
    ): Promise<{ subject: string; body: string }> {
      const template = await this.getTemplateById(templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      const context = await buildVariableContext(
        talkId,
        speakerId,
        template.includeReviewerComments
      )

      return {
        subject: renderTemplate(template.subject, context),
        body: renderTemplate(template.body, context)
      }
    },

    // Feedback sending
    async sendFeedback(feedbackId: string): Promise<SpeakerFeedback> {
      const feedback = await this.getFeedbackById(feedbackId)
      if (!feedback) {
        throw new Error('Feedback not found')
      }

      if (feedback.status === 'sent') {
        throw new Error('Feedback already sent')
      }

      // Get speaker email
      const speaker = await pb.collection('speakers').getOne(feedback.speakerId)

      // Send email
      const result = await emailService.send({
        to: speaker.email,
        subject: feedback.subject,
        html: feedback.body.replace(/\n/g, '<br>'),
        text: feedback.body.replace(/<[^>]*>/g, '')
      })

      if (result.success) {
        return this.updateFeedback(feedbackId, {
          status: 'sent',
          sentAt: new Date(),
          error: undefined
        })
      }

      return this.updateFeedback(feedbackId, {
        status: 'failed',
        error: result.error
      })
    },

    async sendBulkFeedback(
      feedbackIds: string[]
    ): Promise<Array<{ id: string; success: boolean; error?: string }>> {
      const results: Array<{ id: string; success: boolean; error?: string }> = []

      for (const id of feedbackIds) {
        try {
          const updated = await this.sendFeedback(id)
          results.push({
            id,
            success: updated.status === 'sent',
            error: updated.error
          })
        } catch (err) {
          results.push({
            id,
            success: false,
            error: String(err)
          })
        }
      }

      return results
    },

    async sendFeedbackToAllSpeakers(
      talkId: string,
      templateId: string,
      createdBy: string
    ): Promise<SpeakerFeedback[]> {
      // Get talk speakers
      const talk = await pb.collection('talks').getOne(talkId)
      const speakerIds = (talk.speakerIds as string[]) || []

      const feedbacks: SpeakerFeedback[] = []

      for (const speakerId of speakerIds) {
        // Generate feedback
        const feedback = await this.generateFeedbackFromTemplate(
          templateId,
          talkId,
          speakerId,
          createdBy
        )

        // Send feedback
        const sent = await this.sendFeedback(feedback.id)
        feedbacks.push(sent)
      }

      return feedbacks
    }
  }
}

export type { FeedbackTemplate, SpeakerFeedback, FeedbackTemplateType }
