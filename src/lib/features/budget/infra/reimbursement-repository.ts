import type PocketBase from 'pocketbase'
import type { ReimbursementRequest } from '../domain/reimbursement'

const COLLECTION = 'reimbursement_requests'

export const createReimbursementRepository = (pb: PocketBase) => ({
  async findByEdition(editionId: string): Promise<ReimbursementRequest[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToRequest)
  },

  async findBySpeaker(speakerId: string, editionId: string): Promise<ReimbursementRequest[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `speakerId = "${speakerId}" && editionId = "${editionId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToRequest)
  },

  async findById(id: string): Promise<ReimbursementRequest | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToRequest(record)
    } catch {
      return null
    }
  },

  async create(data: {
    editionId: string
    speakerId: string
    requestNumber: string
    status?: string
    totalAmount?: number
    currency?: string
    notes?: string
  }): Promise<ReimbursementRequest> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      speakerId: data.speakerId,
      requestNumber: data.requestNumber,
      status: data.status || 'draft',
      totalAmount: data.totalAmount || 0,
      currency: data.currency || 'EUR',
      notes: data.notes || null
    })
    return mapRecordToRequest(record)
  },

  async updateStatus(
    id: string,
    status: string,
    extra?: {
      adminNotes?: string
      reviewedBy?: string
      reviewedAt?: Date
      transactionId?: string
      submittedAt?: Date
      totalAmount?: number
    }
  ): Promise<ReimbursementRequest> {
    const updateData: Record<string, unknown> = { status }
    if (extra?.adminNotes !== undefined) updateData.adminNotes = extra.adminNotes || null
    if (extra?.reviewedBy) updateData.reviewedBy = extra.reviewedBy
    if (extra?.reviewedAt) updateData.reviewedAt = extra.reviewedAt.toISOString()
    if (extra?.transactionId) updateData.transactionId = extra.transactionId
    if (extra?.submittedAt) updateData.submittedAt = extra.submittedAt.toISOString()
    if (extra?.totalAmount !== undefined) updateData.totalAmount = extra.totalAmount
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToRequest(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async getNextSequence(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `editionId = "${editionId}"`,
      sort: '-created',
      fields: 'id'
    })
    return records.totalItems + 1
  }
})

const mapRecordToRequest = (record: Record<string, unknown>): ReimbursementRequest => ({
  id: record.id as string,
  editionId: record.editionId as string,
  speakerId: record.speakerId as string,
  requestNumber: (record.requestNumber as string) || '',
  status: ((record.status as string) || 'draft') as
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'paid',
  totalAmount: (record.totalAmount as number) || 0,
  currency: ((record.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
  notes: (record.notes as string) || undefined,
  adminNotes: (record.adminNotes as string) || undefined,
  reviewedBy: (record.reviewedBy as string) || undefined,
  reviewedAt: record.reviewedAt ? new Date(record.reviewedAt as string) : undefined,
  transactionId: (record.transactionId as string) || undefined,
  submittedAt: record.submittedAt ? new Date(record.submittedAt as string) : undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ReimbursementRepository = ReturnType<typeof createReimbursementRepository>
