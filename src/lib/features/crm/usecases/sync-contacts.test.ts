import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSyncContactsUseCase } from './sync-contacts'

const createMockPb = () => {
  // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase collections
  const collections: Record<string, any> = {}
  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = {
          getList: vi.fn(),
          getFullList: vi.fn(),
          getOne: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn()
        }
      }
      return collections[name]
    })
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase client
  } as any
}

describe('createSyncContactsUseCase', () => {
  let pb: ReturnType<typeof createMockPb>
  let syncContacts: ReturnType<typeof createSyncContactsUseCase>

  beforeEach(() => {
    pb = createMockPb()
    syncContacts = createSyncContactsUseCase(pb)
  })

  it('returns empty result when no editions exist', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([])

    const result = await syncContacts('event1')

    expect(result).toEqual({ created: 0, updated: 0, linked: 0, errors: [] })
  })

  it('syncs speakers: creates contacts from talks/speakers and creates edition links with speaker role', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([{ id: 'ed1' }])

    // Talks with speakers
    pb.collection('talks').getFullList.mockResolvedValue([{ id: 'talk1', speakerIds: ['spk1'] }])

    // Speaker data
    pb.collection('speakers').getOne.mockResolvedValue({
      id: 'spk1',
      email: 'speaker@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      company: 'TechCo',
      jobTitle: 'Engineer',
      bio: 'A bio',
      photoUrl: 'https://photo.url',
      twitter: '@jane',
      linkedin: 'https://linkedin.com/jane',
      github: 'janedoe',
      city: 'Lyon',
      country: 'France'
    })

    // No existing contact
    pb.collection('contacts').getList.mockResolvedValue({ items: [] })

    // Contact creation
    pb.collection('contacts').create.mockResolvedValue({ id: 'contact1' })

    // No existing edition link
    pb.collection('contact_edition_links').getList.mockResolvedValue({ items: [] })
    pb.collection('contact_edition_links').create.mockResolvedValue({ id: 'link1' })

    // No attendees (billing_tickets)
    pb.collection('billing_tickets').getFullList.mockResolvedValue([])

    const result = await syncContacts('event1')

    expect(result.created).toBe(1)
    expect(result.linked).toBe(1)
    expect(result.errors).toHaveLength(0)

    // Verify contact was created with speaker data
    expect(pb.collection('contacts').create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event1',
        email: 'speaker@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        company: 'TechCo',
        source: 'speaker'
      })
    )

    // Verify edition link was created with speaker role
    expect(pb.collection('contact_edition_links').create).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 'contact1',
        editionId: 'ed1',
        roles: JSON.stringify(['speaker']),
        speakerId: 'spk1'
      })
    )
  })

  it('syncs attendees: creates contacts from billing_tickets and creates edition links with attendee role', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([{ id: 'ed1' }])

    // No talks
    pb.collection('talks').getFullList.mockResolvedValue([])

    // Billing tickets
    pb.collection('billing_tickets').getFullList.mockResolvedValue([
      {
        id: 'ticket1',
        attendeeEmail: 'attendee@example.com',
        attendeeFirstName: 'Bob',
        attendeeLastName: 'Smith',
        status: 'valid'
      }
    ])

    // No existing contact
    pb.collection('contacts').getList.mockResolvedValue({ items: [] })

    // Contact creation
    pb.collection('contacts').create.mockResolvedValue({ id: 'contact2' })

    // No existing edition link
    pb.collection('contact_edition_links').getList.mockResolvedValue({ items: [] })
    pb.collection('contact_edition_links').create.mockResolvedValue({ id: 'link2' })

    const result = await syncContacts('event1')

    expect(result.created).toBe(1)
    expect(result.linked).toBe(1)
    expect(result.errors).toHaveLength(0)

    // Verify contact was created with attendee data
    expect(pb.collection('contacts').create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event1',
        email: 'attendee@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        source: 'attendee'
      })
    )

    // Verify edition link was created with attendee role
    expect(pb.collection('contact_edition_links').create).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 'contact2',
        editionId: 'ed1',
        roles: JSON.stringify(['attendee']),
        speakerId: ''
      })
    )
  })

  it('merge behavior: updates empty fields but keeps existing ones', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([{ id: 'ed1' }])

    pb.collection('talks').getFullList.mockResolvedValue([{ id: 'talk1', speakerIds: ['spk1'] }])

    pb.collection('speakers').getOne.mockResolvedValue({
      id: 'spk1',
      email: 'speaker@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      company: 'NewCo',
      jobTitle: 'CTO',
      bio: '',
      photoUrl: '',
      twitter: '',
      linkedin: '',
      github: '',
      city: 'Lyon',
      country: 'France'
    })

    // Existing contact with some fields filled, some empty
    pb.collection('contacts').getList.mockResolvedValue({
      items: [
        {
          id: 'contact1',
          email: 'speaker@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          company: 'OldCo', // Already has a company => should NOT be overwritten
          jobTitle: '', // Empty => should be updated
          bio: '',
          photoUrl: '',
          twitter: '',
          linkedin: '',
          github: '',
          city: '', // Empty => should be updated
          country: '' // Empty => should be updated
        }
      ]
    })

    pb.collection('contacts').update.mockResolvedValue({})

    // Edition link already exists
    pb.collection('contact_edition_links').getList.mockResolvedValue({
      items: [{ id: 'link1', roles: ['speaker'] }]
    })

    // No attendees
    pb.collection('billing_tickets').getFullList.mockResolvedValue([])

    const result = await syncContacts('event1')

    expect(result.updated).toBe(1)

    // Verify only empty fields were updated (company stays as OldCo)
    expect(pb.collection('contacts').update).toHaveBeenCalledWith(
      'contact1',
      expect.objectContaining({
        jobTitle: 'CTO',
        city: 'Lyon',
        country: 'France'
      })
    )

    // Verify company was NOT included in updates (it was already filled)
    const updateCall = pb.collection('contacts').update.mock.calls[0][1]
    expect(updateCall).not.toHaveProperty('company')
  })

  it('deduplication: same email across editions only creates one contact', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([{ id: 'ed1' }, { id: 'ed2' }])

    // Edition 1: speaker
    pb.collection('talks')
      .getFullList.mockResolvedValueOnce([{ id: 'talk1', speakerIds: ['spk1'] }]) // ed1
      .mockResolvedValueOnce([]) // ed2

    pb.collection('speakers').getOne.mockResolvedValue({
      id: 'spk1',
      email: 'shared@example.com',
      firstName: 'Alice',
      lastName: 'Wonder',
      company: '',
      jobTitle: '',
      bio: '',
      photoUrl: '',
      twitter: '',
      linkedin: '',
      github: '',
      city: '',
      country: ''
    })

    // First call: no existing contact (ed1 speaker sync)
    // Second call: contact exists (ed1 edition link check already created it)
    // Third call: contact exists (ed2 attendee sync)
    pb.collection('contacts')
      .getList.mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'contact1',
            company: '',
            jobTitle: '',
            bio: '',
            city: '',
            country: '',
            twitter: '',
            linkedin: '',
            github: '',
            photoUrl: ''
          }
        ]
      })

    pb.collection('contacts').create.mockResolvedValue({ id: 'contact1' })

    // Edition links
    pb.collection('contact_edition_links')
      .getList.mockResolvedValueOnce({ items: [] }) // ed1 speaker
      .mockResolvedValueOnce({ items: [] }) // ed2 attendee

    pb.collection('contact_edition_links').create.mockResolvedValue({ id: 'link1' })

    // Edition 2: same person as attendee
    pb.collection('billing_tickets')
      .getFullList.mockResolvedValueOnce([]) // ed1
      .mockResolvedValueOnce([
        {
          id: 'ticket1',
          attendeeEmail: 'shared@example.com',
          attendeeFirstName: 'Alice',
          attendeeLastName: 'Wonder'
        }
      ]) // ed2

    const result = await syncContacts('event1')

    // Contact created only once (for ed1 speaker), then found existing for ed2 attendee
    expect(result.created).toBe(1)
    expect(result.linked).toBe(2) // linked in both editions
  })

  it('edition link role merging: adds role to existing link', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([{ id: 'ed1' }])

    // Speaker
    pb.collection('talks').getFullList.mockResolvedValue([{ id: 'talk1', speakerIds: ['spk1'] }])

    pb.collection('speakers').getOne.mockResolvedValue({
      id: 'spk1',
      email: 'both@example.com',
      firstName: 'Both',
      lastName: 'Roles',
      company: '',
      jobTitle: '',
      bio: '',
      photoUrl: '',
      twitter: '',
      linkedin: '',
      github: '',
      city: '',
      country: ''
    })

    // Contact already exists for both calls
    pb.collection('contacts').getList.mockResolvedValue({
      items: [
        {
          id: 'contact1',
          company: '',
          jobTitle: '',
          bio: '',
          city: '',
          country: '',
          twitter: '',
          linkedin: '',
          github: '',
          photoUrl: ''
        }
      ]
    })

    // First link check (speaker): link already exists with attendee role
    // Second link check (attendee): link now has both roles
    pb.collection('contact_edition_links')
      .getList.mockResolvedValueOnce({
        items: [{ id: 'link1', roles: ['attendee'] }]
      })
      .mockResolvedValueOnce({
        items: [{ id: 'link1', roles: ['attendee', 'speaker'] }]
      })

    pb.collection('contact_edition_links').update.mockResolvedValue({})

    // Same person also has a ticket
    pb.collection('billing_tickets').getFullList.mockResolvedValue([
      {
        id: 'ticket1',
        attendeeEmail: 'both@example.com',
        attendeeFirstName: 'Both',
        attendeeLastName: 'Roles'
      }
    ])

    const result = await syncContacts('event1')

    // Speaker role was added to existing link that already had attendee
    expect(pb.collection('contact_edition_links').update).toHaveBeenCalledWith(
      'link1',
      expect.objectContaining({
        roles: JSON.stringify(['attendee', 'speaker'])
      })
    )
    expect(result.linked).toBe(1) // Only the speaker link update counted; attendee link already had both roles
  })

  it('handles errors per speaker/attendee without stopping the whole sync', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([{ id: 'ed1' }])

    pb.collection('talks').getFullList.mockResolvedValue([
      { id: 'talk1', speakerIds: ['spk1', 'spk2'] }
    ])

    // First speaker fails, second succeeds
    pb.collection('speakers')
      .getOne.mockRejectedValueOnce(new Error('Speaker not found'))
      .mockResolvedValueOnce({
        id: 'spk2',
        email: 'ok@example.com',
        firstName: 'Ok',
        lastName: 'Speaker',
        company: '',
        jobTitle: '',
        bio: '',
        photoUrl: '',
        twitter: '',
        linkedin: '',
        github: '',
        city: '',
        country: ''
      })

    // For the successful speaker
    pb.collection('contacts').getList.mockResolvedValue({ items: [] })
    pb.collection('contacts').create.mockResolvedValue({ id: 'contact2' })
    pb.collection('contact_edition_links').getList.mockResolvedValue({ items: [] })
    pb.collection('contact_edition_links').create.mockResolvedValue({ id: 'link2' })

    // No attendees
    pb.collection('billing_tickets').getFullList.mockResolvedValue([])

    const result = await syncContacts('event1')

    expect(result.created).toBe(1)
    expect(result.linked).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('spk1')
  })

  it('syncs multiple editions', async () => {
    pb.collection('editions').getFullList.mockResolvedValue([{ id: 'ed1' }, { id: 'ed2' }])

    // Edition 1: one speaker
    pb.collection('talks')
      .getFullList.mockResolvedValueOnce([{ id: 'talk1', speakerIds: ['spk1'] }])
      .mockResolvedValueOnce([{ id: 'talk2', speakerIds: ['spk2'] }])

    pb.collection('speakers')
      .getOne.mockResolvedValueOnce({
        id: 'spk1',
        email: 'speaker1@example.com',
        firstName: 'Speaker',
        lastName: 'One',
        company: '',
        jobTitle: '',
        bio: '',
        photoUrl: '',
        twitter: '',
        linkedin: '',
        github: '',
        city: '',
        country: ''
      })
      .mockResolvedValueOnce({
        id: 'spk2',
        email: 'speaker2@example.com',
        firstName: 'Speaker',
        lastName: 'Two',
        company: '',
        jobTitle: '',
        bio: '',
        photoUrl: '',
        twitter: '',
        linkedin: '',
        github: '',
        city: '',
        country: ''
      })

    // No existing contacts
    pb.collection('contacts').getList.mockResolvedValue({ items: [] })
    pb.collection('contacts')
      .create.mockResolvedValueOnce({ id: 'contact1' })
      .mockResolvedValueOnce({ id: 'contact2' })

    // No existing edition links
    pb.collection('contact_edition_links').getList.mockResolvedValue({ items: [] })
    pb.collection('contact_edition_links').create.mockResolvedValue({ id: 'link' })

    // No attendees
    pb.collection('billing_tickets').getFullList.mockResolvedValue([])

    const result = await syncContacts('event1')

    expect(result.created).toBe(2)
    expect(result.linked).toBe(2)
    expect(result.errors).toHaveLength(0)

    // Verify talks were fetched for both editions
    expect(pb.collection('talks').getFullList).toHaveBeenCalledTimes(2)
    expect(pb.collection('talks').getFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'editionId = "ed1"' })
    )
    expect(pb.collection('talks').getFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'editionId = "ed2"' })
    )
  })
})
