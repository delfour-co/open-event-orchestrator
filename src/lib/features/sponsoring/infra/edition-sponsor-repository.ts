import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  Benefit,
  CreateEditionSponsor,
  EditionSponsor,
  EditionSponsorExpanded,
  Sponsor,
  SponsorPackage,
  SponsorStats,
  SponsorStatus,
  UpdateEditionSponsor
} from '../domain'

const COLLECTION = 'edition_sponsors'

export const createEditionSponsorRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<EditionSponsor | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToEditionSponsor(record)
    } catch {
      return null
    }
  },

  async findByIdWithExpand(id: string): Promise<EditionSponsorExpanded | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id, {
        expand: 'sponsorId,packageId'
      })
      return mapRecordToEditionSponsorExpanded(record, pb)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string): Promise<EditionSponsor[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-created'
    })
    return records.map(mapRecordToEditionSponsor)
  },

  async findByEditionWithExpand(editionId: string): Promise<EditionSponsorExpanded[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-created',
      expand: 'sponsorId,packageId',
      requestKey: null // Disable auto-cancellation for parallel requests
    })
    return records.map((r) => mapRecordToEditionSponsorExpanded(r, pb))
  },

  async findBySponsor(sponsorId: string): Promise<EditionSponsor[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`sponsorId = ${sponsorId}`,
      sort: '-created'
    })
    return records.map(mapRecordToEditionSponsor)
  },

  async findByStatus(editionId: string, status: SponsorStatus): Promise<EditionSponsor[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`editionId = ${editionId}`, safeFilter`status = ${status}`),
      sort: '-created'
    })
    return records.map(mapRecordToEditionSponsor)
  },

  async findConfirmed(editionId: string): Promise<EditionSponsorExpanded[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`editionId = ${editionId}`, 'status = "confirmed"'),
      sort: '-created',
      expand: 'sponsorId,packageId'
    })
    return records.map((r) => mapRecordToEditionSponsorExpanded(r, pb))
  },

  async findByEditionAndSponsor(
    editionId: string,
    sponsorId: string
  ): Promise<EditionSponsor | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: filterAnd(
          safeFilter`editionId = ${editionId}`,
          safeFilter`sponsorId = ${sponsorId}`
        )
      })
      if (records.items.length === 0) return null
      return mapRecordToEditionSponsor(records.items[0])
    } catch {
      return null
    }
  },

  async create(data: CreateEditionSponsor): Promise<EditionSponsor> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      sponsorId: data.sponsorId,
      packageId: data.packageId || null,
      status: data.status || 'prospect',
      confirmedAt: data.confirmedAt?.toISOString() || null,
      paidAt: data.paidAt?.toISOString() || null,
      amount: data.amount ?? null,
      invoiceNumber: data.invoiceNumber || null,
      stripePaymentIntentId: data.stripePaymentIntentId || null,
      paymentProvider: data.paymentProvider || null,
      poNumber: data.poNumber || null,
      notes: data.notes || null
    })
    return mapRecordToEditionSponsor(record)
  },

  async update(id: string, data: UpdateEditionSponsor): Promise<EditionSponsor> {
    const updateData: Record<string, unknown> = {}
    if (data.packageId !== undefined) updateData.packageId = data.packageId || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.confirmedAt !== undefined)
      updateData.confirmedAt = data.confirmedAt?.toISOString() || null
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt?.toISOString() || null
    if (data.amount !== undefined) updateData.amount = data.amount ?? null
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber || null
    if (data.stripePaymentIntentId !== undefined)
      updateData.stripePaymentIntentId = data.stripePaymentIntentId || null
    if (data.paymentProvider !== undefined)
      updateData.paymentProvider = data.paymentProvider || null
    if (data.poNumber !== undefined) updateData.poNumber = data.poNumber || null
    if (data.notes !== undefined) updateData.notes = data.notes || null
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToEditionSponsor(record)
  },

  async updateStatus(id: string, status: SponsorStatus): Promise<EditionSponsor> {
    const updateData: Record<string, unknown> = { status }
    if (status === 'confirmed') {
      updateData.confirmedAt = new Date().toISOString()
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToEditionSponsor(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async getStats(editionId: string): Promise<SponsorStats> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'id,status,amount,paidAt',
      requestKey: null // Disable auto-cancellation for parallel requests
    })

    const stats: SponsorStats = {
      total: records.length,
      byStatus: {
        prospect: 0,
        contacted: 0,
        negotiating: 0,
        confirmed: 0,
        declined: 0,
        cancelled: 0,
        refunded: 0
      },
      confirmed: 0,
      totalAmount: 0,
      paidAmount: 0
    }

    for (const record of records) {
      const status = (record.status as SponsorStatus) || 'prospect'
      stats.byStatus[status]++

      if (status === 'confirmed') {
        stats.confirmed++
        const amount = (record.amount as number) || 0
        stats.totalAmount += amount
        if (record.paidAt) {
          stats.paidAmount += amount
        }
      }
    }

    return stats
  }
})

const mapRecordToEditionSponsor = (record: Record<string, unknown>): EditionSponsor => ({
  id: record.id as string,
  editionId: record.editionId as string,
  sponsorId: record.sponsorId as string,
  packageId: (record.packageId as string) || undefined,
  status: ((record.status as string) || 'prospect') as SponsorStatus,
  confirmedAt: record.confirmedAt ? new Date(record.confirmedAt as string) : undefined,
  paidAt: record.paidAt ? new Date(record.paidAt as string) : undefined,
  amount: (record.amount as number) || undefined,
  invoiceNumber: (record.invoiceNumber as string) || undefined,
  stripePaymentIntentId: (record.stripePaymentIntentId as string) || undefined,
  paymentProvider: (record.paymentProvider as string) || undefined,
  poNumber: (record.poNumber as string) || undefined,
  notes: (record.notes as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

const mapRecordToEditionSponsorExpanded = (
  record: Record<string, unknown>,
  _pb: PocketBase
): EditionSponsorExpanded => {
  const base = mapRecordToEditionSponsor(record)
  const expand = record.expand as Record<string, unknown> | undefined

  let sponsor: Sponsor | undefined
  let pkg: SponsorPackage | undefined

  if (expand?.sponsorId) {
    const sponsorRecord = expand.sponsorId as Record<string, unknown>
    sponsor = {
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
      legalName: (sponsorRecord.legalName as string) || undefined,
      vatNumber: (sponsorRecord.vatNumber as string) || undefined,
      siret: (sponsorRecord.siret as string) || undefined,
      billingAddress: (sponsorRecord.billingAddress as string) || undefined,
      billingCity: (sponsorRecord.billingCity as string) || undefined,
      billingPostalCode: (sponsorRecord.billingPostalCode as string) || undefined,
      billingCountry: (sponsorRecord.billingCountry as string) || undefined,
      createdAt: new Date(sponsorRecord.created as string),
      updatedAt: new Date(sponsorRecord.updated as string)
    }
  }

  if (expand?.packageId) {
    const pkgRecord = expand.packageId as Record<string, unknown>
    let benefits: Benefit[] = []
    if (pkgRecord.benefits) {
      if (typeof pkgRecord.benefits === 'string') {
        try {
          benefits = JSON.parse(pkgRecord.benefits)
        } catch {
          benefits = []
        }
      } else if (Array.isArray(pkgRecord.benefits)) {
        benefits = pkgRecord.benefits as Benefit[]
      }
    }

    pkg = {
      id: pkgRecord.id as string,
      editionId: pkgRecord.editionId as string,
      name: pkgRecord.name as string,
      tier: (pkgRecord.tier as number) || 1,
      price: (pkgRecord.price as number) || 0,
      currency: ((pkgRecord.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
      maxSponsors: (pkgRecord.maxSponsors as number) || undefined,
      benefits,
      description: (pkgRecord.description as string) || undefined,
      isActive: (pkgRecord.isActive as boolean) ?? true,
      createdAt: new Date(pkgRecord.created as string),
      updatedAt: new Date(pkgRecord.updated as string)
    }
  }

  return {
    ...base,
    sponsor,
    package: pkg
  }
}

export type EditionSponsorRepository = ReturnType<typeof createEditionSponsorRepository>
