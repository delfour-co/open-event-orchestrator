import { AppSettingsRepository, DEFAULT_APP_SETTINGS } from '$lib/features/app'
import { DEFAULT_FEEDBACK_SETTINGS } from '$lib/features/feedback/domain/feedback-settings'
import { FeedbackSettingsRepository } from '$lib/features/feedback/infra'
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
  const editionId = edition.id as string
  const event = edition.expand?.eventId as Record<string, unknown> | undefined

  // Load app settings and feedback settings in parallel
  const appSettingsRepo = new AppSettingsRepository(locals.pb)
  const [appSettings, feedbackSettings] = await Promise.all([
    appSettingsRepo.getByEdition(editionId),
    new FeedbackSettingsRepository(locals.pb).getByEdition(editionId)
  ])

  // Build logo and header image URLs if they exist
  let logoUrl: string | undefined
  let headerImageUrl: string | undefined

  if (appSettings?.logoFile) {
    logoUrl = appSettingsRepo.getFileUrl(appSettings, appSettings.logoFile)
  }
  if (appSettings?.headerImage) {
    headerImageUrl = appSettingsRepo.getFileUrl(appSettings, appSettings.headerImage)
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      status: edition.status as string,
      startDate: edition.startDate as string,
      endDate: edition.endDate as string,
      venue: edition.venue as string | undefined,
      city: edition.city as string | undefined
    },
    event: event
      ? {
          name: event.name as string,
          slug: event.slug as string
        }
      : null,
    appSettings: appSettings
      ? {
          ...appSettings,
          logoUrl,
          headerImageUrl
        }
      : null,
    defaultAppSettings: DEFAULT_APP_SETTINGS,
    feedbackSettings: feedbackSettings
      ? {
          id: feedbackSettings.id,
          sessionRatingEnabled: feedbackSettings.sessionRatingEnabled,
          sessionRatingMode: feedbackSettings.sessionRatingMode,
          sessionCommentRequired: feedbackSettings.sessionCommentRequired,
          eventFeedbackEnabled: feedbackSettings.eventFeedbackEnabled,
          feedbackIntroText: feedbackSettings.feedbackIntroText
        }
      : null,
    defaultFeedbackSettings: DEFAULT_FEEDBACK_SETTINGS
  }
}

export const actions: Actions = {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Form handling with multiple optional fields
  saveAppearance: async ({ request, locals, params }) => {
    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      throw error(404, 'Edition not found')
    }

    const edition = editions.items[0]
    const editionId = edition.id as string

    const formData = await request.formData()
    const title = (formData.get('title') as string)?.trim() || ''
    const subtitle = (formData.get('subtitle') as string)?.trim() || ''
    const primaryColor = (formData.get('primaryColor') as string)?.trim() || '#3b82f6'
    const accentColor = (formData.get('accentColor') as string)?.trim() || '#8b5cf6'
    const logoFile = formData.get('logoFile') as File | null
    const headerImage = formData.get('headerImage') as File | null

    const appSettingsRepo = new AppSettingsRepository(locals.pb)
    const existingSettings = await appSettingsRepo.getByEdition(editionId)

    try {
      if (existingSettings) {
        // Update existing settings - use regular update for non-file fields
        await appSettingsRepo.update({
          id: existingSettings.id,
          title: title || undefined,
          subtitle: subtitle || undefined,
          primaryColor,
          accentColor
        })

        // Handle file uploads separately if any
        if ((logoFile && logoFile.size > 0) || (headerImage && headerImage.size > 0)) {
          const fileFormData = new FormData()
          if (logoFile && logoFile.size > 0) {
            fileFormData.append('logoFile', logoFile)
          }
          if (headerImage && headerImage.size > 0) {
            fileFormData.append('headerImage', headerImage)
          }
          await locals.pb.collection('pwa_settings').update(existingSettings.id, fileFormData)
        }
      } else {
        // Create new settings
        const createFormData = new FormData()
        createFormData.append('editionId', editionId)
        if (title) createFormData.append('title', title)
        if (subtitle) createFormData.append('subtitle', subtitle)
        if (primaryColor) createFormData.append('primaryColor', primaryColor)
        if (accentColor) createFormData.append('accentColor', accentColor)
        if (logoFile && logoFile.size > 0) {
          createFormData.append('logoFile', logoFile)
        }
        if (headerImage && headerImage.size > 0) {
          createFormData.append('headerImage', headerImage)
        }
        createFormData.append('showScheduleTab', 'true')
        createFormData.append('showSpeakersTab', 'true')
        createFormData.append('showTicketsTab', 'true')
        createFormData.append('showFeedbackTab', 'true')
        createFormData.append('showFavoritesTab', 'true')

        await locals.pb.collection('pwa_settings').create(createFormData)
      }
      return { success: true, action: 'appearance' }
    } catch (err) {
      console.error('Failed to save app settings:', err)
      return fail(500, { error: 'Failed to save app settings', action: 'appearance' })
    }
  },

  saveFeatures: async ({ request, locals, params }) => {
    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      throw error(404, 'Edition not found')
    }

    const edition = editions.items[0]
    const editionId = edition.id as string

    const formData = await request.formData()
    const showScheduleTab = formData.get('showScheduleTab') === 'true'
    const showSpeakersTab = formData.get('showSpeakersTab') === 'true'
    const showTicketsTab = formData.get('showTicketsTab') === 'true'
    const showFeedbackTab = formData.get('showFeedbackTab') === 'true'
    const showFavoritesTab = formData.get('showFavoritesTab') === 'true'

    const appSettingsRepo = new AppSettingsRepository(locals.pb)
    const existingSettings = await appSettingsRepo.getByEdition(editionId)

    try {
      if (existingSettings) {
        await appSettingsRepo.update({
          id: existingSettings.id,
          showScheduleTab,
          showSpeakersTab,
          showTicketsTab,
          showFeedbackTab,
          showFavoritesTab
        })
      } else {
        await appSettingsRepo.create({
          editionId,
          showScheduleTab,
          showSpeakersTab,
          showTicketsTab,
          showFeedbackTab,
          showFavoritesTab
        })
      }
      return { success: true, action: 'features' }
    } catch (err) {
      console.error('Failed to save feature settings:', err)
      return fail(500, { error: 'Failed to save feature settings', action: 'features' })
    }
  },

  saveFeedback: async ({ request, locals, params }) => {
    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      throw error(404, 'Edition not found')
    }

    const edition = editions.items[0]
    const editionId = edition.id as string

    const formData = await request.formData()
    const sessionRatingEnabled = formData.get('sessionRatingEnabled') === 'true'
    const sessionRatingModeRaw = formData.get('sessionRatingMode') as string | null
    const sessionCommentRequired = formData.get('sessionCommentRequired') === 'true'
    const eventFeedbackEnabled = formData.get('eventFeedbackEnabled') === 'true'
    const feedbackIntroText = (formData.get('feedbackIntroText') as string)?.trim() || ''

    const feedbackSettingsRepo = new FeedbackSettingsRepository(locals.pb)
    const existingSettings = await feedbackSettingsRepo.getByEdition(editionId)

    // Use existing rating mode if not provided (happens when session ratings are disabled)
    const sessionRatingMode = sessionRatingModeRaw || existingSettings?.sessionRatingMode || 'stars'

    try {
      if (existingSettings) {
        await feedbackSettingsRepo.update({
          id: existingSettings.id,
          sessionRatingEnabled,
          sessionRatingMode: sessionRatingMode as 'stars' | 'scale_10' | 'thumbs' | 'yes_no',
          sessionCommentRequired,
          eventFeedbackEnabled,
          feedbackIntroText: feedbackIntroText || undefined
        })
      } else {
        await feedbackSettingsRepo.create({
          editionId,
          sessionRatingEnabled,
          sessionRatingMode: sessionRatingMode as 'stars' | 'scale_10' | 'thumbs' | 'yes_no',
          sessionCommentRequired,
          eventFeedbackEnabled,
          feedbackIntroText: feedbackIntroText || undefined
        })
      }
      return { success: true, action: 'feedback' }
    } catch (err) {
      console.error('Failed to save feedback settings:', err)
      return fail(500, { error: 'Failed to save feedback settings', action: 'feedback' })
    }
  },

  resetSettings: async ({ locals, params }) => {
    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      throw error(404, 'Edition not found')
    }

    const edition = editions.items[0]
    const editionId = edition.id as string

    const appSettingsRepo = new AppSettingsRepository(locals.pb)
    const feedbackSettingsRepo = new FeedbackSettingsRepository(locals.pb)

    try {
      // Delete existing settings to reset to defaults
      const [appSettings, feedbackSettings] = await Promise.all([
        appSettingsRepo.getByEdition(editionId),
        feedbackSettingsRepo.getByEdition(editionId)
      ])

      const deletePromises: Promise<boolean>[] = []

      if (appSettings) {
        deletePromises.push(locals.pb.collection('pwa_settings').delete(appSettings.id))
      }

      if (feedbackSettings) {
        deletePromises.push(locals.pb.collection('feedback_settings').delete(feedbackSettings.id))
      }

      await Promise.all(deletePromises)

      return { success: true, action: 'reset' }
    } catch (err) {
      console.error('Failed to reset settings:', err)
      return fail(500, { error: 'Failed to reset settings', action: 'reset' })
    }
  }
}
