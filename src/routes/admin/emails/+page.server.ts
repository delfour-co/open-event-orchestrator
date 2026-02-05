import { createSendCampaignUseCase } from '$lib/features/crm/usecases'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const membership = await locals.pb.collection('organization_members').getList(1, 1, {
    filter: `userId = "${locals.user?.id}"`
  })
  if (membership.items.length === 0) throw error(404, 'No organization found')
  const organizationId = membership.items[0].organizationId as string

  const [campaigns, templates, segments] = await Promise.all([
    locals.pb.collection('email_campaigns').getFullList({
      filter: `organizationId = "${organizationId}"`,
      sort: '-created'
    }),
    locals.pb.collection('email_templates').getFullList({
      filter: `organizationId = "${organizationId}"`,
      sort: 'name'
    }),
    locals.pb.collection('segments').getFullList({
      filter: `organizationId = "${organizationId}"`,
      sort: 'name'
    })
  ])

  return {
    organizationId,
    campaigns: campaigns.map((c) => ({
      id: c.id as string,
      name: c.name as string,
      subject: c.subject as string,
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
  createCampaign: async ({ request, locals }) => {
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

    const membership = await locals.pb.collection('organization_members').getList(1, 1, {
      filter: `userId = "${locals.user?.id}"`
    })
    if (membership.items.length === 0) {
      return fail(404, { error: 'No organization found', action: 'createCampaign' })
    }
    const organizationId = membership.items[0].organizationId as string

    try {
      await locals.pb.collection('email_campaigns').create({
        organizationId,
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
  }
}
