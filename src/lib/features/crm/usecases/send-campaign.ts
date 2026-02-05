import { getEmailService } from '$lib/server/app-settings'
import type PocketBase from 'pocketbase'
import { interpolateTemplate } from '../domain'

export interface SendCampaignResult {
  totalRecipients: number
  totalSent: number
  totalFailed: number
  errors: Array<{ email: string; error: string }>
}

export const createSendCampaignUseCase = (pb: PocketBase) => {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: campaign sending involves multiple sequential steps
  return async (campaignId: string): Promise<SendCampaignResult> => {
    const result: SendCampaignResult = {
      totalRecipients: 0,
      totalSent: 0,
      totalFailed: 0,
      errors: []
    }

    const campaign = await pb.collection('email_campaigns').getOne(campaignId)
    if (!campaign) throw new Error('Campaign not found')
    if (campaign.status !== 'draft') throw new Error('Campaign is not in draft status')

    // Mark as sending
    await pb.collection('email_campaigns').update(campaignId, { status: 'sending' })

    try {
      // Get recipients
      let contacts: Array<Record<string, unknown>>

      if (campaign.segmentId) {
        // Get contacts from segment
        const segment = await pb.collection('segments').getOne(campaign.segmentId as string)
        const criteria = segment.criteria as { rules: unknown[] }
        if (criteria?.rules?.length > 0) {
          contacts = await pb.collection('contacts').getFullList({
            filter: `organizationId = "${campaign.organizationId}"`
          })
        } else {
          contacts = await pb.collection('contacts').getFullList({
            filter: `organizationId = "${campaign.organizationId}"`
          })
        }
      } else {
        // Send to all contacts in organization
        contacts = await pb.collection('contacts').getFullList({
          filter: `organizationId = "${campaign.organizationId}"`
        })
      }

      // Filter contacts with marketing consent
      const contactsWithConsent: Array<Record<string, unknown>> = []
      for (const contact of contacts) {
        const consents = await pb.collection('consents').getList(1, 1, {
          filter: `contactId = "${contact.id}" && type = "marketing_email" && status = "granted"`
        })
        if (consents.items.length > 0) {
          contactsWithConsent.push(contact)
        }
      }

      result.totalRecipients = contactsWithConsent.length

      await pb.collection('email_campaigns').update(campaignId, {
        totalRecipients: result.totalRecipients
      })

      const emailService = await getEmailService(pb)

      for (const contact of contactsWithConsent) {
        try {
          const variables: Record<string, string> = {
            '{{firstName}}': contact.firstName as string,
            '{{lastName}}': contact.lastName as string,
            '{{email}}': contact.email as string,
            '{{company}}': (contact.company as string) || ''
          }

          const html = interpolateTemplate(campaign.bodyHtml as string, variables)
          const text = interpolateTemplate(campaign.bodyText as string, variables)
          const subject = interpolateTemplate(campaign.subject as string, variables)

          const sendResult = await emailService.send({
            to: contact.email as string,
            subject,
            html,
            text
          })

          if (sendResult.success) {
            result.totalSent++
          } else {
            result.totalFailed++
            result.errors.push({
              email: contact.email as string,
              error: sendResult.error || 'Unknown error'
            })
          }
        } catch (err) {
          result.totalFailed++
          result.errors.push({
            email: contact.email as string,
            error: String(err)
          })
        }
      }

      // Mark as sent
      await pb.collection('email_campaigns').update(campaignId, {
        status: 'sent',
        sentAt: new Date().toISOString(),
        totalSent: result.totalSent,
        totalFailed: result.totalFailed
      })
    } catch (err) {
      // Mark as draft again on failure
      await pb.collection('email_campaigns').update(campaignId, { status: 'draft' })
      throw err
    }

    return result
  }
}
