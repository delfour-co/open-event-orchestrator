import { createSpeakerSchema, createTalkSchema } from '$lib/features/cfp/domain'
import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, params, url, locals }) => {
  const { edition, categories, formats, cfpStatus } = await parent()
  const email = url.searchParams.get('email')

  // Check CFP is still open
  if (cfpStatus !== 'open') {
    throw error(403, 'Editing is not available when the CFP is closed.')
  }

  if (!email) {
    throw error(400, 'Email is required to edit a submission.')
  }

  const talkRepository = createTalkRepository(locals.pb)
  const speakerRepository = createSpeakerRepository(locals.pb)

  // Get the talk
  const talk = await talkRepository.findById(params.talkId)
  if (!talk) {
    throw error(404, 'Talk not found')
  }

  // Verify the talk belongs to this edition
  if (talk.editionId !== edition.id) {
    throw error(404, 'Talk not found in this edition')
  }

  // Check talk status allows editing
  const editableStatuses = ['draft', 'submitted']
  if (!editableStatuses.includes(talk.status)) {
    throw error(403, `Cannot edit a talk with status "${talk.status}"`)
  }

  // Get the speaker and verify ownership
  const speaker = await speakerRepository.findByEmail(email)
  if (!speaker || !talk.speakerIds.includes(speaker.id)) {
    throw error(403, 'You are not authorized to edit this talk')
  }

  return {
    edition,
    categories,
    formats,
    talk,
    speaker
  }
}

export const actions: Actions = {
  update: async ({ request, locals, params, url }) => {
    const email = url.searchParams.get('email')

    if (!email) {
      return fail(400, { error: 'Email is required' })
    }

    // Verify CFP is still open
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    let cfpSettings = null
    try {
      cfpSettings = await locals.pb
        .collection('cfp_settings')
        .getFirstListItem(`editionId="${editionId}"`)
    } catch {
      // No settings
    }

    const now = new Date()
    const cfpCloseDate = cfpSettings?.cfpCloseDate
      ? new Date(cfpSettings.cfpCloseDate as string)
      : null

    if (cfpCloseDate && now > cfpCloseDate) {
      return fail(403, { error: 'The Call for Papers is now closed. Editing is not allowed.' })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    // Verify ownership
    const talk = await talkRepository.findById(params.talkId)
    if (!talk) {
      return fail(404, { error: 'Talk not found' })
    }

    const speaker = await speakerRepository.findByEmail(email)
    if (!speaker || !talk.speakerIds.includes(speaker.id)) {
      return fail(403, { error: 'You are not authorized to edit this talk' })
    }

    // Check status
    const editableStatuses = ['draft', 'submitted']
    if (!editableStatuses.includes(talk.status)) {
      return fail(403, { error: `Cannot edit a talk with status "${talk.status}"` })
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

    // Validate talk
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

    try {
      // Update speaker
      await speakerRepository.update(speaker.id, {
        firstName: speakerResult.data.firstName,
        lastName: speakerResult.data.lastName,
        bio: speakerResult.data.bio,
        company: speakerResult.data.company,
        jobTitle: speakerResult.data.jobTitle,
        city: speakerResult.data.city,
        country: speakerResult.data.country,
        twitter: speakerResult.data.twitter,
        github: speakerResult.data.github,
        linkedin: speakerResult.data.linkedin
      })

      // Update talk
      await talkRepository.update(params.talkId, {
        title: talkValidation.data.title,
        abstract: talkValidation.data.abstract,
        description: talkValidation.data.description,
        language: talkValidation.data.language,
        level: talkValidation.data.level,
        categoryId: talkValidation.data.categoryId,
        formatId: talkValidation.data.formatId,
        notes: talkValidation.data.notes
      })

      throw redirect(
        303,
        `/cfp/${params.editionSlug}/submissions?email=${encodeURIComponent(email)}`
      )
    } catch (err) {
      if (err instanceof Response) {
        throw err
      }
      console.error('Failed to update submission:', err)
      return fail(500, {
        error: 'Failed to update submission. Please try again.',
        speaker: speakerData,
        talk: talkData
      })
    }
  }
}
