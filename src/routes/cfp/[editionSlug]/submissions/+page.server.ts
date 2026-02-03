import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { createGetSpeakerSubmissionsUseCase } from '$lib/features/cfp/usecases'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, url, locals }) => {
  const { edition } = await parent()
  const email = url.searchParams.get('email')
  const success = url.searchParams.get('success') === 'true'

  if (!email) {
    return {
      edition,
      speaker: null,
      talks: [],
      success,
      needsEmail: true
    }
  }

  const talkRepository = createTalkRepository(locals.pb)
  const speakerRepository = createSpeakerRepository(locals.pb)
  const getSpeakerSubmissions = createGetSpeakerSubmissionsUseCase(
    talkRepository,
    speakerRepository
  )

  const result = await getSpeakerSubmissions({
    email,
    editionId: edition.id
  })

  return {
    edition,
    speaker: result.speaker,
    talks: result.talks,
    success,
    needsEmail: false
  }
}
