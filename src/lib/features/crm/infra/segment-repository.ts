import type PocketBase from 'pocketbase'
import type { CreateSegment, Segment, SegmentCriteria } from '../domain'

const COLLECTION = 'segments'

export const createSegmentRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Segment | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToSegment(record)
    } catch {
      return null
    }
  },

  async findByEvent(eventId: string): Promise<Segment[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `eventId = "${eventId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToSegment)
  },

  async create(data: CreateSegment): Promise<Segment> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      criteria: JSON.stringify(data.criteria),
      contactCount: 0
    })
    return mapRecordToSegment(record)
  },

  async update(id: string, data: Partial<CreateSegment>): Promise<Segment> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.criteria !== undefined) {
      updateData.criteria = JSON.stringify(data.criteria)
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToSegment(record)
  },

  async updateContactCount(id: string, count: number): Promise<void> {
    await pb.collection(COLLECTION).update(id, { contactCount: count })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const parseCriteria = (value: unknown): SegmentCriteria => {
  if (typeof value === 'object' && value !== null) return value as SegmentCriteria
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as SegmentCriteria
    } catch {
      return { match: 'all', rules: [] }
    }
  }
  return { match: 'all', rules: [] }
}

const mapRecordToSegment = (record: Record<string, unknown>): Segment => ({
  id: record.id as string,
  eventId: record.eventId as string,
  editionId: record.editionId as string | undefined,
  name: record.name as string,
  description: record.description as string | undefined,
  criteria: parseCriteria(record.criteria),
  isStatic: (record.isStatic as boolean) || false,
  contactCount: (record.contactCount as number) || 0,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type SegmentRepository = ReturnType<typeof createSegmentRepository>
