import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateSpeaker, Speaker, Talk } from '../domain'
import type { SpeakerRepository, TalkRepository } from '../infra'
import { createSubmitTalkUseCase } from './submit-talk'

describe('SubmitTalkUseCase', () => {
  let talkRepository: TalkRepository
  let speakerRepository: SpeakerRepository
  let submitTalk: ReturnType<typeof createSubmitTalkUseCase>

  const mockSpeakerInput: CreateSpeaker = {
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Speaker',
    bio: 'A great speaker'
  }

  const mockSpeaker: Speaker = {
    id: 'speaker-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Speaker',
    bio: 'A great speaker',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockTalk: Talk = {
    id: 'talk-1',
    title: 'My Talk',
    abstract: 'My abstract',
    editionId: 'edition-1',
    speakerIds: ['speaker-1'],
    status: 'draft',
    language: 'en',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockSubmittedTalk: Talk = {
    ...mockTalk,
    status: 'submitted',
    submittedAt: new Date()
  }

  beforeEach(() => {
    talkRepository = {
      findById: vi.fn(),
      findByFilters: vi.fn(),
      findBySpeaker: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      findByEdition: vi.fn(),
      addCoSpeaker: vi.fn(),
      removeCoSpeaker: vi.fn()
    } as unknown as TalkRepository

    speakerRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    } as unknown as SpeakerRepository

    submitTalk = createSubmitTalkUseCase(talkRepository, speakerRepository)
  })

  describe('when speaker does not exist', () => {
    it('should create a new speaker, create talk, and submit it', async () => {
      vi.mocked(speakerRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(speakerRepository.create).mockResolvedValue(mockSpeaker)
      vi.mocked(talkRepository.create).mockResolvedValue(mockTalk)
      vi.mocked(talkRepository.updateStatus).mockResolvedValue(mockSubmittedTalk)

      const result = await submitTalk({
        editionId: 'edition-1',
        speaker: mockSpeakerInput,
        talk: {
          title: 'My Talk',
          abstract: 'My abstract',
          language: 'en'
        }
      })

      expect(result.speaker).toEqual(mockSpeaker)
      expect(result.talk).toEqual(mockSubmittedTalk)
      expect(speakerRepository.create).toHaveBeenCalledWith(mockSpeakerInput)
      expect(talkRepository.create).toHaveBeenCalledWith({
        title: 'My Talk',
        abstract: 'My abstract',
        language: 'en',
        editionId: 'edition-1',
        speakerIds: ['speaker-1']
      })
      expect(talkRepository.updateStatus).toHaveBeenCalledWith('talk-1', 'submitted')
    })
  })

  describe('when speaker already exists', () => {
    it('should update the speaker, create talk, and submit it', async () => {
      const updatedSpeaker = { ...mockSpeaker, bio: 'Updated bio' }
      vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
      vi.mocked(speakerRepository.update).mockResolvedValue(updatedSpeaker)
      vi.mocked(talkRepository.create).mockResolvedValue(mockTalk)
      vi.mocked(talkRepository.updateStatus).mockResolvedValue(mockSubmittedTalk)

      const result = await submitTalk({
        editionId: 'edition-1',
        speaker: { ...mockSpeakerInput, bio: 'Updated bio' },
        talk: {
          title: 'My Talk',
          abstract: 'My abstract',
          language: 'en'
        }
      })

      expect(result.speaker).toEqual(updatedSpeaker)
      expect(result.talk.status).toBe('submitted')
      expect(speakerRepository.update).toHaveBeenCalledWith(
        'speaker-1',
        expect.objectContaining({
          bio: 'Updated bio'
        })
      )
      expect(speakerRepository.create).not.toHaveBeenCalled()
    })
  })

  it('should set talk status to submitted after creation', async () => {
    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
    vi.mocked(speakerRepository.update).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.create).mockResolvedValue(mockTalk)
    vi.mocked(talkRepository.updateStatus).mockResolvedValue(mockSubmittedTalk)

    const result = await submitTalk({
      editionId: 'edition-1',
      speaker: mockSpeakerInput,
      talk: { title: 'Talk', abstract: 'Abstract', language: 'en' }
    })

    expect(result.talk.status).toBe('submitted')
    expect(talkRepository.updateStatus).toHaveBeenCalledWith('talk-1', 'submitted')
  })

  it('should pass all talk fields to create', async () => {
    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
    vi.mocked(speakerRepository.update).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.create).mockResolvedValue(mockTalk)
    vi.mocked(talkRepository.updateStatus).mockResolvedValue(mockSubmittedTalk)

    await submitTalk({
      editionId: 'edition-1',
      speaker: mockSpeakerInput,
      talk: {
        title: 'My Talk',
        abstract: 'My abstract',
        categoryId: 'cat-1',
        formatId: 'fmt-1',
        level: 'intermediate',
        language: 'en',
        notes: 'Speaker notes'
      }
    })

    expect(talkRepository.create).toHaveBeenCalledWith({
      title: 'My Talk',
      abstract: 'My abstract',
      categoryId: 'cat-1',
      formatId: 'fmt-1',
      level: 'intermediate',
      language: 'en',
      notes: 'Speaker notes',
      editionId: 'edition-1',
      speakerIds: ['speaker-1']
    })
  })

  it('should pass all speaker fields to update', async () => {
    const fullSpeakerInput: CreateSpeaker = {
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Speaker',
      bio: 'Bio',
      company: 'TechCorp',
      jobTitle: 'Developer',
      photoUrl: 'https://example.com/photo.jpg',
      twitter: '@jane',
      linkedin: 'jane-speaker',
      github: 'janespeaker',
      city: 'Paris',
      country: 'France'
    }

    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
    vi.mocked(speakerRepository.update).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.create).mockResolvedValue(mockTalk)
    vi.mocked(talkRepository.updateStatus).mockResolvedValue(mockSubmittedTalk)

    await submitTalk({
      editionId: 'edition-1',
      speaker: fullSpeakerInput,
      talk: { title: 'Talk', abstract: 'Abstract', language: 'en' }
    })

    expect(speakerRepository.update).toHaveBeenCalledWith('speaker-1', {
      firstName: 'Jane',
      lastName: 'Speaker',
      bio: 'Bio',
      company: 'TechCorp',
      jobTitle: 'Developer',
      photoUrl: 'https://example.com/photo.jpg',
      twitter: '@jane',
      linkedin: 'jane-speaker',
      github: 'janespeaker',
      city: 'Paris',
      country: 'France'
    })
  })
})
