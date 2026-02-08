import { filterAnd, filterOr, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { Benefit, CreatePackage, SponsorPackage, UpdatePackage } from '../domain'

const COLLECTION = 'sponsor_packages'

export const createPackageRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<SponsorPackage | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToPackage(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string): Promise<SponsorPackage[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: 'tier'
    })
    return records.map(mapRecordToPackage)
  },

  async findActiveByEdition(editionId: string): Promise<SponsorPackage[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`editionId = ${editionId}`, 'isActive = true'),
      sort: 'tier'
    })
    return records.map(mapRecordToPackage)
  },

  async create(data: CreatePackage): Promise<SponsorPackage> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      name: data.name,
      tier: data.tier,
      price: data.price,
      currency: data.currency,
      maxSponsors: data.maxSponsors ?? null,
      benefits: data.benefits || [],
      description: data.description || null,
      isActive: data.isActive ?? true
    })
    return mapRecordToPackage(record)
  },

  async update(id: string, data: UpdatePackage): Promise<SponsorPackage> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.tier !== undefined) updateData.tier = data.tier
    if (data.price !== undefined) updateData.price = data.price
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.maxSponsors !== undefined) updateData.maxSponsors = data.maxSponsors ?? null
    if (data.benefits !== undefined) updateData.benefits = data.benefits
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToPackage(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countSponsorsByPackage(packageId: string): Promise<number> {
    const statusCondition = filterOr('status = "confirmed"', 'status = "negotiating"')
    const records = await pb.collection('edition_sponsors').getList(1, 1, {
      filter: filterAnd(safeFilter`packageId = ${packageId}`, statusCondition),
      fields: 'id',
      requestKey: null // Disable auto-cancellation for parallel requests
    })
    return records.totalItems
  },

  async reorderTiers(_editionId: string, packageIds: string[]): Promise<void> {
    for (let i = 0; i < packageIds.length; i++) {
      await pb.collection(COLLECTION).update(packageIds[i], { tier: i + 1 })
    }
  }
})

const mapRecordToPackage = (record: Record<string, unknown>): SponsorPackage => {
  let benefits: Benefit[] = []
  if (record.benefits) {
    if (typeof record.benefits === 'string') {
      try {
        benefits = JSON.parse(record.benefits)
      } catch {
        benefits = []
      }
    } else if (Array.isArray(record.benefits)) {
      benefits = record.benefits as Benefit[]
    }
  }

  return {
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    tier: (record.tier as number) || 1,
    price: (record.price as number) || 0,
    currency: ((record.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
    maxSponsors: (record.maxSponsors as number) || undefined,
    benefits,
    description: (record.description as string) || undefined,
    isActive: (record.isActive as boolean) ?? true,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export type PackageRepository = ReturnType<typeof createPackageRepository>
