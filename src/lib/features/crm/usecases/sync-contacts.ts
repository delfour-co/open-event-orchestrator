import type PocketBase from 'pocketbase'
import type { ContactSource, CreateContact, EditionRole } from '../domain'

export interface SyncContactsResult {
  created: number
  updated: number
  linked: number
  errors: string[]
}

export const createSyncContactsUseCase = (pb: PocketBase) => {
  return async (organizationId: string): Promise<SyncContactsResult> => {
    const result: SyncContactsResult = { created: 0, updated: 0, linked: 0, errors: [] }

    // Get all editions for the organization's events
    const events = await pb.collection('events').getFullList({
      filter: `organizationId = "${organizationId}"`
    })
    const eventIds = events.map((e) => e.id)

    if (eventIds.length === 0) return result

    const editions = await pb.collection('editions').getFullList({
      filter: eventIds.map((id) => `eventId = "${id}"`).join(' || ')
    })
    const editionIds = editions.map((e) => e.id)

    if (editionIds.length === 0) return result

    // Sync speakers
    for (const editionId of editionIds) {
      await syncSpeakers(pb, organizationId, editionId, result)
      await syncAttendees(pb, organizationId, editionId, result)
    }

    return result
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: contact sync requires multiple conditional merge steps
async function findOrCreateContact(
  pb: PocketBase,
  organizationId: string,
  email: string,
  data: Partial<CreateContact>,
  source: ContactSource,
  result: SyncContactsResult
): Promise<string> {
  const existing = await pb.collection('contacts').getList(1, 1, {
    filter: `organizationId = "${organizationId}" && email = "${email}"`
  })

  if (existing.items.length > 0) {
    const contact = existing.items[0]
    // Update with new data if fields are empty
    const updates: Record<string, unknown> = {}
    if (!contact.company && data.company) updates.company = data.company
    if (!contact.jobTitle && data.jobTitle) updates.jobTitle = data.jobTitle
    if (!contact.bio && data.bio) updates.bio = data.bio
    if (!contact.city && data.city) updates.city = data.city
    if (!contact.country && data.country) updates.country = data.country
    if (!contact.twitter && data.twitter) updates.twitter = data.twitter
    if (!contact.linkedin && data.linkedin) updates.linkedin = data.linkedin
    if (!contact.github && data.github) updates.github = data.github
    if (!contact.photoUrl && data.photoUrl) updates.photoUrl = data.photoUrl

    if (Object.keys(updates).length > 0) {
      await pb.collection('contacts').update(contact.id, updates)
      result.updated++
    }
    return contact.id as string
  }

  const contact = await pb.collection('contacts').create({
    organizationId,
    email,
    firstName: data.firstName || 'Unknown',
    lastName: data.lastName || 'Contact',
    company: data.company || '',
    jobTitle: data.jobTitle || '',
    bio: data.bio || '',
    photoUrl: data.photoUrl || '',
    twitter: data.twitter || '',
    linkedin: data.linkedin || '',
    github: data.github || '',
    city: data.city || '',
    country: data.country || '',
    source,
    tags: JSON.stringify([]),
    notes: ''
  })
  result.created++
  return contact.id as string
}

async function ensureEditionLink(
  pb: PocketBase,
  contactId: string,
  editionId: string,
  role: EditionRole,
  speakerId?: string
): Promise<boolean> {
  const existing = await pb.collection('contact_edition_links').getList(1, 1, {
    filter: `contactId = "${contactId}" && editionId = "${editionId}"`
  })

  if (existing.items.length > 0) {
    const link = existing.items[0]
    const roles = (link.roles as string[]) || []
    if (!roles.includes(role)) {
      roles.push(role)
      const updates: Record<string, unknown> = { roles: JSON.stringify(roles) }
      if (speakerId && !link.speakerId) updates.speakerId = speakerId
      await pb.collection('contact_edition_links').update(link.id, updates)
      return true
    }
    return false
  }

  await pb.collection('contact_edition_links').create({
    contactId,
    editionId,
    roles: JSON.stringify([role]),
    speakerId: speakerId || ''
  })
  return true
}

async function syncSpeakers(
  pb: PocketBase,
  organizationId: string,
  editionId: string,
  result: SyncContactsResult
): Promise<void> {
  const talks = await pb.collection('talks').getFullList({
    filter: `editionId = "${editionId}"`,
    expand: 'speakerIds'
  })

  const speakerIds = new Set<string>()
  for (const talk of talks) {
    const ids = talk.speakerIds as string[]
    if (ids) {
      for (const id of Array.isArray(ids) ? ids : [ids]) {
        speakerIds.add(id)
      }
    }
  }

  for (const speakerId of speakerIds) {
    try {
      const speaker = await pb.collection('speakers').getOne(speakerId)
      const contactId = await findOrCreateContact(
        pb,
        organizationId,
        speaker.email as string,
        {
          organizationId,
          email: speaker.email as string,
          firstName: speaker.firstName as string,
          lastName: speaker.lastName as string,
          company: speaker.company as string,
          jobTitle: speaker.jobTitle as string,
          bio: speaker.bio as string,
          photoUrl: speaker.photoUrl as string,
          twitter: speaker.twitter as string,
          linkedin: speaker.linkedin as string,
          github: speaker.github as string,
          city: speaker.city as string,
          country: speaker.country as string,
          source: 'speaker',
          tags: []
        },
        'speaker',
        result
      )
      const linked = await ensureEditionLink(pb, contactId, editionId, 'speaker', speakerId)
      if (linked) result.linked++
    } catch (err) {
      result.errors.push(`Failed to sync speaker ${speakerId}: ${err}`)
    }
  }
}

async function syncAttendees(
  pb: PocketBase,
  organizationId: string,
  editionId: string,
  result: SyncContactsResult
): Promise<void> {
  const tickets = await pb.collection('billing_tickets').getFullList({
    filter: `editionId = "${editionId}" && status != "cancelled"`
  })

  const seen = new Set<string>()
  for (const ticket of tickets) {
    const email = ticket.attendeeEmail as string
    if (seen.has(email)) continue
    seen.add(email)

    try {
      const contactId = await findOrCreateContact(
        pb,
        organizationId,
        email,
        {
          organizationId,
          email,
          firstName: ticket.attendeeFirstName as string,
          lastName: ticket.attendeeLastName as string,
          source: 'attendee',
          tags: []
        },
        'attendee',
        result
      )
      const linked = await ensureEditionLink(pb, contactId, editionId, 'attendee')
      if (linked) result.linked++
    } catch (err) {
      result.errors.push(`Failed to sync attendee ${email}: ${err}`)
    }
  }
}
