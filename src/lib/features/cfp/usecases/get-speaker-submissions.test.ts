import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Speaker, Talk } from '../domain'
import type { SpeakerRepository, TalkRepository } from '../infra'
import { createGetSpeakerSubmissionsUseCase } from './get-speaker-submissions'

describe('GetSpeakerSubmissionsUseCase', () => {
  let talkRepository: TalkRepository
  let speakerRepository: SpeakerRepository
  let getSpeakerSubmissions: ReturnType<typeof createGetSpeakerSubmissionsUseCase>

  const mockSpeaker: Speaker = {
    id: 'speaker-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Speaker',
    bio: 'A great speaker',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockTalks: Talk[] = [
    {
      id: 'talk-1',
      title: 'Talk 1',
      abstract: 'Abstract 1',
      editionId: 'edition-1',
      speakerIds: ['speaker-1'],
      status: 'submitted',
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'talk-2',
      title: 'Talk 2',
      abstract: 'Abstract 2',
      editionId: 'edition-2',
      speakerIds: ['speaker-1'],
      status: 'accepted',
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

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

    getSpeakerSubmissions = createGetSpeakerSubmissionsUseCase(talkRepository, speakerRepository)
  })

  it('should return null speaker and empty talks when speaker not found', async () => {
    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(null)

    const result = await getSpeakerSubmissions({ email: 'unknown@example.com' })

    expect(result.speaker).toBeNull()
    expect(result.talks).toEqual([])
    expect(speakerRepository.findByEmail).toHaveBeenCalledWith('unknown@example.com')
  })

  it('should return speaker and all their talks when no editionId provided', async () => {
    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findBySpeaker).mockResolvedValue(mockTalks)

    const result = await getSpeakerSubmissions({ email: 'jane@example.com' })

    expect(result.speaker).toEqual(mockSpeaker)
    expect(result.talks).toEqual(mockTalks)
    expect(talkRepository.findBySpeaker).toHaveBeenCalledWith('speaker-1')
    expect(talkRepository.findByFilters).not.toHaveBeenCalled()
  })

  it('should return speaker and filtered talks when editionId provided', async () => {
    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findByFilters).mockResolvedValue([mockTalks[0]])

    const result = await getSpeakerSubmissions({
      email: 'jane@example.com',
      editionId: 'edition-1'
    })

    expect(result.speaker).toEqual(mockSpeaker)
    expect(result.talks).toEqual([mockTalks[0]])
    expect(talkRepository.findByFilters).toHaveBeenCalledWith({
      speakerId: 'speaker-1',
      editionId: 'edition-1'
    })
    expect(talkRepository.findBySpeaker).not.toHaveBeenCalled()
  })

  it('should return empty talks array when speaker has no submissions', async () => {
    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findBySpeaker).mockResolvedValue([])

    const result = await getSpeakerSubmissions({ email: 'jane@example.com' })

    expect(result.speaker).toEqual(mockSpeaker)
    expect(result.talks).toEqual([])
  })

  it('should handle case-sensitive email lookup', async () => {
    vi.mocked(speakerRepository.findByEmail).mockResolvedValue(null)

    await getSpeakerSubmissions({ email: 'JANE@EXAMPLE.COM' })

    expect(speakerRepository.findByEmail).toHaveBeenCalledWith('JANE@EXAMPLE.COM')
  })
})
