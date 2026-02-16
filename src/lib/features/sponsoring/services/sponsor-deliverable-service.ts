import type { EmailService } from '$lib/features/cfp/services/email-service'
import type PocketBase from 'pocketbase'
import type {
  CreateDeliverable,
  DeliverableStatus,
  SponsorDeliverable,
  SponsorDeliverableExpanded
} from '../domain'
import { createDeliverablesFromBenefits, getDeliverableStatusLabel } from '../domain'
import { createEditionSponsorRepository, createSponsorDeliverableRepository } from '../infra'

export interface DeliverableGenerationResult {
  created: number
  skipped: number
  deliverables: SponsorDeliverable[]
}

export interface DeliverablesSummary {
  total: number
  pending: number
  inProgress: number
  delivered: number
  overdue: number
  completionPercent: number
}

export interface SponsorDeliverableService {
  generateDeliverablesForSponsor(
    editionSponsorId: string,
    defaultDueDate?: Date
  ): Promise<DeliverableGenerationResult>

  generateDeliverablesForEdition(
    editionId: string,
    defaultDueDate?: Date
  ): Promise<{ sponsorsProcessed: number; deliverablesCreated: number }>

  updateDeliverableStatus(
    deliverableId: string,
    status: DeliverableStatus,
    eventName: string
  ): Promise<SponsorDeliverable>

  markAsDelivered(
    deliverableId: string,
    eventName: string,
    notes?: string
  ): Promise<SponsorDeliverable>

  getDeliverablesSummary(editionSponsorId: string): Promise<DeliverablesSummary>

  sendDeliveryNotification(
    deliverable: SponsorDeliverableExpanded,
    eventName: string
  ): Promise<{ success: boolean; error?: string }>
}

const countDeliverablesByStatus = (
  deliverables: SponsorDeliverable[]
): { pending: number; inProgress: number; delivered: number } => {
  let pending = 0
  let inProgress = 0
  let delivered = 0

  for (const d of deliverables) {
    switch (d.status) {
      case 'pending':
        pending++
        break
      case 'in_progress':
        inProgress++
        break
      case 'delivered':
        delivered++
        break
    }
  }

  return { pending, inProgress, delivered }
}

const countOverdue = (deliverables: SponsorDeliverable[], now: Date): number => {
  return deliverables.filter((d) => d.dueDate && d.status !== 'delivered' && now > d.dueDate).length
}

const buildNotificationHtml = (
  greeting: string,
  deliverable: SponsorDeliverableExpanded,
  eventName: string
): string => {
  const descriptionHtml = deliverable.description
    ? `<p style="margin: 8px 0 0; color: #666;">${deliverable.description}</p>`
    : ''
  const deliveredAtHtml = deliverable.deliveredAt
    ? `<p style="margin: 4px 0 0; font-size: 0.9em; color: #666;">Delivered on: ${deliverable.deliveredAt.toLocaleDateString()}</p>`
    : ''
  const notesHtml = deliverable.notes ? `<p><strong>Notes:</strong> ${deliverable.notes}</p>` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benefit Delivered</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">Benefit Delivered!</h1>
  <p>${greeting},</p>
  <p>We're pleased to inform you that one of your sponsorship benefits has been delivered:</p>
  <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0; font-weight: 600;">${deliverable.benefitName}</p>
    ${descriptionHtml}
    <p style="margin: 8px 0 0; font-size: 0.9em; color: #666;">
      Status: <span style="color: #16a34a; font-weight: 500;">${getDeliverableStatusLabel(deliverable.status)}</span>
    </p>
    ${deliveredAtHtml}
  </div>
  ${notesHtml}
  <p>Thank you for your continued partnership with ${eventName}!</p>
  <p>Best regards,<br>The ${eventName} Team</p>
</body>
</html>`
}

const buildNotificationText = (
  greeting: string,
  deliverable: SponsorDeliverableExpanded,
  eventName: string
): string => {
  const parts = [
    'Benefit Delivered!',
    '',
    `${greeting},`,
    '',
    "We're pleased to inform you that one of your sponsorship benefits has been delivered:",
    '',
    deliverable.benefitName
  ]

  if (deliverable.description) {
    parts.push(deliverable.description)
  }

  parts.push(`Status: ${getDeliverableStatusLabel(deliverable.status)}`)

  if (deliverable.deliveredAt) {
    parts.push(`Delivered on: ${deliverable.deliveredAt.toLocaleDateString()}`)
  }

  if (deliverable.notes) {
    parts.push('', `Notes: ${deliverable.notes}`)
  }

  parts.push(
    '',
    `Thank you for your continued partnership with ${eventName}!`,
    '',
    'Best regards,',
    `The ${eventName} Team`
  )

  return parts.join('\n')
}

export const createSponsorDeliverableService = (
  pb: PocketBase,
  emailService?: EmailService
): SponsorDeliverableService => {
  const deliverableRepo = createSponsorDeliverableRepository(pb)
  const editionSponsorRepo = createEditionSponsorRepository(pb)

  return {
    async generateDeliverablesForSponsor(
      editionSponsorId: string,
      defaultDueDate?: Date
    ): Promise<DeliverableGenerationResult> {
      const editionSponsor = await editionSponsorRepo.findByIdWithExpand(editionSponsorId)
      if (!editionSponsor?.package?.benefits) {
        return { created: 0, skipped: 0, deliverables: [] }
      }

      const existingDeliverables = await deliverableRepo.findByEditionSponsor(editionSponsorId)
      const existingBenefitNames = new Set(existingDeliverables.map((d) => d.benefitName))

      const toCreate: CreateDeliverable[] = createDeliverablesFromBenefits(
        editionSponsorId,
        editionSponsor.package.benefits,
        defaultDueDate
      ).filter((d) => !existingBenefitNames.has(d.benefitName))

      const created = await deliverableRepo.createMany(toCreate)
      const includedCount = editionSponsor.package.benefits.filter((b) => b.included).length

      return {
        created: created.length,
        skipped: includedCount - toCreate.length,
        deliverables: created
      }
    },

    async generateDeliverablesForEdition(
      editionId: string,
      defaultDueDate?: Date
    ): Promise<{ sponsorsProcessed: number; deliverablesCreated: number }> {
      const confirmedSponsors = await editionSponsorRepo.findConfirmed(editionId)
      let totalCreated = 0

      for (const sponsor of confirmedSponsors) {
        const result = await this.generateDeliverablesForSponsor(sponsor.id, defaultDueDate)
        totalCreated += result.created
      }

      return {
        sponsorsProcessed: confirmedSponsors.length,
        deliverablesCreated: totalCreated
      }
    },

    async updateDeliverableStatus(
      deliverableId: string,
      status: DeliverableStatus,
      eventName: string
    ): Promise<SponsorDeliverable> {
      const deliverable = await deliverableRepo.updateStatus(deliverableId, status)

      if (status === 'delivered' && emailService) {
        const expanded = await deliverableRepo.findByIdWithExpand(deliverableId)
        if (expanded) {
          await this.sendDeliveryNotification(expanded, eventName)
        }
      }

      return deliverable
    },

    async markAsDelivered(
      deliverableId: string,
      eventName: string,
      notes?: string
    ): Promise<SponsorDeliverable> {
      const updateData: { status: DeliverableStatus; deliveredAt: Date; notes?: string } = {
        status: 'delivered',
        deliveredAt: new Date()
      }
      if (notes) {
        updateData.notes = notes
      }

      const deliverable = await deliverableRepo.update(deliverableId, updateData)

      if (emailService) {
        const expanded = await deliverableRepo.findByIdWithExpand(deliverableId)
        if (expanded) {
          await this.sendDeliveryNotification(expanded, eventName)
        }
      }

      return deliverable
    },

    async getDeliverablesSummary(editionSponsorId: string): Promise<DeliverablesSummary> {
      const deliverables = await deliverableRepo.findByEditionSponsor(editionSponsorId)
      const now = new Date()

      const counts = countDeliverablesByStatus(deliverables)
      const overdue = countOverdue(deliverables, now)
      const total = deliverables.length
      const completionPercent = total > 0 ? Math.round((counts.delivered / total) * 100) : 0

      return { total, ...counts, overdue, completionPercent }
    },

    async sendDeliveryNotification(
      deliverable: SponsorDeliverableExpanded,
      eventName: string
    ): Promise<{ success: boolean; error?: string }> {
      if (!emailService) {
        return { success: false, error: 'Email service not configured' }
      }

      const contactEmail = deliverable.editionSponsor?.sponsor?.contactEmail
      if (!contactEmail) {
        return { success: false, error: 'No contact email for sponsor' }
      }

      const sponsorName = deliverable.editionSponsor?.sponsor?.name || 'Sponsor'
      const contactName = deliverable.editionSponsor?.sponsor?.contactName
      const greeting = contactName ? `Dear ${contactName}` : `Dear ${sponsorName} team`

      return emailService.send({
        to: contactEmail,
        subject: `${eventName} - Benefit Delivered: ${deliverable.benefitName}`,
        html: buildNotificationHtml(greeting, deliverable, eventName),
        text: buildNotificationText(greeting, deliverable, eventName)
      })
    }
  }
}

export type { SponsorDeliverableService as SponsorDeliverableServiceType }
