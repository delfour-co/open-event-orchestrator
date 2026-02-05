import { canEditCampaign, interpolateTemplate } from '$lib/features/crm/domain'
import { createSendCampaignUseCase } from '$lib/features/crm/usecases'
import { getEmailService } from '$lib/server/app-settings'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  const events = await locals.pb.collection('events').getList(1, 1, {
    filter: `slug = "${params.eventSlug}"`
  })
  if (events.items.length === 0) throw error(404, 'Event not found')
  const event = events.items[0]
  const eventId = event.id as string

  const [campaigns, templates, segments] = await Promise.all([
    locals.pb.collection('email_campaigns').getFullList({
      filter: `eventId = "${eventId}"`,
      sort: '-created'
    }),
    locals.pb.collection('email_templates').getFullList({
      filter: `eventId = "${eventId}"`,
      sort: 'name'
    }),
    locals.pb.collection('segments').getFullList({
      filter: `eventId = "${eventId}"`,
      sort: 'name'
    })
  ])

  return {
    eventSlug: params.eventSlug,
    eventId,
    campaigns: campaigns.map((c) => ({
      id: c.id as string,
      name: c.name as string,
      subject: c.subject as string,
      bodyHtml: (c.bodyHtml as string) || '',
      bodyText: (c.bodyText as string) || '',
      status: c.status as string,
      totalRecipients: (c.totalRecipients as number) || 0,
      totalSent: (c.totalSent as number) || 0,
      totalFailed: (c.totalFailed as number) || 0,
      segmentId: (c.segmentId as string) || '',
      templateId: (c.templateId as string) || '',
      sentAt: c.sentAt ? new Date(c.sentAt as string) : undefined,
      createdAt: new Date(c.created as string)
    })),
    templates: templates.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      subject: t.subject as string
    })),
    segments: segments.map((s) => ({
      id: s.id as string,
      name: s.name as string,
      contactCount: (s.contactCount as number) || 0
    }))
  }
}

export const actions: Actions = {
  createCampaign: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim()
    const subject = (formData.get('subject') as string)?.trim()
    const bodyHtml = (formData.get('bodyHtml') as string) || ''
    const bodyText = (formData.get('bodyText') as string) || ''
    const segmentId = (formData.get('segmentId') as string) || ''
    const templateId = (formData.get('templateId') as string) || ''

    if (!name) {
      return fail(400, { error: 'Name is required', action: 'createCampaign' })
    }
    if (!subject) {
      return fail(400, { error: 'Subject is required', action: 'createCampaign' })
    }

    const events = await locals.pb.collection('events').getList(1, 1, {
      filter: `slug = "${params.eventSlug}"`
    })
    if (events.items.length === 0) {
      return fail(404, { error: 'Event not found', action: 'createCampaign' })
    }
    const eventId = events.items[0].id as string

    try {
      await locals.pb.collection('email_campaigns').create({
        eventId,
        name,
        subject,
        bodyHtml,
        bodyText,
        segmentId: segmentId || null,
        templateId: templateId || null,
        status: 'draft',
        totalRecipients: 0,
        totalSent: 0,
        totalFailed: 0
      })

      return { success: true, action: 'createCampaign' }
    } catch (err) {
      console.error('Failed to create campaign:', err)
      return fail(500, { error: 'Failed to create campaign', action: 'createCampaign' })
    }
  },

  updateCampaign: async ({ request, locals }) => {
    const formData = await request.formData()
    const campaignId = (formData.get('campaignId') as string)?.trim()
    const name = (formData.get('name') as string)?.trim()
    const subject = (formData.get('subject') as string)?.trim()
    const bodyHtml = (formData.get('bodyHtml') as string) || ''
    const bodyText = (formData.get('bodyText') as string) || ''
    const segmentId = (formData.get('segmentId') as string) || ''
    const templateId = (formData.get('templateId') as string) || ''

    if (!campaignId) {
      return fail(400, { error: 'Campaign ID is required', action: 'updateCampaign' })
    }
    if (!name) {
      return fail(400, { error: 'Name is required', action: 'updateCampaign' })
    }
    if (!subject) {
      return fail(400, { error: 'Subject is required', action: 'updateCampaign' })
    }

    try {
      const campaign = await locals.pb.collection('email_campaigns').getOne(campaignId)
      if (
        !canEditCampaign(
          campaign.status as 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
        )
      ) {
        return fail(400, {
          error: 'Only draft or scheduled campaigns can be edited',
          action: 'updateCampaign'
        })
      }

      await locals.pb.collection('email_campaigns').update(campaignId, {
        name,
        subject,
        bodyHtml,
        bodyText,
        segmentId: segmentId || null,
        templateId: templateId || null
      })

      return { success: true, action: 'updateCampaign' }
    } catch (err) {
      console.error('Failed to update campaign:', err)
      return fail(500, { error: 'Failed to update campaign', action: 'updateCampaign' })
    }
  },

  deleteCampaign: async ({ request, locals }) => {
    const formData = await request.formData()
    const campaignId = formData.get('campaignId') as string

    if (!campaignId) {
      return fail(400, { error: 'Campaign ID is required', action: 'deleteCampaign' })
    }

    try {
      const campaign = await locals.pb.collection('email_campaigns').getOne(campaignId)
      if (campaign.status !== 'draft' && campaign.status !== 'cancelled') {
        return fail(400, {
          error: 'Only draft or cancelled campaigns can be deleted',
          action: 'deleteCampaign'
        })
      }

      await locals.pb.collection('email_campaigns').delete(campaignId)
      return { success: true, action: 'deleteCampaign' }
    } catch (err) {
      console.error('Failed to delete campaign:', err)
      return fail(500, { error: 'Failed to delete campaign', action: 'deleteCampaign' })
    }
  },

  sendCampaign: async ({ request, locals }) => {
    const formData = await request.formData()
    const campaignId = formData.get('campaignId') as string

    if (!campaignId) {
      return fail(400, { error: 'Campaign ID is required', action: 'sendCampaign' })
    }

    try {
      const sendCampaign = createSendCampaignUseCase(locals.pb)
      const result = await sendCampaign(campaignId)

      return {
        success: true,
        action: 'sendCampaign',
        sendResult: {
          totalRecipients: result.totalRecipients,
          totalSent: result.totalSent,
          totalFailed: result.totalFailed
        }
      }
    } catch (err) {
      console.error('Failed to send campaign:', err)
      return fail(500, {
        error: err instanceof Error ? err.message : 'Failed to send campaign',
        action: 'sendCampaign'
      })
    }
  },

  testSendCampaign: async ({ request, locals }) => {
    const formData = await request.formData()
    const campaignId = formData.get('campaignId') as string
    const testEmail = (formData.get('testEmail') as string)?.trim()

    if (!campaignId) {
      return fail(400, { error: 'Campaign ID is required', action: 'testSendCampaign' })
    }
    if (!testEmail) {
      return fail(400, { error: 'Test email is required', action: 'testSendCampaign' })
    }

    try {
      const campaign = await locals.pb.collection('email_campaigns').getOne(campaignId)

      const variables: Record<string, string> = {
        '{{firstName}}': 'Test',
        '{{lastName}}': 'User',
        '{{email}}': testEmail,
        '{{company}}': 'Test Company',
        '{{eventName}}': 'Test Event',
        '{{editionName}}': 'Test Edition',
        '{{unsubscribeUrl}}': '#'
      }

      const html = interpolateTemplate((campaign.bodyHtml as string) || '', variables)
      const text = interpolateTemplate((campaign.bodyText as string) || '', variables)
      const subject = `[TEST] ${interpolateTemplate(campaign.subject as string, variables)}`

      const emailService = await getEmailService(locals.pb)
      const sendResult = await emailService.send({
        to: testEmail,
        subject,
        html,
        text
      })

      if (!sendResult.success) {
        return fail(500, {
          error: `Failed to send test email: ${sendResult.error}`,
          action: 'testSendCampaign'
        })
      }

      return { success: true, action: 'testSendCampaign' }
    } catch (err) {
      console.error('Failed to send test email:', err)
      return fail(500, {
        error: err instanceof Error ? err.message : 'Failed to send test email',
        action: 'testSendCampaign'
      })
    }
  },

  cancelCampaign: async ({ request, locals }) => {
    const formData = await request.formData()
    const campaignId = formData.get('campaignId') as string

    if (!campaignId) {
      return fail(400, { error: 'Campaign ID is required', action: 'cancelCampaign' })
    }

    try {
      const campaign = await locals.pb.collection('email_campaigns').getOne(campaignId)
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return fail(400, {
          error: 'Only draft or scheduled campaigns can be cancelled',
          action: 'cancelCampaign'
        })
      }

      await locals.pb.collection('email_campaigns').update(campaignId, {
        status: 'cancelled'
      })

      return { success: true, action: 'cancelCampaign' }
    } catch (err) {
      console.error('Failed to cancel campaign:', err)
      return fail(500, { error: 'Failed to cancel campaign', action: 'cancelCampaign' })
    }
  },

  scheduleCampaign: async ({ request, locals }) => {
    const formData = await request.formData()
    const campaignId = formData.get('campaignId') as string
    const scheduledAt = formData.get('scheduledAt') as string

    if (!campaignId) {
      return fail(400, { error: 'Campaign ID is required', action: 'scheduleCampaign' })
    }
    if (!scheduledAt) {
      return fail(400, { error: 'Schedule date is required', action: 'scheduleCampaign' })
    }

    const scheduleDate = new Date(scheduledAt)
    if (scheduleDate <= new Date()) {
      return fail(400, {
        error: 'Schedule date must be in the future',
        action: 'scheduleCampaign'
      })
    }

    try {
      const campaign = await locals.pb.collection('email_campaigns').getOne(campaignId)
      if (campaign.status !== 'draft') {
        return fail(400, {
          error: 'Only draft campaigns can be scheduled',
          action: 'scheduleCampaign'
        })
      }

      await locals.pb.collection('email_campaigns').update(campaignId, {
        status: 'scheduled',
        scheduledAt: scheduleDate.toISOString()
      })

      return { success: true, action: 'scheduleCampaign' }
    } catch (err) {
      console.error('Failed to schedule campaign:', err)
      return fail(500, { error: 'Failed to schedule campaign', action: 'scheduleCampaign' })
    }
  }
}
