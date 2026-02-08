import { filterAnd, filterContains, filterIn, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateTalk, Talk, TalkStatus, UpdateTalk } from '../domain'

const COLLECTION = 'talks'

export interface TalkFilters {
  editionId?: string
  speakerId?: string
  status?: TalkStatus | TalkStatus[]
  categoryId?: string
  formatId?: string
}

export interface TalkListOptions {
  page?: number
  perPage?: number
  sort?: string
}

export const createTalkRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Talk | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToTalk(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string, options?: TalkListOptions): Promise<Talk[]> {
    const records = await pb
      .collection(COLLECTION)
      .getList(options?.page ?? 1, options?.perPage ?? 50, {
        filter: safeFilter`editionId = ${editionId}`,
        sort: options?.sort ?? '-created'
      })
    return records.items.map(mapRecordToTalk)
  },

  async findBySpeaker(speakerId: string): Promise<Talk[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterContains('speakerIds', speakerId),
      sort: '-created'
    })
    return records.map(mapRecordToTalk)
  },

  async findByFilters(filters: TalkFilters, options?: TalkListOptions): Promise<Talk[]> {
    const conditions: (string | null)[] = []

    if (filters.editionId) {
      conditions.push(safeFilter`editionId = ${filters.editionId}`)
    }
    if (filters.speakerId) {
      conditions.push(filterContains('speakerIds', filters.speakerId))
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(filterIn('status', filters.status))
      } else {
        conditions.push(safeFilter`status = ${filters.status}`)
      }
    }
    if (filters.categoryId) {
      conditions.push(safeFilter`categoryId = ${filters.categoryId}`)
    }
    if (filters.formatId) {
      conditions.push(safeFilter`formatId = ${filters.formatId}`)
    }

    const filter = filterAnd(...conditions)

    const records = await pb
      .collection(COLLECTION)
      .getList(options?.page ?? 1, options?.perPage ?? 50, {
        filter,
        sort: options?.sort ?? '-created'
      })
    return records.items.map(mapRecordToTalk)
  },

  async countByEdition(editionId: string): Promise<Record<TalkStatus, number>> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'status'
    })

    const counts: Record<TalkStatus, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      accepted: 0,
      rejected: 0,
      confirmed: 0,
      declined: 0,
      withdrawn: 0
    }

    for (const record of records) {
      const status = record.status as TalkStatus
      counts[status]++
    }

    return counts
  },

  async create(data: CreateTalk): Promise<Talk> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      status: 'draft'
    })
    return mapRecordToTalk(record)
  },

  async update(id: string, data: UpdateTalk): Promise<Talk> {
    const record = await pb.collection(COLLECTION).update(id, data)
    return mapRecordToTalk(record)
  },

  async updateStatus(id: string, status: TalkStatus): Promise<Talk> {
    const updateData: Record<string, unknown> = { status }

    if (status === 'submitted') {
      updateData.submittedAt = new Date().toISOString()
    }

    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToTalk(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const mapRecordToTalk = (record: Record<string, unknown>): Talk => ({
  id: record.id as string,
  editionId: record.editionId as string,
  title: record.title as string,
  abstract: record.abstract as string,
  description: record.description as string | undefined,
  categoryId: record.categoryId as string | undefined,
  formatId: record.formatId as string | undefined,
  language: record.language as 'fr' | 'en',
  level: record.level as 'beginner' | 'intermediate' | 'advanced' | undefined,
  speakerIds: record.speakerIds as string[],
  status: record.status as TalkStatus,
  submittedAt: record.submittedAt ? new Date(record.submittedAt as string) : undefined,
  notes: record.notes as string | undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type TalkRepository = ReturnType<typeof createTalkRepository>
