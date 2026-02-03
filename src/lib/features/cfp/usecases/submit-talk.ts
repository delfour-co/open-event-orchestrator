import type { CreateSpeaker, CreateTalk, Speaker, Talk } from '../domain'
import type { SpeakerRepository, TalkRepository } from '../infra'

export interface SubmitTalkInput {
  editionId: string
  speaker: CreateSpeaker
  talk: Omit<CreateTalk, 'editionId' | 'speakerIds'>
}

export interface SubmitTalkResult {
  talk: Talk
  speaker: Speaker
}

export const createSubmitTalkUseCase = (
  talkRepository: TalkRepository,
  speakerRepository: SpeakerRepository
) => {
  return async (input: SubmitTalkInput): Promise<SubmitTalkResult> => {
    // Get or create speaker by email
    let speaker = await speakerRepository.findByEmail(input.speaker.email)

    if (!speaker) {
      speaker = await speakerRepository.create(input.speaker)
    } else {
      // Update speaker info if already exists
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

    // Create talk with speaker
    const talk = await talkRepository.create({
      ...input.talk,
      editionId: input.editionId,
      speakerIds: [speaker.id]
    })

    // Submit the talk
    const submittedTalk = await talkRepository.updateStatus(talk.id, 'submitted')

    return {
      talk: submittedTalk,
      speaker
    }
  }
}

export type SubmitTalkUseCase = ReturnType<typeof createSubmitTalkUseCase>
