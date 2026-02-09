import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateSpeaker, Speaker, Talk } from '../domain'
import type { SpeakerRepository, TalkRepository } from '../infra'
import { createSaveDraftUseCase } from './save-draft'

describe('SaveDraftUseCase', () => {
  let talkRepository: TalkRepository
  let speakerRepository: SpeakerRepository
  let saveDraft: ReturnType<typeof createSaveDraftUseCase>

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

    saveDraft = createSaveDraftUseCase(talkRepository, speakerRepository)
  })

  describe('when speaker does not exist', () => {
    it('should create a new speaker and a new talk', async () => {
      vi.mocked(speakerRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(speakerRepository.create).mockResolvedValue(mockSpeaker)
      vi.mocked(talkRepository.create).mockResolvedValue(mockTalk)

      const result = await saveDraft({
        editionId: 'edition-1',
        speaker: mockSpeakerInput,
        talk: {
          title: 'My Talk',
          abstract: 'My abstract',
          language: 'en'
        }
      })

      expect(result.speaker).toEqual(mockSpeaker)
      expect(result.talk).toEqual(mockTalk)
      expect(speakerRepository.create).toHaveBeenCalledWith(mockSpeakerInput)
      expect(talkRepository.create).toHaveBeenCalledWith({
        title: 'My Talk',
        abstract: 'My abstract',
        language: 'en',
        editionId: 'edition-1',
        speakerIds: ['speaker-1']
      })
    })
  })

  describe('when speaker already exists', () => {
    it('should update the speaker and create a new talk', async () => {
      const updatedSpeaker = { ...mockSpeaker, bio: 'Updated bio' }
      vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
      vi.mocked(speakerRepository.update).mockResolvedValue(updatedSpeaker)
      vi.mocked(talkRepository.create).mockResolvedValue(mockTalk)

      const result = await saveDraft({
        editionId: 'edition-1',
        speaker: { ...mockSpeakerInput, bio: 'Updated bio' },
        talk: {
          title: 'My Talk',
          abstract: 'My abstract',
          language: 'en'
        }
      })

      expect(result.speaker).toEqual(updatedSpeaker)
      expect(speakerRepository.update).toHaveBeenCalledWith(
        'speaker-1',
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Speaker',
          bio: 'Updated bio'
        })
      )
    })
  })

  describe('when updating an existing draft', () => {
    it('should update the existing talk instead of creating a new one', async () => {
      const updatedTalk = { ...mockTalk, title: 'Updated Title' }
      vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
      vi.mocked(speakerRepository.update).mockResolvedValue(mockSpeaker)
      vi.mocked(talkRepository.update).mockResolvedValue(updatedTalk)

      const result = await saveDraft({
        editionId: 'edition-1',
        speaker: mockSpeakerInput,
        talk: {
          title: 'Updated Title',
          abstract: 'My abstract',
          language: 'en'
        },
        talkId: 'talk-1'
      })

      expect(result.talk).toEqual(updatedTalk)
      expect(talkRepository.update).toHaveBeenCalledWith('talk-1', {
        title: 'Updated Title',
        abstract: 'My abstract',
        language: 'en',
        speakerIds: ['speaker-1']
      })
      expect(talkRepository.create).not.toHaveBeenCalled()
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

    await saveDraft({
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
