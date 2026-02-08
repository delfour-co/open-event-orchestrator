import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateSession, Session, SessionType, UpdateSession } from '../domain'

export interface SessionRepository {
  findById(id: string): Promise<Session | null>
  findByEdition(editionId: string): Promise<Session[]>
  findBySlot(slotId: string): Promise<Session | null>
  findByTalk(talkId: string): Promise<Session | null>
  findByTrack(trackId: string): Promise<Session[]>
  create(data: CreateSession): Promise<Session>
  update(data: UpdateSession): Promise<Session>
  delete(id: string): Promise<void>
  isSlotOccupied(slotId: string, excludeSessionId?: string): Promise<boolean>
}

function mapRecordToSession(record: Record<string, unknown>): Session {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    slotId: record.slotId as string,
    talkId: record.talkId as string | undefined,
    trackId: record.trackId as string | undefined,
    title: record.title as string,
    description: record.description as string | undefined,
    type: (record.type as SessionType) || 'talk',
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createSessionRepository(pb: PocketBase): SessionRepository {
  return {
    async findById(id: string): Promise<Session | null> {
      try {
        const record = await pb.collection('sessions').getOne(id)
        return mapRecordToSession(record)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<Session[]> {
      const records = await pb.collection('sessions').getFullList({
        filter: safeFilter`editionId = ${editionId}`
      })
      return records.map(mapRecordToSession)
    },

    async findBySlot(slotId: string): Promise<Session | null> {
      try {
        const record = await pb
          .collection('sessions')
          .getFirstListItem(safeFilter`slotId = ${slotId}`)
        return mapRecordToSession(record)
      } catch {
        return null
      }
    },

    async findByTalk(talkId: string): Promise<Session | null> {
      try {
        const record = await pb
          .collection('sessions')
          .getFirstListItem(safeFilter`talkId = ${talkId}`)
        return mapRecordToSession(record)
      } catch {
        return null
      }
    },

    async findByTrack(trackId: string): Promise<Session[]> {
      const records = await pb.collection('sessions').getFullList({
        filter: safeFilter`trackId = ${trackId}`
      })
      return records.map(mapRecordToSession)
    },

    async create(data: CreateSession): Promise<Session> {
      const record = await pb.collection('sessions').create({
        editionId: data.editionId,
        slotId: data.slotId,
        talkId: data.talkId || null,
        trackId: data.trackId || null,
        title: data.title,
        description: data.description || null,
        type: data.type || 'talk'
      })
      return mapRecordToSession(record)
    },

    async update(data: UpdateSession): Promise<Session> {
      const updateData: Record<string, unknown> = {}
      if (data.slotId !== undefined) updateData.slotId = data.slotId
      if (data.talkId !== undefined) updateData.talkId = data.talkId || null
      if (data.trackId !== undefined) updateData.trackId = data.trackId || null
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description || null
      if (data.type !== undefined) updateData.type = data.type

      const record = await pb.collection('sessions').update(data.id, updateData)
      return mapRecordToSession(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('sessions').delete(id)
    },

    async isSlotOccupied(slotId: string, excludeSessionId?: string): Promise<boolean> {
      try {
        const filter = excludeSessionId
          ? filterAnd(safeFilter`slotId = ${slotId}`, safeFilter`id != ${excludeSessionId}`)
          : safeFilter`slotId = ${slotId}`
        const records = await pb.collection('sessions').getList(1, 1, { filter })
        return records.items.length > 0
      } catch {
        return false
      }
    }
  }
}
