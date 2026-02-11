import { randomUUID } from 'node:crypto'
import { env } from '$env/dynamic/public'
import { getEmailService } from '$lib/server/app-settings'
import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import { interpolateTemplate } from '../domain'
import { createEmailTrackingService } from '../services'

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

    // Load event name for variable interpolation
    const event = await pb.collection('events').getOne(campaign.eventId as string)
    const eventName = (event?.name as string) || ''

    // Mark as sending
    await pb.collection('email_campaigns').update(campaignId, { status: 'sending' })

    try {
      // Get recipients
      const contacts = await pb.collection('contacts').getFullList({
        filter: safeFilter`eventId = ${campaign.eventId as string}`
      })

      // Filter contacts with marketing consent
      const contactsWithConsent: Array<Record<string, unknown>> = []
      for (const contact of contacts) {
        const consents = await pb.collection('consents').getList(1, 1, {
          filter: safeFilter`contactId = ${contact.id as string} && type = ${'marketing_email'} && status = ${'granted'}`
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
      const baseUrl =
        env.PUBLIC_POCKETBASE_URL?.replace(':8090', ':5173') || 'http://localhost:5173'

      for (const contact of contactsWithConsent) {
        try {
          // Ensure contact has an unsubscribe token
          let token = contact.unsubscribeToken as string
          if (!token) {
            token = randomUUID()
            await pb.collection('contacts').update(contact.id as string, {
              unsubscribeToken: token
            })
          }

          const unsubscribeUrl = `${baseUrl}/unsubscribe/${token}`

          const variables: Record<string, string> = {
            '{{firstName}}': contact.firstName as string,
            '{{lastName}}': contact.lastName as string,
            '{{email}}': contact.email as string,
            '{{company}}': (contact.company as string) || '',
            '{{eventName}}': eventName,
            '{{editionName}}': '',
            '{{unsubscribeUrl}}': unsubscribeUrl
          }

          let html = interpolateTemplate(campaign.bodyHtml as string, variables)
          let text = interpolateTemplate(campaign.bodyText as string, variables)
          const subject = interpolateTemplate(campaign.subject as string, variables)

          // Add email tracking if enabled
          const trackingService = createEmailTrackingService()
          const tracked = trackingService.addTracking(html, text, {
            baseUrl,
            campaignId,
            contactId: contact.id as string,
            enableOpenTracking: campaign.enableOpenTracking !== false,
            enableClickTracking: campaign.enableClickTracking !== false
          })
          html = tracked.html
          text = tracked.text

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
