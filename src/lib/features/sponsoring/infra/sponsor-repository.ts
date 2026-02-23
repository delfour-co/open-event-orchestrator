import { filterAnd, filterContains, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateSponsor, Sponsor, UpdateSponsor } from '../domain'

const COLLECTION = 'sponsors'

export const createSponsorRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Sponsor | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToSponsor(record)
    } catch {
      return null
    }
  },

  async findByOrganization(organizationId: string): Promise<Sponsor[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`organizationId = ${organizationId}`,
      sort: 'name'
    })
    return records.map(mapRecordToSponsor)
  },

  async findAll(): Promise<Sponsor[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      sort: 'name'
    })
    return records.map(mapRecordToSponsor)
  },

  async search(query: string, organizationId?: string): Promise<Sponsor[]> {
    const nameFilter = filterContains('name', query)
    const orgFilter = organizationId ? safeFilter`organizationId = ${organizationId}` : undefined
    const filter = filterAnd(orgFilter, nameFilter)
    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: 'name'
    })
    return records.map(mapRecordToSponsor)
  },

  async create(data: CreateSponsor): Promise<Sponsor> {
    const record = await pb.collection(COLLECTION).create({
      organizationId: data.organizationId,
      name: data.name,
      logo: data.logo || null,
      website: data.website || null,
      description: data.description || null,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      notes: data.notes || null,
      legalName: data.legalName || null,
      vatNumber: data.vatNumber || null,
      siret: data.siret || null,
      billingAddress: data.billingAddress || null,
      billingCity: data.billingCity || null,
      billingPostalCode: data.billingPostalCode || null,
      billingCountry: data.billingCountry || null
    })
    return mapRecordToSponsor(record)
  },

  async update(id: string, data: UpdateSponsor): Promise<Sponsor> {
    const updateData: Record<string, unknown> = {}
    const nullableFields = [
      'logo',
      'website',
      'description',
      'contactName',
      'contactEmail',
      'contactPhone',
      'notes',
      'legalName',
      'vatNumber',
      'siret',
      'billingAddress',
      'billingCity',
      'billingPostalCode',
      'billingCountry'
    ] as const
    if (data.name !== undefined) updateData.name = data.name
    for (const field of nullableFields) {
      if (data[field] !== undefined) updateData[field] = data[field] || null
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToSponsor(record)
  },

  async updateLogo(id: string, logo: File): Promise<Sponsor> {
    const formData = new FormData()
    formData.append('logo', logo)
    const record = await pb.collection(COLLECTION).update(id, formData)
    return mapRecordToSponsor(record)
  },

  async removeLogo(id: string): Promise<Sponsor> {
    const record = await pb.collection(COLLECTION).update(id, { logo: null })
    return mapRecordToSponsor(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  getLogoUrl(sponsor: Sponsor): string | null {
    if (!sponsor.logo) return null
    return pb.files.getURL(
      { id: sponsor.id, collectionId: COLLECTION, collectionName: COLLECTION },
      sponsor.logo
    )
  },

  getLogoThumbUrl(
    sponsor: Sponsor,
    size: '100x100' | '200x200' | '400x400' = '200x200'
  ): string | null {
    if (!sponsor.logo) return null
    return pb.files.getURL(
      { id: sponsor.id, collectionId: COLLECTION, collectionName: COLLECTION },
      sponsor.logo,
      { thumb: size }
    )
  }
})

const mapRecordToSponsor = (record: Record<string, unknown>): Sponsor => ({
  id: record.id as string,
  organizationId: record.organizationId as string,
  name: record.name as string,
  logo: (record.logo as string) || undefined,
  website: (record.website as string) || undefined,
  description: (record.description as string) || undefined,
  contactName: (record.contactName as string) || undefined,
  contactEmail: (record.contactEmail as string) || undefined,
  contactPhone: (record.contactPhone as string) || undefined,
  notes: (record.notes as string) || undefined,
  legalName: (record.legalName as string) || undefined,
  vatNumber: (record.vatNumber as string) || undefined,
  siret: (record.siret as string) || undefined,
  billingAddress: (record.billingAddress as string) || undefined,
  billingCity: (record.billingCity as string) || undefined,
  billingPostalCode: (record.billingPostalCode as string) || undefined,
  billingCountry: (record.billingCountry as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type SponsorRepository = ReturnType<typeof createSponsorRepository>
