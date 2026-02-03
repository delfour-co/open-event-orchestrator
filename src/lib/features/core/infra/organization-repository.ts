import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import type { CreateOrganizationInput, Organization, UpdateOrganizationInput } from '../domain'

export type OrganizationRepository = {
  create: (input: CreateOrganizationInput) => Promise<Organization>
  findById: (id: string) => Promise<Organization | null>
  findBySlug: (slug: string) => Promise<Organization | null>
  findAll: () => Promise<Organization[]>
  update: (id: string, input: UpdateOrganizationInput) => Promise<Organization>
  delete: (id: string) => Promise<void>
}

const mapToOrganization = (record: RecordModel): Organization => ({
  id: record.id,
  name: record.name,
  slug: record.slug,
  description: record.description || undefined,
  logo: record.logo || undefined,
  website: record.website || undefined,
  createdAt: new Date(record.created),
  updatedAt: new Date(record.updated)
})

export const createOrganizationRepository = (pb: PocketBase): OrganizationRepository => ({
  async create(input) {
    const record = await pb.collection('organizations').create(input)
    return mapToOrganization(record)
  },

  async findById(id) {
    try {
      const record = await pb.collection('organizations').getOne(id)
      return mapToOrganization(record)
    } catch {
      return null
    }
  },

  async findBySlug(slug) {
    try {
      const record = await pb.collection('organizations').getFirstListItem(`slug="${slug}"`)
      return mapToOrganization(record)
    } catch {
      return null
    }
  },

  async findAll() {
    const records = await pb.collection('organizations').getFullList()
    return records.map(mapToOrganization)
  },

  async update(id, input) {
    const record = await pb.collection('organizations').update(id, input)
    return mapToOrganization(record)
  },

  async delete(id) {
    await pb.collection('organizations').delete(id)
  }
})
