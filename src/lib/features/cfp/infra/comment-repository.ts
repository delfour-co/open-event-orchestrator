import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { Comment, CommentVisibility, CreateComment } from '../domain'

const COLLECTION = 'comments'

export const createCommentRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Comment | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToComment(record)
    } catch {
      return null
    }
  },

  async findByTalk(talkId: string, internalOnly = true): Promise<Comment[]> {
    const talkFilter = safeFilter`talkId = ${talkId}`
    const filter = internalOnly ? filterAnd(talkFilter, 'isInternal = true') : talkFilter

    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: 'created'
    })
    return records.map(mapRecordToComment)
  },

  async findByTalkAndVisibility(talkId: string, visibility: CommentVisibility): Promise<Comment[]> {
    const filter = safeFilter`talkId = ${talkId} && visibility = ${visibility}`
    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: 'created'
    })
    return records.map(mapRecordToComment)
  },

  async findPublicByTalk(talkId: string): Promise<Comment[]> {
    const filter = safeFilter`talkId = ${talkId} && visibility = ${'public'}`
    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: 'created'
    })
    return records.map(mapRecordToComment)
  },

  async findByUser(userId: string): Promise<Comment[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`userId = ${userId}`,
      sort: '-created'
    })
    return records.map(mapRecordToComment)
  },

  async create(data: CreateComment): Promise<Comment> {
    const visibility = data.visibility || (data.isInternal ? 'internal' : 'public')
    const record = await pb.collection(COLLECTION).create({
      ...data,
      isInternal: data.isInternal ?? true,
      visibility
    })
    return mapRecordToComment(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByTalk(talkId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`talkId = ${talkId}`,
      fields: 'id'
    })
    return records.length
  },

  async countPublicByTalk(talkId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`talkId = ${talkId} && visibility = ${'public'}`,
      fields: 'id'
    })
    return records.length
  }
})

const mapRecordToComment = (record: Record<string, unknown>): Comment => {
  const visibility = (record.visibility as string) || 'internal'
  const isInternal = record.isInternal as boolean
  return {
    id: record.id as string,
    talkId: record.talkId as string,
    userId: record.userId as string,
    content: record.content as string,
    isInternal: visibility === 'public' ? false : isInternal,
    visibility: visibility as 'internal' | 'public',
    authorName: (record.authorName as string) || undefined,
    createdAt: new Date(record.created as string)
  }
}

export type CommentRepository = ReturnType<typeof createCommentRepository>
