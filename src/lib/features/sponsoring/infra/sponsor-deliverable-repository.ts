import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  Benefit,
  CreateDeliverable,
  DeliverableStatus,
  EditionSponsorExpanded,
  Sponsor,
  SponsorDeliverable,
  SponsorDeliverableExpanded,
  SponsorPackage,
  UpdateDeliverable
} from '../domain'

const COLLECTION = 'sponsor_deliverables'

export const createSponsorDeliverableRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<SponsorDeliverable | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToDeliverable(record)
    } catch {
      return null
    }
  },

  async findByIdWithExpand(id: string): Promise<SponsorDeliverableExpanded | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id, {
        expand: 'editionSponsorId,editionSponsorId.sponsorId,editionSponsorId.packageId'
      })
      return mapRecordToDeliverableExpanded(record)
    } catch {
      return null
    }
  },

  async findByEditionSponsor(editionSponsorId: string): Promise<SponsorDeliverable[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId}`,
      sort: 'dueDate,created'
    })
    return records.map(mapRecordToDeliverable)
  },

  async findByEditionSponsorWithExpand(
    editionSponsorId: string
  ): Promise<SponsorDeliverableExpanded[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId}`,
      sort: 'dueDate,created',
      expand: 'editionSponsorId,editionSponsorId.sponsorId,editionSponsorId.packageId'
    })
    return records.map(mapRecordToDeliverableExpanded)
  },

  async findByEdition(editionId: string): Promise<SponsorDeliverableExpanded[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId.editionId = ${editionId}`,
      sort: 'dueDate,created',
      expand: 'editionSponsorId,editionSponsorId.sponsorId,editionSponsorId.packageId'
    })
    return records.map(mapRecordToDeliverableExpanded)
  },

  async findByStatus(
    editionSponsorId: string,
    status: DeliverableStatus
  ): Promise<SponsorDeliverable[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(
        safeFilter`editionSponsorId = ${editionSponsorId}`,
        safeFilter`status = ${status}`
      ),
      sort: 'dueDate,created'
    })
    return records.map(mapRecordToDeliverable)
  },

  async findPendingByEdition(editionId: string): Promise<SponsorDeliverableExpanded[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(
        safeFilter`editionSponsorId.editionId = ${editionId}`,
        'status != "delivered"'
      ),
      sort: 'dueDate,created',
      expand: 'editionSponsorId,editionSponsorId.sponsorId,editionSponsorId.packageId'
    })
    return records.map(mapRecordToDeliverableExpanded)
  },

  async findOverdue(editionId: string): Promise<SponsorDeliverableExpanded[]> {
    const now = new Date().toISOString()
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(
        safeFilter`editionSponsorId.editionId = ${editionId}`,
        'status != "delivered"',
        `dueDate < "${now}"`
      ),
      sort: 'dueDate,created',
      expand: 'editionSponsorId,editionSponsorId.sponsorId,editionSponsorId.packageId'
    })
    return records.map(mapRecordToDeliverableExpanded)
  },

  async create(data: CreateDeliverable): Promise<SponsorDeliverable> {
    const record = await pb.collection(COLLECTION).create({
      editionSponsorId: data.editionSponsorId,
      benefitName: data.benefitName,
      description: data.description || null,
      status: data.status || 'pending',
      dueDate: data.dueDate?.toISOString() || null,
      deliveredAt: data.deliveredAt?.toISOString() || null,
      notes: data.notes || null
    })
    return mapRecordToDeliverable(record)
  },

  async createMany(data: CreateDeliverable[]): Promise<SponsorDeliverable[]> {
    const results: SponsorDeliverable[] = []
    for (const item of data) {
      const created = await this.create(item)
      results.push(created)
    }
    return results
  },

  async update(id: string, data: UpdateDeliverable): Promise<SponsorDeliverable> {
    const updateData = buildUpdateData(data)
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToDeliverable(record)
  },

  async updateStatus(id: string, status: DeliverableStatus): Promise<SponsorDeliverable> {
    const updateData: Record<string, unknown> = { status }
    if (status === 'delivered') {
      updateData.deliveredAt = new Date().toISOString()
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToDeliverable(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async deleteByEditionSponsor(editionSponsorId: string): Promise<void> {
    const deliverables = await this.findByEditionSponsor(editionSponsorId)
    for (const d of deliverables) {
      await pb.collection(COLLECTION).delete(d.id)
    }
  },

  async countByEditionSponsor(
    editionSponsorId: string
  ): Promise<Record<DeliverableStatus, number>> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId}`,
      fields: 'id,status'
    })

    const counts: Record<DeliverableStatus, number> = {
      pending: 0,
      in_progress: 0,
      delivered: 0
    }

    for (const record of records) {
      const status = (record.status as DeliverableStatus) || 'pending'
      counts[status]++
    }

    return counts
  }
})

const buildUpdateData = (data: UpdateDeliverable): Record<string, unknown> => {
  const updateData: Record<string, unknown> = {}
  const fields: Array<keyof UpdateDeliverable> = [
    'benefitName',
    'description',
    'status',
    'dueDate',
    'deliveredAt',
    'notes'
  ]
  for (const field of fields) {
    if (data[field] !== undefined) {
      const value = data[field]
      if (value instanceof Date) {
        updateData[field] = value.toISOString()
      } else {
        updateData[field] = value || null
      }
    }
  }
  return updateData
}

const mapRecordToDeliverable = (record: Record<string, unknown>): SponsorDeliverable => ({
  id: record.id as string,
  editionSponsorId: record.editionSponsorId as string,
  benefitName: record.benefitName as string,
  description: (record.description as string) || undefined,
  status: ((record.status as string) || 'pending') as DeliverableStatus,
  dueDate: record.dueDate ? new Date(record.dueDate as string) : undefined,
  deliveredAt: record.deliveredAt ? new Date(record.deliveredAt as string) : undefined,
  notes: (record.notes as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

const mapSponsorRecord = (sponsorRecord: Record<string, unknown>): Sponsor => ({
  id: sponsorRecord.id as string,
  organizationId: sponsorRecord.organizationId as string,
  name: sponsorRecord.name as string,
  logo: (sponsorRecord.logo as string) || undefined,
  website: (sponsorRecord.website as string) || undefined,
  description: (sponsorRecord.description as string) || undefined,
  contactName: (sponsorRecord.contactName as string) || undefined,
  contactEmail: (sponsorRecord.contactEmail as string) || undefined,
  contactPhone: (sponsorRecord.contactPhone as string) || undefined,
  notes: (sponsorRecord.notes as string) || undefined,
  createdAt: new Date(sponsorRecord.created as string),
  updatedAt: new Date(sponsorRecord.updated as string)
})

const parseBenefits = (pkgRecord: Record<string, unknown>): Benefit[] => {
  if (!pkgRecord.benefits) return []
  if (typeof pkgRecord.benefits === 'string') {
    try {
      return JSON.parse(pkgRecord.benefits)
    } catch {
      return []
    }
  }
  if (Array.isArray(pkgRecord.benefits)) {
    return pkgRecord.benefits as Benefit[]
  }
  return []
}

const mapPackageRecord = (pkgRecord: Record<string, unknown>): SponsorPackage => ({
  id: pkgRecord.id as string,
  editionId: pkgRecord.editionId as string,
  name: pkgRecord.name as string,
  tier: (pkgRecord.tier as number) || 1,
  price: (pkgRecord.price as number) || 0,
  currency: ((pkgRecord.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
  maxSponsors: (pkgRecord.maxSponsors as number) || undefined,
  benefits: parseBenefits(pkgRecord),
  description: (pkgRecord.description as string) || undefined,
  isActive: (pkgRecord.isActive as boolean) ?? true,
  createdAt: new Date(pkgRecord.created as string),
  updatedAt: new Date(pkgRecord.updated as string)
})

type EditionSponsorStatus =
  | 'prospect'
  | 'contacted'
  | 'negotiating'
  | 'confirmed'
  | 'declined'
  | 'cancelled'

const mapEditionSponsorRecord = (
  esRecord: Record<string, unknown>,
  sponsor: Sponsor | undefined,
  pkg: SponsorPackage | undefined
): EditionSponsorExpanded => ({
  id: esRecord.id as string,
  editionId: esRecord.editionId as string,
  sponsorId: esRecord.sponsorId as string,
  packageId: (esRecord.packageId as string) || undefined,
  status: ((esRecord.status as string) || 'prospect') as EditionSponsorStatus,
  confirmedAt: esRecord.confirmedAt ? new Date(esRecord.confirmedAt as string) : undefined,
  paidAt: esRecord.paidAt ? new Date(esRecord.paidAt as string) : undefined,
  amount: (esRecord.amount as number) || undefined,
  notes: (esRecord.notes as string) || undefined,
  createdAt: new Date(esRecord.created as string),
  updatedAt: new Date(esRecord.updated as string),
  sponsor,
  package: pkg
})

const mapRecordToDeliverableExpanded = (
  record: Record<string, unknown>
): SponsorDeliverableExpanded => {
  const base = mapRecordToDeliverable(record)
  const expand = record.expand as Record<string, unknown> | undefined
  if (!expand?.editionSponsorId) {
    return { ...base, editionSponsor: undefined }
  }

  const esRecord = expand.editionSponsorId as Record<string, unknown>
  const esExpand = esRecord.expand as Record<string, unknown> | undefined

  const sponsor = esExpand?.sponsorId
    ? mapSponsorRecord(esExpand.sponsorId as Record<string, unknown>)
    : undefined

  const pkg = esExpand?.packageId
    ? mapPackageRecord(esExpand.packageId as Record<string, unknown>)
    : undefined

  const editionSponsor = mapEditionSponsorRecord(esRecord, sponsor, pkg)

  return { ...base, editionSponsor }
}

export type SponsorDeliverableRepository = ReturnType<typeof createSponsorDeliverableRepository>
