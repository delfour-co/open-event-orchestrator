import type { CreateSpeaker, CreateTalk, Speaker, Talk } from '../domain'
import type { SpeakerRepository, TalkRepository } from '../infra'

export interface SaveDraftInput {
  editionId: string
  speaker: CreateSpeaker
  talk: Omit<CreateTalk, 'editionId' | 'speakerIds'>
  talkId?: string // If updating existing draft
}

export interface SaveDraftResult {
  talk: Talk
  speaker: Speaker
}

export const createSaveDraftUseCase = (
  talkRepository: TalkRepository,
  speakerRepository: SpeakerRepository
) => {
  return async (input: SaveDraftInput): Promise<SaveDraftResult> => {
    // Get or create speaker by email
    let speaker = await speakerRepository.findByEmail(input.speaker.email)

    if (!speaker) {
      speaker = await speakerRepository.create(input.speaker)
    } else {
      speaker = await speakerRepository.update(speaker.id, {
        firstName: input.speaker.firstName,
        lastName: input.speaker.lastName,
        bio: input.speaker.bio,
        company: input.speaker.company,
        jobTitle: input.speaker.jobTitle,
        photoUrl: input.speaker.photoUrl,
        twitter: input.speaker.twitter,
        linkedin: input.speaker.linkedin,
        github: input.speaker.github,
        city: input.speaker.city,
        country: input.speaker.country
      })
    }

    let talk: Talk

    if (input.talkId) {
      // Update existing draft
      talk = await talkRepository.update(input.talkId, {
        ...input.talk,
        speakerIds: [speaker.id]
      })
    } else {
      // Create new draft
      talk = await talkRepository.create({
        ...input.talk,
        editionId: input.editionId,
        speakerIds: [speaker.id]
      })
    }

    return {
      talk,
      speaker
    }
  }
}

export type SaveDraftUseCase = ReturnType<typeof createSaveDraftUseCase>
