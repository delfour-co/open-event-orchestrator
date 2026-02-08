import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  CreateTeamMemberInput,
  TeamMember,
  UpdateTeamMemberInput
} from '../domain/team-member'

interface TeamMemberRecord {
  id: string
  editionId: string
  slug: string
  name: string
  team: string
  role: string
  bio: string
  photo: string
  photoUrl: string
  socials: unknown
  displayOrder: number
  created: string
  updated: string
}

function mapRecordToTeamMember(record: TeamMemberRecord): TeamMember {
  return {
    id: record.id,
    editionId: record.editionId,
    slug: record.slug,
    name: record.name,
    team: record.team || undefined,
    role: record.role || undefined,
    bio: record.bio || undefined,
    photo: record.photo || undefined,
    photoUrl: record.photoUrl || undefined,
    socials: Array.isArray(record.socials) ? record.socials : [],
    displayOrder: record.displayOrder || 0,
    created: new Date(record.created),
    updated: new Date(record.updated)
  }
}

export interface TeamMemberRepository {
  findById(id: string): Promise<TeamMember | null>
  findBySlug(editionId: string, slug: string): Promise<TeamMember | null>
  findByEdition(editionId: string): Promise<TeamMember[]>
  findByTeam(editionId: string, team: string): Promise<TeamMember[]>
  getTeams(editionId: string): Promise<string[]>
  create(data: CreateTeamMemberInput): Promise<TeamMember>
  update(id: string, data: UpdateTeamMemberInput): Promise<TeamMember>
  updatePhoto(id: string, file: File): Promise<TeamMember>
  removePhoto(id: string): Promise<TeamMember>
  delete(id: string): Promise<void>
  reorder(editionId: string, memberIds: string[]): Promise<void>
}

export function createTeamMemberRepository(pb: PocketBase): TeamMemberRepository {
  const collection = 'team_members'

  return {
    async findById(id: string): Promise<TeamMember | null> {
      try {
        const record = await pb.collection(collection).getOne(id)
        return mapRecordToTeamMember(record as unknown as TeamMemberRecord)
      } catch {
        return null
      }
    },

    async findBySlug(editionId: string, slug: string): Promise<TeamMember | null> {
      try {
        const record = await pb
          .collection(collection)
          .getFirstListItem(
            filterAnd(safeFilter`editionId = ${editionId}`, safeFilter`slug = ${slug}`)
          )
        return mapRecordToTeamMember(record as unknown as TeamMemberRecord)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<TeamMember[]> {
      const records = await pb.collection(collection).getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'displayOrder,name'
      })
      return records.map((r) => mapRecordToTeamMember(r as unknown as TeamMemberRecord))
    },

    async findByTeam(editionId: string, team: string): Promise<TeamMember[]> {
      const records = await pb.collection(collection).getFullList({
        filter: filterAnd(safeFilter`editionId = ${editionId}`, safeFilter`team = ${team}`),
        sort: 'displayOrder,name'
      })
      return records.map((r) => mapRecordToTeamMember(r as unknown as TeamMemberRecord))
    },

    async getTeams(editionId: string): Promise<string[]> {
      const records = await pb.collection(collection).getFullList({
        filter: filterAnd(safeFilter`editionId = ${editionId}`, 'team != ""'),
        fields: 'team'
      })
      const teams = new Set<string>()
      for (const record of records) {
        if (record.team) {
          teams.add(record.team as string)
        }
      }
      return Array.from(teams).sort()
    },

    async create(data: CreateTeamMemberInput): Promise<TeamMember> {
      const record = await pb.collection(collection).create({
        editionId: data.editionId,
        slug: data.slug,
        name: data.name,
        team: data.team || '',
        role: data.role || '',
        bio: data.bio || '',
        photoUrl: data.photoUrl || '',
        socials: data.socials || [],
        displayOrder: data.displayOrder || 0
      })
      return mapRecordToTeamMember(record as unknown as TeamMemberRecord)
    },

    async update(id: string, data: UpdateTeamMemberInput): Promise<TeamMember> {
      const updateData: Record<string, unknown> = {}

      if (data.slug !== undefined) updateData.slug = data.slug
      if (data.name !== undefined) updateData.name = data.name
      if (data.team !== undefined) updateData.team = data.team
      if (data.role !== undefined) updateData.role = data.role
      if (data.bio !== undefined) updateData.bio = data.bio
      if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl
      if (data.socials !== undefined) updateData.socials = data.socials
      if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder

      const record = await pb.collection(collection).update(id, updateData)
      return mapRecordToTeamMember(record as unknown as TeamMemberRecord)
    },

    async updatePhoto(id: string, file: File): Promise<TeamMember> {
      const formData = new FormData()
      formData.append('photo', file)
      const record = await pb.collection(collection).update(id, formData)
      return mapRecordToTeamMember(record as unknown as TeamMemberRecord)
    },

    async removePhoto(id: string): Promise<TeamMember> {
      const record = await pb.collection(collection).update(id, { photo: null })
      return mapRecordToTeamMember(record as unknown as TeamMemberRecord)
    },

    async delete(id: string): Promise<void> {
      await pb.collection(collection).delete(id)
    },

    async reorder(_editionId: string, memberIds: string[]): Promise<void> {
      const updates = memberIds.map((id, index) =>
        pb.collection(collection).update(id, { displayOrder: index })
      )
      await Promise.all(updates)
    }
  }
}
