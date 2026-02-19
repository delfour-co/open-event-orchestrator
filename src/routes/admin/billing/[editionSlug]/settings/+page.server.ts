import { getSmtpSettings, getStripeSettings } from '$lib/server/app-settings'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]

  // Get ticket types to show sales status
  const ticketTypes = await locals.pb.collection('ticket_types').getFullList({
    filter: `editionId = "${edition.id}"`,
    sort: 'order,name'
  })

  const activeTicketTypes = ticketTypes.filter((tt) => tt.isActive)
  const totalCapacity = ticketTypes.reduce((sum, tt) => sum + (tt.quantity as number), 0)
  const totalSold = ticketTypes.reduce((sum, tt) => sum + ((tt.quantitySold as number) || 0), 0)

  const publicUrl = `${url.origin}/tickets/${editionSlug}`
  const smtpSettings = await getSmtpSettings(locals.pb)
  const stripeSettings = await getStripeSettings(locals.pb)

  return {
    edition: {
      id: edition.id as string,
      name: edition.name as string,
      slug: edition.slug as string,
      status: edition.status as string
    },
    settings: {
      publicUrl,
      stripeConfigured: stripeSettings.isConfigured,
      stripeLocalMock: stripeSettings.isLocalMock,
      stripeWebhookConfigured: !!stripeSettings.stripeWebhookSecret,
      emailConfigured: smtpSettings.smtpEnabled && !!smtpSettings.smtpHost,
      activeTicketTypes: activeTicketTypes.length,
      totalTicketTypes: ticketTypes.length,
      totalCapacity,
      totalSold,
      salesOpen: activeTicketTypes.length > 0 && edition.status === 'published'
    }
  }
}

export const actions: Actions = {
  toggleAllSales: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const enable = formData.get('enable') === 'true'

    if (!editionId) {
      return fail(400, { error: 'Edition ID is required' })
    }

    try {
      // Toggle isActive on all ticket types for this edition
      const ticketTypes = await locals.pb.collection('ticket_types').getFullList({
        filter: `editionId = "${editionId}"`
      })

      for (const tt of ticketTypes) {
        await locals.pb.collection('ticket_types').update(tt.id, {
          isActive: enable
        })
      }

      return {
        success: true,
        action: 'toggleAllSales',
        message: enable ? 'All ticket sales enabled' : 'All ticket sales disabled'
      }
    } catch (err) {
      console.error('Failed to toggle sales:', err)
      return fail(500, { error: 'Failed to update ticket sales status' })
    }
  }
}
