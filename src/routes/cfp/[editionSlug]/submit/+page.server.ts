import { createSpeakerSchema, createTalkSchema } from '$lib/features/cfp/domain'
import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { createSubmitTalkUseCase } from '$lib/features/cfp/usecases'
import { sendCfpNotification } from '$lib/server/cfp-notifications'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { edition, categories, formats, cfpStatus, cfpOpenDate, cfpCloseDate, allowCoSpeakers } =
    await parent()

  // Block access if CFP is not open
  if (cfpStatus !== 'open') {
    throw error(
      403,
      cfpStatus === 'not_open_yet'
        ? 'The Call for Papers has not opened yet. Please check back later.'
        : 'The Call for Papers is now closed. Thank you for your interest!'
    )
  }

  return { edition, categories, formats, allowCoSpeakers }
}

export const actions: Actions = {
  submit: async ({ request, locals, params }) => {
    // First, verify CFP is still open
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    // Check CFP settings
    let cfpSettings = null
    try {
      cfpSettings = await locals.pb
        .collection('cfp_settings')
        .getFirstListItem(`editionId="${editionId}"`)
    } catch {
      // No settings
    }

    const now = new Date()
    const cfpOpenDate = cfpSettings?.cfpOpenDate
      ? new Date(cfpSettings.cfpOpenDate as string)
      : null
    const cfpCloseDate = cfpSettings?.cfpCloseDate
      ? new Date(cfpSettings.cfpCloseDate as string)
      : null

    if (cfpOpenDate && now < cfpOpenDate) {
      return fail(403, { error: 'The Call for Papers has not opened yet.' })
    }

    if (cfpCloseDate && now > cfpCloseDate) {
      return fail(403, { error: 'The Call for Papers is now closed.' })
    }

    const formData = await request.formData()

    // Parse speaker data
    const speakerData = {
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      bio: (formData.get('bio') as string) || undefined,
      company: (formData.get('company') as string) || undefined,
      jobTitle: (formData.get('jobTitle') as string) || undefined,
      city: (formData.get('city') as string) || undefined,
      country: (formData.get('country') as string) || undefined,
      twitter: (formData.get('twitter') as string) || undefined,
      github: (formData.get('github') as string) || undefined,
      linkedin: (formData.get('linkedin') as string) || undefined
    }

    // Parse talk data
    const talkData = {
      title: formData.get('title') as string,
      abstract: formData.get('abstract') as string,
      description: (formData.get('description') as string) || undefined,
      language: formData.get('language') as 'fr' | 'en',
      level: (formData.get('level') as 'beginner' | 'intermediate' | 'advanced') || undefined,
      categoryId: (formData.get('categoryId') as string) || undefined,
      formatId: (formData.get('formatId') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined
    }

    // Validate speaker
    const speakerResult = createSpeakerSchema.safeParse(speakerData)
    if (!speakerResult.success) {
      const errors: Record<string, string> = {}
      for (const issue of speakerResult.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      return fail(400, {
        speakerErrors: errors,
        speaker: speakerData,
        talk: talkData
      })
    }

    // Validate talk (partial validation for submission)
    const talkValidation = createTalkSchema
      .omit({ editionId: true, speakerIds: true })
      .safeParse(talkData)
    if (!talkValidation.success) {
      const errors: Record<string, string> = {}
      for (const issue of talkValidation.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      return fail(400, {
        talkErrors: errors,
        speaker: speakerData,
        talk: talkData
      })
    }

    // Submit the talk
    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)
    const submitTalk = createSubmitTalkUseCase(talkRepository, speakerRepository)

    try {
      const result = await submitTalk({
        editionId,
        speaker: speakerResult.data,
        talk: talkValidation.data
      })

      // Get edition and event info for email
      const edition = editions.items[0]
      let eventName = edition.name as string
      try {
        const event = await locals.pb.collection('events').getOne(edition.eventId as string)
        eventName = event.name as string
      } catch {
        // Use edition name as fallback
      }

      // Send confirmation email (don't await - fire and forget)
      sendCfpNotification({
        pb: locals.pb,
        type: 'submission_confirmed',
        talkId: result.talk.id,
        speakerId: result.speaker.id,
        editionId,
        editionSlug: params.editionSlug,
        editionName: edition.name as string,
        eventName,
        baseUrl: request.url.split('/cfp')[0]
      }).catch((err) => {
        console.error('Failed to send submission confirmation email:', err)
      })

      // Redirect to success page or submissions list
      throw redirect(
        303,
        `/cfp/${params.editionSlug}/submissions?success=true&email=${encodeURIComponent(result.speaker.email)}`
      )
    } catch (err) {
      if (err instanceof Response) {
        throw err // Re-throw redirect
      }
      console.error('Failed to submit talk:', err)
      return fail(500, {
        error: 'Failed to submit talk. Please try again.',
        speaker: speakerData,
        talk: talkData
      })
    }
  }
}
