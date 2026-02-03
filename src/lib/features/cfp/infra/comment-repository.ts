import type PocketBase from 'pocketbase'
import type { Comment, CreateComment } from '../domain'

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
    let filter = `talkId = "${talkId}"`
    if (internalOnly) {
      filter += ' && isInternal = true'
    }

    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: 'created'
    })
    return records.map(mapRecordToComment)
  },

  async findByUser(userId: string): Promise<Comment[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `userId = "${userId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToComment)
  },

  async create(data: CreateComment): Promise<Comment> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      isInternal: data.isInternal ?? true
    })
    return mapRecordToComment(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByTalk(talkId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `talkId = "${talkId}"`,
      fields: 'id'
    })
    return records.length
  }
})

const mapRecordToComment = (record: Record<string, unknown>): Comment => ({
  id: record.id as string,
  talkId: record.talkId as string,
  userId: record.userId as string,
  content: record.content as string,
  isInternal: record.isInternal as boolean,
  createdAt: new Date(record.created as string)
})

export type CommentRepository = ReturnType<typeof createCommentRepository>
