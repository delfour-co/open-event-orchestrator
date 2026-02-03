import type { Speaker, Talk } from '../domain'
import type { SpeakerRepository, TalkRepository } from '../infra'

export interface GetSpeakerSubmissionsInput {
  email: string
  editionId?: string
}

export interface GetSpeakerSubmissionsResult {
  speaker: Speaker | null
  talks: Talk[]
}

export const createGetSpeakerSubmissionsUseCase = (
  talkRepository: TalkRepository,
  speakerRepository: SpeakerRepository
) => {
  return async (input: GetSpeakerSubmissionsInput): Promise<GetSpeakerSubmissionsResult> => {
    const speaker = await speakerRepository.findByEmail(input.email)

    if (!speaker) {
      return {
        speaker: null,
        talks: []
      }
    }

    let talks: Talk[]

    if (input.editionId) {
      talks = await talkRepository.findByFilters({
        speakerId: speaker.id,
        editionId: input.editionId
      })
    } else {
      talks = await talkRepository.findBySpeaker(speaker.id)
    }

    return {
      speaker,
      talks
    }
  }
}

export type GetSpeakerSubmissionsUseCase = ReturnType<typeof createGetSpeakerSubmissionsUseCase>
