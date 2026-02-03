import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { edition } = await parent()

  // Get CFP settings for this edition
  // For now, we'll use the edition's dates
  // In future, this could be a separate cfp_settings collection

  return {
    edition,
    settings: {
      cfpOpenDate: edition.startDate, // Placeholder - should be separate CFP dates
      cfpCloseDate: edition.endDate,
      introText:
        'We are looking for speakers to share their knowledge and experience at our conference.',
      maxSubmissionsPerSpeaker: 3,
      requireAbstract: true,
      requireDescription: false,
      allowCoSpeakers: true,
      anonymousReview: false
    }
  }
}

export const actions: Actions = {
  updateSettings: async ({ request, params }) => {
    const formData = await request.formData()

    const cfpOpenDate = formData.get('cfpOpenDate') as string
    const cfpCloseDate = formData.get('cfpCloseDate') as string
    const introText = formData.get('introText') as string

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

    // In a real implementation, save to a cfp_settings collection
    // For now, we just return success
    console.log('Saving CFP settings:', {
      editionSlug: params.editionSlug,
      cfpOpenDate,
      cfpCloseDate,
      introText
    })

    return { success: true, message: 'Settings saved successfully' }
  }
}
