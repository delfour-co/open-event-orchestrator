import { createTicketTemplateRepository } from '$lib/features/billing/infra'
import { validateImageFile } from '$lib/server/file-validation'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`,
    expand: 'eventId'
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const event = edition.expand?.eventId as Record<string, unknown> | undefined

  const templateRepo = createTicketTemplateRepository(locals.pb)
  const template = await templateRepo.findByEdition(edition.id as string)

  let logoUrl: string | undefined
  if (template) {
    logoUrl = templateRepo.getLogoUrl(template)
  }

  return {
    edition: {
      id: edition.id as string,
      name: edition.name as string,
      slug: edition.slug as string,
      venue: edition.venue as string | undefined,
      startDate: edition.startDate ? new Date(edition.startDate as string) : undefined
    },
    event: {
      name: (event?.name as string) || 'Event'
    },
    template: template
      ? {
          id: template.id,
          primaryColor: template.primaryColor,
          backgroundColor: template.backgroundColor,
          textColor: template.textColor,
          accentColor: template.accentColor,
          logoUrl,
          showVenue: template.showVenue,
          showDate: template.showDate,
          showQrCode: template.showQrCode,
          customFooterText: template.customFooterText
        }
      : null
  }
}

export const actions: Actions = {
  save: async ({ request, params, locals }) => {
    const { editionSlug } = params
    const formData = await request.formData()

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const edition = editions.items[0]
    const editionId = edition.id as string

    const primaryColor = formData.get('primaryColor') as string
    const backgroundColor = formData.get('backgroundColor') as string
    const textColor = formData.get('textColor') as string
    const accentColor = formData.get('accentColor') as string
    const logoUrl = formData.get('logoUrl') as string
    const showVenue = formData.get('showVenue') === 'true'
    const showDate = formData.get('showDate') === 'true'
    const showQrCode = formData.get('showQrCode') === 'true'
    const customFooterText = formData.get('customFooterText') as string
    const logoFile = formData.get('logoFile') as File | null

    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(primaryColor)) {
      return fail(400, { error: 'Invalid primary color format' })
    }
    if (!colorRegex.test(backgroundColor)) {
      return fail(400, { error: 'Invalid background color format' })
    }
    if (!colorRegex.test(textColor)) {
      return fail(400, { error: 'Invalid text color format' })
    }
    if (!colorRegex.test(accentColor)) {
      return fail(400, { error: 'Invalid accent color format' })
    }

    if (logoFile && logoFile.size > 0) {
      const validation = validateImageFile(logoFile, { maxSizeMB: 2 })
      if (!validation.valid) {
        return fail(400, { error: validation.error })
      }
    }

    try {
      const templateRepo = createTicketTemplateRepository(locals.pb)
      const existingTemplate = await templateRepo.findByEdition(editionId)

      const templateData = {
        primaryColor,
        backgroundColor,
        textColor,
        accentColor,
        logoUrl: logoUrl || undefined,
        showVenue,
        showDate,
        showQrCode,
        customFooterText: customFooterText || undefined
      }

      if (existingTemplate) {
        if (logoFile && logoFile.size > 0) {
          await templateRepo.updateWithLogo(existingTemplate.id, templateData, logoFile)
        } else {
          await templateRepo.update(existingTemplate.id, templateData)
        }
      } else {
        if (logoFile && logoFile.size > 0) {
          await templateRepo.createWithLogo({ editionId, ...templateData }, logoFile)
        } else {
          await templateRepo.create({ editionId, ...templateData })
        }
      }

      return { success: true, message: 'Ticket design saved successfully' }
    } catch (e) {
      console.error('Failed to save ticket template:', e)
      return fail(500, { error: 'Failed to save ticket design' })
    }
  },

  removeLogo: async ({ params, locals }) => {
    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const edition = editions.items[0]

    try {
      const templateRepo = createTicketTemplateRepository(locals.pb)
      const template = await templateRepo.findByEdition(edition.id as string)

      if (template) {
        await templateRepo.removeLogo(template.id)
      }

      return { success: true, message: 'Logo removed' }
    } catch (e) {
      console.error('Failed to remove logo:', e)
      return fail(500, { error: 'Failed to remove logo' })
    }
  },

  reset: async ({ params, locals }) => {
    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const edition = editions.items[0]

    try {
      const templateRepo = createTicketTemplateRepository(locals.pb)
      const template = await templateRepo.findByEdition(edition.id as string)

      if (template) {
        await templateRepo.delete(template.id)
      }

      return { success: true, message: 'Template reset to defaults' }
    } catch (e) {
      console.error('Failed to reset template:', e)
      return fail(500, { error: 'Failed to reset template' })
    }
  }
}
