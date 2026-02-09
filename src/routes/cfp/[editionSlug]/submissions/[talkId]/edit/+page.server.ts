import { createSpeakerSchema, createTalkSchema } from '$lib/features/cfp/domain'
import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { validateSpeakerToken } from '$lib/server/speaker-tokens'
import { error, fail, isRedirect, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const EDITABLE_STATUSES = ['draft', 'submitted']

export const load: PageServerLoad = async ({ parent, params, url, locals }) => {
  const { edition, categories, formats, cfpStatus } = await parent()
  const token = url.searchParams.get('token')

  if (cfpStatus !== 'open') {
    throw error(403, 'Editing is not available when the CFP is closed.')
  }

  if (!token) {
    throw error(400, 'A valid access token is required to edit a submission.')
  }

  const tokenResult = await validateSpeakerToken(locals.pb, token, edition.id)
  if (!tokenResult.valid || !tokenResult.speakerId) {
    throw error(403, 'Invalid or expired access token. Please request a new access link.')
  }

  const talkRepository = createTalkRepository(locals.pb)
  const speakerRepository = createSpeakerRepository(locals.pb)

  const talk = await talkRepository.findById(params.talkId)
  if (!talk || talk.editionId !== edition.id) {
    throw error(404, 'Talk not found')
  }

  if (!EDITABLE_STATUSES.includes(talk.status)) {
    throw error(403, `Cannot edit a talk with status "${talk.status}"`)
  }

  const speaker = await speakerRepository.findById(tokenResult.speakerId)
  if (!speaker || !talk.speakerIds.includes(speaker.id)) {
    throw error(403, 'You are not authorized to edit this talk')
  }

  return { edition, categories, formats, talk, speaker, token }
}

function parseSpeakerFormData(formData: FormData) {
  return {
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
}

function parseTalkFormData(formData: FormData) {
  return {
    title: formData.get('title') as string,
    abstract: formData.get('abstract') as string,
    description: (formData.get('description') as string) || undefined,
    language: formData.get('language') as 'fr' | 'en',
    level: (formData.get('level') as 'beginner' | 'intermediate' | 'advanced') || undefined,
    categoryId: (formData.get('categoryId') as string) || undefined,
    formatId: (formData.get('formatId') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined
  }
}

function extractValidationErrors(
  issues: Array<{ path: (string | number)[]; message: string }>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    errors[issue.path[0] as string] = issue.message
  }
  return errors
}

async function verifyCfpOpen(pb: PocketBase, editionId: string): Promise<boolean> {
  let cfpSettings = null
  try {
    cfpSettings = await pb.collection('cfp_settings').getFirstListItem(`editionId="${editionId}"`)
  } catch {
    return true // No settings means CFP is open
  }

  const cfpCloseDate = cfpSettings?.cfpCloseDate
    ? new Date(cfpSettings.cfpCloseDate as string)
    : null

  return !cfpCloseDate || new Date() <= cfpCloseDate
}

import type PocketBase from 'pocketbase'

export const actions: Actions = {
  update: async ({ request, locals, params, url }) => {
    const token = url.searchParams.get('token')
    if (!token) {
      return fail(400, { error: 'A valid access token is required' })
    }

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    const tokenResult = await validateSpeakerToken(locals.pb, token, editionId)
    if (!tokenResult.valid || !tokenResult.speakerId) {
      return fail(403, {
        error: 'Invalid or expired access token. Please request a new access link.'
      })
    }

    const cfpOpen = await verifyCfpOpen(locals.pb, editionId)
    if (!cfpOpen) {
      return fail(403, { error: 'The Call for Papers is now closed. Editing is not allowed.' })
    }

    const talkRepository = createTalkRepository(locals.pb)
    const speakerRepository = createSpeakerRepository(locals.pb)

    const talk = await talkRepository.findById(params.talkId)
    if (!talk) {
      return fail(404, { error: 'Talk not found' })
    }

    const speaker = await speakerRepository.findById(tokenResult.speakerId)
    if (!speaker || !talk.speakerIds.includes(speaker.id)) {
      return fail(403, { error: 'You are not authorized to edit this talk' })
    }

    if (!EDITABLE_STATUSES.includes(talk.status)) {
      return fail(403, { error: `Cannot edit a talk with status "${talk.status}"` })
    }

    const formData = await request.formData()
    const speakerData = parseSpeakerFormData(formData)
    const talkData = parseTalkFormData(formData)

    const speakerResult = createSpeakerSchema.safeParse(speakerData)
    if (!speakerResult.success) {
      return fail(400, {
        speakerErrors: extractValidationErrors(speakerResult.error.issues),
        speaker: speakerData,
        talk: talkData
      })
    }

    const talkValidation = createTalkSchema
      .omit({ editionId: true, speakerIds: true })
      .safeParse(talkData)
    if (!talkValidation.success) {
      return fail(400, {
        talkErrors: extractValidationErrors(talkValidation.error.issues),
        speaker: speakerData,
        talk: talkData
      })
    }

    try {
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

      throw redirect(303, `/cfp/${params.editionSlug}/submissions?token=${token}`)
    } catch (err) {
      if (isRedirect(err)) throw err
      console.error('Failed to update submission:', err)
      return fail(500, {
        error: 'Failed to update submission. Please try again.',
        speaker: speakerData,
        talk: talkData
      })
    }
  }
}
