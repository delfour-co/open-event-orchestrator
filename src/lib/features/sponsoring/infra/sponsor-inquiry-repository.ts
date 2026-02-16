import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  CreateSponsorInquiry,
  SponsorInquiry,
  SponsorInquiryStatus,
  UpdateSponsorInquiry
} from '../domain'

const COLLECTION = 'sponsor_inquiries'

export const createSponsorInquiryRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<SponsorInquiry | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToInquiry(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string): Promise<SponsorInquiry[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-created'
    })
    return records.map(mapRecordToInquiry)
  },

  async findByStatus(editionId: string, status: SponsorInquiryStatus): Promise<SponsorInquiry[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`editionId = ${editionId}`, safeFilter`status = ${status}`),
      sort: '-created'
    })
    return records.map(mapRecordToInquiry)
  },

  async findAll(): Promise<SponsorInquiry[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      sort: '-created'
    })
    return records.map(mapRecordToInquiry)
  },

  async create(data: CreateSponsorInquiry): Promise<SponsorInquiry> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      message: data.message,
      interestedPackageId: data.interestedPackageId || null,
      status: 'pending'
    })
    return mapRecordToInquiry(record)
  },

  async update(id: string, data: UpdateSponsorInquiry): Promise<SponsorInquiry> {
    const updateData: Record<string, unknown> = {}
    if (data.status !== undefined) updateData.status = data.status
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToInquiry(record)
  },

  async updateStatus(id: string, status: SponsorInquiryStatus): Promise<SponsorInquiry> {
    const record = await pb.collection(COLLECTION).update(id, { status })
    return mapRecordToInquiry(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByEdition(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'id'
    })
    return records.totalItems
  },

  async countByStatus(editionId: string, status: SponsorInquiryStatus): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: filterAnd(safeFilter`editionId = ${editionId}`, safeFilter`status = ${status}`),
      fields: 'id'
    })
    return records.totalItems
  }
})

const mapRecordToInquiry = (record: Record<string, unknown>): SponsorInquiry => ({
  id: record.id as string,
  editionId: record.editionId as string,
  companyName: record.companyName as string,
  contactName: record.contactName as string,
  contactEmail: record.contactEmail as string,
  contactPhone: (record.contactPhone as string) || undefined,
  message: record.message as string,
  interestedPackageId: (record.interestedPackageId as string) || undefined,
  status: (record.status as SponsorInquiryStatus) || 'pending',
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type SponsorInquiryRepository = ReturnType<typeof createSponsorInquiryRepository>
