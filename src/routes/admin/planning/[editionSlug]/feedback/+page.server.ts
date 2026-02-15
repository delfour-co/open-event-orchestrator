import { FeedbackSettingsRepository } from '$lib/features/feedback/infra'
import { DEFAULT_FEEDBACK_SETTINGS } from '$lib/features/feedback/domain/feedback-settings'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
	const { editionSlug } = params

	const editions = await locals.pb.collection('editions').getList(1, 1, {
		filter: `slug = "${editionSlug}"`
	})

	if (editions.items.length === 0) {
		throw error(404, 'Edition not found')
	}

	const edition = editions.items[0]
	const editionId = edition.id as string

	const feedbackSettingsRepo = new FeedbackSettingsRepository(locals.pb)
	const settings = await feedbackSettingsRepo.getByEdition(editionId)

	return {
		edition: {
			id: editionId,
			name: edition.name as string,
			slug: edition.slug as string
		},
		settings: settings
			? {
					id: settings.id,
					sessionRatingEnabled: settings.sessionRatingEnabled,
					sessionRatingMode: settings.sessionRatingMode,
					sessionCommentRequired: settings.sessionCommentRequired,
					eventFeedbackEnabled: settings.eventFeedbackEnabled,
					feedbackIntroText: settings.feedbackIntroText
				}
			: null,
		defaultSettings: DEFAULT_FEEDBACK_SETTINGS
	}
}

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
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
		const sessionRatingMode = formData.get('sessionRatingMode') as string
		const sessionCommentRequired = formData.get('sessionCommentRequired') === 'true'
		const eventFeedbackEnabled = formData.get('eventFeedbackEnabled') === 'true'
		const feedbackIntroText = (formData.get('feedbackIntroText') as string)?.trim() || ''

		const feedbackSettingsRepo = new FeedbackSettingsRepository(locals.pb)
		const existingSettings = await feedbackSettingsRepo.getByEdition(editionId)

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
			return { success: true }
		} catch (err) {
			console.error('Failed to save feedback settings:', err)
			return fail(500, { error: 'Failed to save settings' })
		}
	}
}
