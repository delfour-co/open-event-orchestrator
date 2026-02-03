import { createSpeakerSchema, createTalkSchema } from '$lib/features/cfp/domain'
import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { createSubmitTalkUseCase } from '$lib/features/cfp/usecases'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { edition, categories, formats } = await parent()
  return { edition, categories, formats }
}

export const actions: Actions = {
  submit: async ({ request, locals, params }) => {
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

    // Get edition ID from the parent layout
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

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
