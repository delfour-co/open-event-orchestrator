import { canManageCfpSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const DEFAULT_SETTINGS = {
  cfpOpenDate: null as Date | null,
  cfpCloseDate: null as Date | null,
  introText:
    'We are looking for speakers to share their knowledge and experience at our conference.',
  maxSubmissionsPerSpeaker: 3,
  requireAbstract: true,
  requireDescription: false,
  allowCoSpeakers: true,
  anonymousReview: false,
  revealSpeakersAfterDecision: true
}

export const load: PageServerLoad = async ({ parent, locals }) => {
  // Check permission - reviewers cannot access CFP settings
  const userRole = locals.user?.role as string | undefined
  if (!canManageCfpSettings(userRole)) {
    throw error(403, 'You do not have permission to access CFP settings')
  }

  const { edition } = await parent()

  // Try to get existing CFP settings for this edition
  let cfpSettings = null
  try {
    cfpSettings = await locals.pb
      .collection('cfp_settings')
      .getFirstListItem(`editionId="${edition.id}"`)
  } catch {
    // No settings exist yet, will use defaults
  }

  // Get categories for this edition
  const categories = await locals.pb.collection('categories').getFullList({
    filter: `editionId="${edition.id}"`,
    sort: 'order'
  })

  // Get formats for this edition
  const formats = await locals.pb.collection('formats').getFullList({
    filter: `editionId="${edition.id}"`,
    sort: 'order'
  })

  return {
    edition,
    settings: cfpSettings
      ? {
          id: cfpSettings.id as string,
          cfpOpenDate: cfpSettings.cfpOpenDate
            ? new Date(cfpSettings.cfpOpenDate as string)
            : edition.startDate,
          cfpCloseDate: cfpSettings.cfpCloseDate
            ? new Date(cfpSettings.cfpCloseDate as string)
            : edition.endDate,
          introText: (cfpSettings.introText as string) || DEFAULT_SETTINGS.introText,
          maxSubmissionsPerSpeaker:
            (cfpSettings.maxSubmissionsPerSpeaker as number) ||
            DEFAULT_SETTINGS.maxSubmissionsPerSpeaker,
          requireAbstract:
            cfpSettings.requireAbstract !== undefined
              ? (cfpSettings.requireAbstract as boolean)
              : DEFAULT_SETTINGS.requireAbstract,
          requireDescription:
            cfpSettings.requireDescription !== undefined
              ? (cfpSettings.requireDescription as boolean)
              : DEFAULT_SETTINGS.requireDescription,
          allowCoSpeakers:
            cfpSettings.allowCoSpeakers !== undefined
              ? (cfpSettings.allowCoSpeakers as boolean)
              : DEFAULT_SETTINGS.allowCoSpeakers,
          anonymousReview:
            cfpSettings.anonymousReview !== undefined
              ? (cfpSettings.anonymousReview as boolean)
              : DEFAULT_SETTINGS.anonymousReview,
          revealSpeakersAfterDecision:
            cfpSettings.revealSpeakersAfterDecision !== undefined
              ? (cfpSettings.revealSpeakersAfterDecision as boolean)
              : DEFAULT_SETTINGS.revealSpeakersAfterDecision
        }
      : {
          id: null as string | null,
          cfpOpenDate: edition.startDate,
          cfpCloseDate: edition.endDate,
          introText: DEFAULT_SETTINGS.introText,
          maxSubmissionsPerSpeaker: DEFAULT_SETTINGS.maxSubmissionsPerSpeaker,
          requireAbstract: DEFAULT_SETTINGS.requireAbstract,
          requireDescription: DEFAULT_SETTINGS.requireDescription,
          allowCoSpeakers: DEFAULT_SETTINGS.allowCoSpeakers,
          anonymousReview: DEFAULT_SETTINGS.anonymousReview,
          revealSpeakersAfterDecision: DEFAULT_SETTINGS.revealSpeakersAfterDecision
        },
    categories: categories.map((c) => ({
      id: c.id as string,
      name: c.name as string,
      description: (c.description as string) || '',
      color: (c.color as string) || '#6b7280',
      order: (c.order as number) || 0
    })),
    formats: formats.map((f) => ({
      id: f.id as string,
      name: f.name as string,
      description: (f.description as string) || '',
      duration: f.duration as number,
      order: (f.order as number) || 0
    }))
  }
}

export const actions: Actions = {
  updateSettings: async ({ request, locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageCfpSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify CFP settings' })
    }

    const formData = await request.formData()

    const cfpOpenDate = formData.get('cfpOpenDate') as string
    const cfpCloseDate = formData.get('cfpCloseDate') as string
    const introText = formData.get('introText') as string
    const maxSubmissionsPerSpeaker = Number.parseInt(
      formData.get('maxSubmissionsPerSpeaker') as string,
      10
    )
    const requireAbstract = formData.has('requireAbstract')
    const requireDescription = formData.has('requireDescription')
    const allowCoSpeakers = formData.has('allowCoSpeakers')
    const anonymousReview = formData.has('anonymousReview')
    const revealSpeakersAfterDecision = formData.has('revealSpeakersAfterDecision')

    // Validate dates
    if (cfpOpenDate && cfpCloseDate) {
      const openDate = new Date(cfpOpenDate)
      const closeDate = new Date(cfpCloseDate)

      if (closeDate <= openDate) {
        return fail(400, {
          error: 'Close date must be after open date'
        })
      }
    }

    try {
      // Get edition by slug
      const edition = await locals.pb
        .collection('editions')
        .getFirstListItem(`slug="${params.editionSlug}"`)

      // Check if settings already exist
      let existingSettings = null
      try {
        existingSettings = await locals.pb
          .collection('cfp_settings')
          .getFirstListItem(`editionId="${edition.id}"`)
      } catch {
        // No existing settings
      }

      const settingsData = {
        editionId: edition.id,
        cfpOpenDate: cfpOpenDate || null,
        cfpCloseDate: cfpCloseDate || null,
        introText: introText || '',
        maxSubmissionsPerSpeaker: maxSubmissionsPerSpeaker || 3,
        requireAbstract,
        requireDescription,
        allowCoSpeakers,
        anonymousReview,
        revealSpeakersAfterDecision
      }

      if (existingSettings) {
        // Update existing settings
        await locals.pb.collection('cfp_settings').update(existingSettings.id, settingsData)
      } else {
        // Create new settings
        await locals.pb.collection('cfp_settings').create(settingsData)
      }

      return { success: true, message: 'CFP settings saved successfully' }
    } catch (e) {
      console.error('Failed to save CFP settings:', e)
      return fail(500, { error: 'Failed to save settings' })
    }
  },

  addCategory: async ({ request, locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageCfpSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage categories' })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const color = formData.get('color') as string

    if (!name) {
      return fail(400, { error: 'Category name is required' })
    }

    try {
      const edition = await locals.pb
        .collection('editions')
        .getFirstListItem(`slug="${params.editionSlug}"`)

      // Get current max order
      const categories = await locals.pb.collection('categories').getFullList({
        filter: `editionId="${edition.id}"`,
        sort: '-order'
      })
      const maxOrder = categories.length > 0 ? ((categories[0].order as number) || 0) + 1 : 0

      await locals.pb.collection('categories').create({
        editionId: edition.id,
        name,
        description: description || null,
        color: color || '#6b7280',
        order: maxOrder
      })

      return { success: true, message: 'Category added' }
    } catch (e) {
      console.error('Failed to add category:', e)
      return fail(500, { error: 'Failed to add category' })
    }
  },

  deleteCategory: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageCfpSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage categories' })
    }

    const formData = await request.formData()
    const id = formData.get('id') as string

    try {
      await locals.pb.collection('categories').delete(id)
      return { success: true, message: 'Category deleted' }
    } catch (e) {
      console.error('Failed to delete category:', e)
      return fail(500, { error: 'Failed to delete category' })
    }
  },

  addFormat: async ({ request, locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageCfpSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage formats' })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const duration = Number.parseInt(formData.get('duration') as string, 10)

    if (!name || !duration) {
      return fail(400, { error: 'Format name and duration are required' })
    }

    try {
      const edition = await locals.pb
        .collection('editions')
        .getFirstListItem(`slug="${params.editionSlug}"`)

      // Get current max order
      const formats = await locals.pb.collection('formats').getFullList({
        filter: `editionId="${edition.id}"`,
        sort: '-order'
      })
      const maxOrder = formats.length > 0 ? ((formats[0].order as number) || 0) + 1 : 0

      await locals.pb.collection('formats').create({
        editionId: edition.id,
        name,
        description: description || null,
        duration,
        order: maxOrder
      })

      return { success: true, message: 'Format added' }
    } catch (e) {
      console.error('Failed to add format:', e)
      return fail(500, { error: 'Failed to add format' })
    }
  },

  deleteFormat: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageCfpSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage formats' })
    }

    const formData = await request.formData()
    const id = formData.get('id') as string

    try {
      await locals.pb.collection('formats').delete(id)
      return { success: true, message: 'Format deleted' }
    } catch (e) {
      console.error('Failed to delete format:', e)
      return fail(500, { error: 'Failed to delete format' })
    }
  }
}
