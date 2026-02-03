import type PocketBase from 'pocketbase'
import type { CreateReview, Review, UpdateReview } from '../domain'

const COLLECTION = 'reviews'

export const createReviewRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Review | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToReview(record)
    } catch {
      return null
    }
  },

  async findByTalk(talkId: string): Promise<Review[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `talkId = "${talkId}"`,
      sort: '-createdAt'
    })
    return records.map(mapRecordToReview)
  },

  async findByUser(userId: string): Promise<Review[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `userId = "${userId}"`,
      sort: '-createdAt'
    })
    return records.map(mapRecordToReview)
  },

  async findByTalkAndUser(talkId: string, userId: string): Promise<Review | null> {
    try {
      const record = await pb
        .collection(COLLECTION)
        .getFirstListItem(`talkId = "${talkId}" && userId = "${userId}"`)
      return mapRecordToReview(record)
    } catch {
      return null
    }
  },

  async create(data: CreateReview): Promise<Review> {
    const record = await pb.collection(COLLECTION).create(data)
    return mapRecordToReview(record)
  },

  async update(id: string, data: UpdateReview): Promise<Review> {
    const record = await pb.collection(COLLECTION).update(id, data)
    return mapRecordToReview(record)
  },

  async upsert(talkId: string, userId: string, data: UpdateReview): Promise<Review> {
    const existing = await this.findByTalkAndUser(talkId, userId)

    if (existing) {
      return this.update(existing.id, data)
    }

    return this.create({
      talkId,
      userId,
      rating: data.rating ?? 3,
      comment: data.comment
    })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async getAverageRating(talkId: string): Promise<{ average: number | null; count: number }> {
    const reviews = await this.findByTalk(talkId)
    if (reviews.length === 0) {
      return { average: null, count: 0 }
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length
    }
  }
})

const mapRecordToReview = (record: Record<string, unknown>): Review => ({
  id: record.id as string,
  talkId: record.talkId as string,
  userId: record.userId as string,
  rating: record.rating as number,
  comment: record.comment as string | undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ReviewRepository = ReturnType<typeof createReviewRepository>
