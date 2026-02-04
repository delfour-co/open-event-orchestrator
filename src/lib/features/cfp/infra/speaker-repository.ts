import type PocketBase from 'pocketbase'
import type { CreateSpeaker, Speaker, UpdateSpeaker } from '../domain'

const COLLECTION = 'speakers'

export const createSpeakerRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Speaker | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToSpeaker(record)
    } catch {
      return null
    }
  },

  async findByEmail(email: string): Promise<Speaker | null> {
    try {
      const record = await pb.collection(COLLECTION).getFirstListItem(`email = "${email}"`)
      return mapRecordToSpeaker(record)
    } catch {
      return null
    }
  },

  async findByUserId(userId: string): Promise<Speaker | null> {
    try {
      const record = await pb.collection(COLLECTION).getFirstListItem(`userId = "${userId}"`)
      return mapRecordToSpeaker(record)
    } catch {
      return null
    }
  },

  async findByIds(ids: string[]): Promise<Speaker[]> {
    if (ids.length === 0) return []
    const filter = ids.map((id) => `id = "${id}"`).join(' || ')
    // Use unique requestKey to prevent auto-cancellation when called in parallel
    const records = await pb
      .collection(COLLECTION)
      .getFullList({ filter, requestKey: `speakers-${ids.join('-')}` })
    return records.map(mapRecordToSpeaker)
  },

  async create(data: CreateSpeaker): Promise<Speaker> {
    const record = await pb.collection(COLLECTION).create(data)
    return mapRecordToSpeaker(record)
  },

  async update(id: string, data: UpdateSpeaker): Promise<Speaker> {
    const record = await pb.collection(COLLECTION).update(id, data)
    return mapRecordToSpeaker(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const mapRecordToSpeaker = (record: Record<string, unknown>): Speaker => ({
  id: record.id as string,
  userId: record.userId as string | undefined,
  email: record.email as string,
  firstName: record.firstName as string,
  lastName: record.lastName as string,
  bio: record.bio as string | undefined,
  company: record.company as string | undefined,
  jobTitle: record.jobTitle as string | undefined,
  photoUrl: record.photoUrl as string | undefined,
  twitter: record.twitter as string | undefined,
  linkedin: record.linkedin as string | undefined,
  github: record.github as string | undefined,
  city: record.city as string | undefined,
  country: record.country as string | undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type SpeakerRepository = ReturnType<typeof createSpeakerRepository>
