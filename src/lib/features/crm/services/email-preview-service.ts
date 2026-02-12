/**
 * Email Preview Service
 *
 * Handles email preview generation and test email sending.
 */

import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import type { Contact } from '../domain/contact'
import type { EmailCampaign } from '../domain/email-campaign'
import {
  type EmailPreviewData,
  type PreSendValidation,
  type TestEmailResult,
  buildPreviewData,
  detectSpamTriggers,
  formatTestSubject,
  getDefaultFallbacks,
  validatePreSend,
  validateTestAddresses
} from '../domain/email-preview'

interface SendTestEmailOptions {
  campaignId: string
  toAddresses: string[]
  contactId?: string
  subject?: string
  htmlContent?: string
}

interface PreviewContext {
  campaign?: EmailCampaign
  contact?: Contact
  customData?: Record<string, string>
}

export const createEmailPreviewService = (
  pb: PocketBase,
  sendEmail?: (options: {
    to: string
    subject: string
    html: string
    text?: string
  }) => Promise<boolean>
) => {
  /**
   * Build preview data for a campaign with optional contact
   */
  async function buildCampaignPreview(
    campaignId: string,
    contactId?: string,
    customData?: Record<string, string>
  ): Promise<EmailPreviewData> {
    const campaign = await pb.collection('email_campaigns').getOne(campaignId)

    let contactData: Record<string, string> = {}

    if (contactId) {
      const contact = await pb.collection('contacts').getOne(contactId)
      contactData = buildContactData(contact)
    }

    // Merge with custom data
    if (customData) {
      contactData = { ...contactData, ...customData }
    }

    const fallbacks = getDefaultFallbacks()

    return buildPreviewData(
      campaign.subject || '',
      campaign.htmlContent || '',
      campaign.textContent,
      contactData,
      fallbacks
    )
  }

  /**
   * Build contact data for template resolution
   */
  function buildContactData(contact: RecordModel): Record<string, string> {
    return {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      company: contact.company || '',
      jobTitle: contact.jobTitle || '',
      phone: contact.phone || ''
    }
  }

  /**
   * Validate a campaign before sending
   */
  async function validateCampaign(campaignId: string): Promise<PreSendValidation> {
    const campaign = await pb.collection('email_campaigns').getOne(campaignId, {
      expand: 'segmentId'
    })

    // Get recipient count
    let recipientCount = 0
    if (campaign.segmentId) {
      const countResult = await pb.collection('segment_memberships').getList(1, 1, {
        filter: `segmentId = "${campaign.segmentId}"`
      })
      recipientCount = countResult.totalItems
    }

    // Get unresolved variable count from preview
    const preview = await buildCampaignPreview(campaignId)

    return validatePreSend(
      campaign.subject,
      campaign.fromName,
      campaign.fromEmail,
      campaign.htmlContent,
      campaign.textContent,
      recipientCount,
      preview.unresolvedCount
    )
  }

  /**
   * Analyze content for spam triggers
   */
  function analyzeSpamTriggers(subject: string, content: string): string[] {
    return detectSpamTriggers(`${subject} ${content}`)
  }

  /**
   * Send test emails
   */
  async function sendTestEmails(options: SendTestEmailOptions): Promise<TestEmailResult> {
    if (!sendEmail) {
      return {
        success: false,
        sentCount: 0,
        failedAddresses: options.toAddresses,
        error: 'Email sending not configured'
      }
    }

    // Validate addresses
    const { valid, invalid } = validateTestAddresses(options.toAddresses)

    if (valid.length === 0) {
      return {
        success: false,
        sentCount: 0,
        failedAddresses: invalid,
        error: 'No valid email addresses provided'
      }
    }

    // Get campaign and build preview
    const campaign = await pb.collection('email_campaigns').getOne(options.campaignId)

    let contactData: Record<string, string> = {}
    if (options.contactId) {
      const contact = await pb.collection('contacts').getOne(options.contactId)
      contactData = buildContactData(contact)
    }

    const fallbacks = getDefaultFallbacks()
    const preview = buildPreviewData(
      options.subject || campaign.subject || '',
      options.htmlContent || campaign.htmlContent || '',
      campaign.textContent,
      contactData,
      fallbacks
    )

    // Send to each valid address
    const failedAddresses: string[] = [...invalid]
    let sentCount = 0

    for (const address of valid) {
      const sent = await sendEmail({
        to: address,
        subject: formatTestSubject(preview.resolvedSubject),
        html: preview.resolvedHtmlContent,
        text: preview.resolvedTextContent
      })

      if (sent) {
        sentCount++
      } else {
        failedAddresses.push(address)
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedAddresses
    }
  }

  /**
   * Get sample contacts for preview
   */
  async function getSampleContacts(segmentId?: string, limit = 5): Promise<RecordModel[]> {
    let filter = ''
    if (segmentId) {
      const memberships = await pb.collection('segment_memberships').getList(1, limit, {
        filter: `segmentId = "${segmentId}"`
      })
      const contactIds = memberships.items.map((m) => m.contactId)
      if (contactIds.length > 0) {
        filter = contactIds.map((id) => `id = "${id}"`).join(' || ')
      } else {
        return []
      }
    }

    const result = await pb.collection('contacts').getList(1, limit, {
      filter: filter || undefined
    })

    return result.items
  }

  /**
   * Build preview for multiple contacts (for variable comparison)
   */
  async function buildMultiContactPreview(
    campaignId: string,
    contactIds: string[]
  ): Promise<{ contactId: string; preview: EmailPreviewData }[]> {
    const campaign = await pb.collection('email_campaigns').getOne(campaignId)
    const fallbacks = getDefaultFallbacks()

    const previews: { contactId: string; preview: EmailPreviewData }[] = []

    for (const contactId of contactIds) {
      const contact = await pb.collection('contacts').getOne(contactId)
      const contactData = buildContactData(contact)

      const preview = buildPreviewData(
        campaign.subject || '',
        campaign.htmlContent || '',
        campaign.textContent,
        contactData,
        fallbacks
      )

      previews.push({ contactId, preview })
    }

    return previews
  }

  return {
    buildCampaignPreview,
    buildContactData,
    validateCampaign,
    analyzeSpamTriggers,
    sendTestEmails,
    getSampleContacts,
    buildMultiContactPreview
  }
}

export type EmailPreviewService = ReturnType<typeof createEmailPreviewService>
