import { type SocialLink, generateSlug } from '$lib/features/core/domain/team-member'
import { createTeamMemberRepository } from '$lib/features/core/infra'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get edition with event
  let edition: {
    id: string
    slug: string
    name: string
    expand?: { eventId?: { organizationId: string; name: string } }
  }
  try {
    edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${editionSlug}"`, { expand: 'eventId' })
  } catch {
    throw error(404, 'Edition not found')
  }

  // Get the event to find the organization
  const event = edition.expand?.eventId
  if (!event) {
    throw error(404, 'Event not found')
  }

  const teamMemberRepo = createTeamMemberRepository(locals.pb)
  const members = await teamMemberRepo.findByEdition(edition.id)
  const teams = await teamMemberRepo.getTeams(edition.id)

  // Get organization members
  let orgMembers: Array<{
    id: string
    userId: string
    name: string
    email: string
    role: string
    avatar: string | null
  }> = []

  try {
    const memberRecords = await locals.pb.collection('organization_members').getFullList({
      filter: `organizationId="${event.organizationId}"`,
      expand: 'userId'
    })

    orgMembers = memberRecords.map((m) => {
      const user = m.expand?.userId as Record<string, unknown> | undefined
      return {
        id: m.id as string,
        userId: m.userId as string,
        name: user ? (user.name as string) : 'Unknown',
        email: user ? (user.email as string) : '',
        role: m.role as string,
        avatar: user?.avatar
          ? locals.pb.files.getURL(
              { collectionId: 'users', id: user.id as string },
              user.avatar as string,
              { thumb: '100x100' }
            )
          : null
      }
    })
  } catch {
    // Collection might not exist yet or no members
  }

  // Filter out org members who are already in the team (by name match)
  const existingNames = new Set(members.map((m) => m.name.toLowerCase()))
  const availableOrgMembers = orgMembers.filter((om) => !existingNames.has(om.name.toLowerCase()))

  return {
    edition: {
      id: edition.id,
      name: edition.name,
      slug: edition.slug,
      eventName: event.name
    },
    members: members.map((m) => ({
      ...m,
      photoFileUrl: m.photo
        ? locals.pb.files.getURL({ collectionId: 'team_members', id: m.id }, m.photo, {
            thumb: '200x200'
          })
        : null
    })),
    teams,
    orgMembers: availableOrgMembers
  }
}

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const { editionSlug } = params
    const formData = await request.formData()

    // Get edition
    let edition: { id: string; slug: string; expand?: { eventId?: { organizationId: string } } }
    try {
      edition = await locals.pb.collection('editions').getFirstListItem(`slug="${editionSlug}"`)
    } catch {
      return fail(404, { error: 'Edition not found' })
    }

    const name = formData.get('name') as string
    const team = formData.get('team') as string
    const role = formData.get('role') as string
    const bio = formData.get('bio') as string
    const photoUrl = formData.get('photoUrl') as string
    const socialsJson = formData.get('socials') as string
    const photo = formData.get('photo') as File | null

    if (!name) {
      return fail(400, { error: 'Name is required' })
    }

    let socials: SocialLink[] = []
    if (socialsJson) {
      try {
        socials = JSON.parse(socialsJson)
      } catch {
        return fail(400, { error: 'Invalid socials format' })
      }
    }

    const slug = generateSlug(name)

    try {
      // Check if slug already exists
      const teamMemberRepo = createTeamMemberRepository(locals.pb)
      const existing = await teamMemberRepo.findBySlug(edition.id, slug)
      if (existing) {
        return fail(400, { error: 'A team member with this name already exists' })
      }

      // Get max display order
      const members = await teamMemberRepo.findByEdition(edition.id)
      const maxOrder = members.reduce((max, m) => Math.max(max, m.displayOrder || 0), 0)

      // Create the member using FormData to support file upload
      const formDataForCreate = new FormData()
      formDataForCreate.append('editionId', edition.id)
      formDataForCreate.append('slug', slug)
      formDataForCreate.append('name', name)
      formDataForCreate.append('team', team || '')
      formDataForCreate.append('role', role || '')
      formDataForCreate.append('bio', bio || '')
      formDataForCreate.append('photoUrl', photoUrl || '')
      formDataForCreate.append('socials', JSON.stringify(socials))
      formDataForCreate.append('displayOrder', String(maxOrder + 1))

      // If a file was uploaded, include it
      if (photo && photo.size > 0) {
        formDataForCreate.append('photo', photo)
      }

      await locals.pb.collection('team_members').create(formDataForCreate)

      return { success: true }
    } catch (e) {
      console.error('Failed to create team member:', e)
      return fail(500, { error: 'Failed to create team member' })
    }
  },

  update: async ({ request, params, locals }) => {
    const { editionSlug } = params
    const formData = await request.formData()

    // Get edition
    let edition: { id: string; slug: string; expand?: { eventId?: { organizationId: string } } }
    try {
      edition = await locals.pb.collection('editions').getFirstListItem(`slug="${editionSlug}"`)
    } catch {
      return fail(404, { error: 'Edition not found' })
    }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const team = formData.get('team') as string
    const role = formData.get('role') as string
    const bio = formData.get('bio') as string
    const photoUrl = formData.get('photoUrl') as string
    const socialsJson = formData.get('socials') as string
    const photo = formData.get('photo') as File | null

    if (!id) {
      return fail(400, { error: 'Member ID is required' })
    }

    if (!name) {
      return fail(400, { error: 'Name is required' })
    }

    let socials: SocialLink[] = []
    if (socialsJson) {
      try {
        socials = JSON.parse(socialsJson)
      } catch {
        return fail(400, { error: 'Invalid socials format' })
      }
    }

    const slug = generateSlug(name)

    try {
      const teamMemberRepo = createTeamMemberRepository(locals.pb)

      // Check if slug already exists for another member
      const existing = await teamMemberRepo.findBySlug(edition.id, slug)
      if (existing && existing.id !== id) {
        return fail(400, { error: 'A team member with this name already exists' })
      }

      // Update the member using FormData to support file upload
      const formDataForUpdate = new FormData()
      formDataForUpdate.append('slug', slug)
      formDataForUpdate.append('name', name)
      formDataForUpdate.append('team', team || '')
      formDataForUpdate.append('role', role || '')
      formDataForUpdate.append('bio', bio || '')
      formDataForUpdate.append('photoUrl', photoUrl || '')
      formDataForUpdate.append('socials', JSON.stringify(socials))

      // If a file was uploaded, include it
      if (photo && photo.size > 0) {
        formDataForUpdate.append('photo', photo)
      }

      await locals.pb.collection('team_members').update(id, formDataForUpdate)

      return { success: true }
    } catch (e) {
      console.error('Failed to update team member:', e)
      return fail(500, { error: 'Failed to update team member' })
    }
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Member ID is required' })
    }

    try {
      const teamMemberRepo = createTeamMemberRepository(locals.pb)
      await teamMemberRepo.delete(id)
      return { success: true }
    } catch (e) {
      console.error('Failed to delete team member:', e)
      return fail(500, { error: 'Failed to delete team member' })
    }
  },

  removePhoto: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Member ID is required' })
    }

    try {
      const teamMemberRepo = createTeamMemberRepository(locals.pb)
      await teamMemberRepo.removePhoto(id)
      return { success: true }
    } catch (e) {
      console.error('Failed to remove photo:', e)
      return fail(500, { error: 'Failed to remove photo' })
    }
  },

  importOrgMembers: async ({ request, params, locals }) => {
    const { editionSlug } = params
    const formData = await request.formData()

    // Get edition
    let edition: { id: string; slug: string; expand?: { eventId?: { organizationId: string } } }
    try {
      edition = await locals.pb
        .collection('editions')
        .getFirstListItem(`slug="${editionSlug}"`, { expand: 'eventId' })
    } catch {
      return fail(404, { error: 'Edition not found' })
    }

    const memberIdsJson = formData.get('memberIds') as string
    const team = formData.get('team') as string

    if (!memberIdsJson) {
      return fail(400, { error: 'No members selected' })
    }

    let memberIds: string[] = []
    try {
      memberIds = JSON.parse(memberIdsJson) as string[]
    } catch {
      return fail(400, { error: 'Invalid member IDs format' })
    }

    if (memberIds.length === 0) {
      return fail(400, { error: 'No members selected' })
    }

    const event = edition.expand?.eventId
    if (!event) {
      return fail(404, { error: 'Event not found' })
    }

    try {
      const teamMemberRepo = createTeamMemberRepository(locals.pb)

      // Get current max display order
      const existingMembers = await teamMemberRepo.findByEdition(edition.id)
      let maxOrder = existingMembers.reduce((max, m) => Math.max(max, m.displayOrder || 0), 0)

      // Get org members to import
      const orgMemberRecords = await locals.pb.collection('organization_members').getFullList({
        filter: `organizationId="${event.organizationId}"`,
        expand: 'userId'
      })

      let importedCount = 0

      for (const orgMember of orgMemberRecords) {
        if (!memberIds.includes(orgMember.id)) continue

        const user = orgMember.expand?.userId as Record<string, unknown> | undefined
        if (!user) continue

        const name = user.name as string
        const slug = generateSlug(name)

        // Check if already exists
        const existing = await teamMemberRepo.findBySlug(edition.id, slug)
        if (existing) continue

        // Get role label
        const roleLabels: Record<string, string> = {
          owner: 'Owner',
          admin: 'Administrator',
          organizer: 'Organizer',
          reviewer: 'Reviewer'
        }

        maxOrder++

        // Create team member from org member
        await teamMemberRepo.create({
          editionId: edition.id,
          slug,
          name,
          team: team || 'Organizers',
          role: roleLabels[orgMember.role as string] || (orgMember.role as string),
          bio: undefined,
          photoUrl: user.avatar
            ? locals.pb.files.getURL(
                { collectionId: 'users', id: user.id as string },
                user.avatar as string
              )
            : undefined,
          socials: [],
          displayOrder: maxOrder
        })

        importedCount++
      }

      return { success: true, message: `${importedCount} member(s) imported` }
    } catch (e) {
      console.error('Failed to import org members:', e)
      return fail(500, { error: 'Failed to import organization members' })
    }
  }
}
