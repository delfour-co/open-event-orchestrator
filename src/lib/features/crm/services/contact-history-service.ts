/**
 * Contact History Service
 *
 * Tracks contact participation across events and editions.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type ContactCrossEventSummary,
  type ContactEventParticipation,
  type ContactTimelineEntry,
  type EventParticipationType,
  buildCrossEventSummary,
  buildParticipationDescription
} from '../domain/contact-history'

export interface ContactHistoryService {
  recordParticipation(input: RecordParticipationInput): Promise<ContactEventParticipation>
  getParticipationHistory(contactId: string): Promise<ContactEventParticipation[]>
  getContactTimeline(contactId: string): Promise<ContactTimelineEntry[]>
  getCrossEventSummary(contactId: string): Promise<ContactCrossEventSummary | null>
  findContactByEmail(
    email: string
  ): Promise<Array<{ id: string; eventId: string; editionId: string }>>
  getContactsWithMultipleEvents(minEvents?: number): Promise<ContactCrossEventSummary[]>
  getEditionParticipants(
    editionId: string,
    participationType?: EventParticipationType
  ): Promise<ContactEventParticipation[]>
}

export interface RecordParticipationInput {
  contactId: string
  eventId: string
  editionId: string
  participationType: EventParticipationType
  relatedEntityId?: string
  relatedEntityType?: string
  metadata?: Record<string, unknown>
  occurredAt?: Date
}

export function createContactHistoryService(pb: PocketBase): ContactHistoryService {
  async function getContact(contactId: string): Promise<Record<string, unknown> | null> {
    try {
      return await pb.collection('contacts').getOne(contactId)
    } catch {
      return null
    }
  }

  async function getEventAndEditionNames(
    eventId: string,
    editionId: string
  ): Promise<{ eventName: string; editionName: string }> {
    try {
      const [event, edition] = await Promise.all([
        pb.collection('events').getOne(eventId, { fields: 'name' }),
        pb.collection('editions').getOne(editionId, { fields: 'name' })
      ])
      return {
        eventName: (event.name as string) || 'Unknown Event',
        editionName: (edition.name as string) || 'Unknown Edition'
      }
    } catch {
      return { eventName: 'Unknown Event', editionName: 'Unknown Edition' }
    }
  }

  return {
    async recordParticipation(input: RecordParticipationInput): Promise<ContactEventParticipation> {
      const record = await pb.collection('contact_event_participations').create({
        contactId: input.contactId,
        eventId: input.eventId,
        editionId: input.editionId,
        participationType: input.participationType,
        relatedEntityId: input.relatedEntityId || '',
        relatedEntityType: input.relatedEntityType || '',
        metadata: input.metadata || {},
        occurredAt: (input.occurredAt || new Date()).toISOString()
      })

      return mapRecordToParticipation(record)
    },

    async getParticipationHistory(contactId: string): Promise<ContactEventParticipation[]> {
      const records = await pb.collection('contact_event_participations').getFullList({
        filter: safeFilter`contactId = ${contactId}`,
        sort: '-occurredAt'
      })

      return records.map(mapRecordToParticipation)
    },

    async getContactTimeline(contactId: string): Promise<ContactTimelineEntry[]> {
      const participations = await this.getParticipationHistory(contactId)

      const eventEditionPairs = [
        ...new Set(participations.map((p) => `${p.eventId}|${p.editionId}`))
      ]

      const namesMap = new Map<string, { eventName: string; editionName: string }>()

      await Promise.all(
        eventEditionPairs.map(async (pair) => {
          const [eventId, editionId] = pair.split('|')
          const names = await getEventAndEditionNames(eventId, editionId)
          namesMap.set(pair, names)
        })
      )

      return participations.map((p) => {
        const key = `${p.eventId}|${p.editionId}`
        const names = namesMap.get(key) || {
          eventName: 'Unknown Event',
          editionName: 'Unknown Edition'
        }

        return {
          id: p.id,
          participationType: p.participationType,
          eventName: names.eventName,
          editionName: names.editionName,
          eventId: p.eventId,
          editionId: p.editionId,
          description: buildParticipationDescription(p, names.eventName, names.editionName),
          occurredAt: p.occurredAt,
          metadata: p.metadata
        }
      })
    },

    async getCrossEventSummary(contactId: string): Promise<ContactCrossEventSummary | null> {
      const contact = await getContact(contactId)
      if (!contact) return null

      const participations = await this.getParticipationHistory(contactId)

      return buildCrossEventSummary(
        {
          id: contact.id as string,
          email: (contact.email as string) || '',
          firstName: (contact.firstName as string) || '',
          lastName: (contact.lastName as string) || ''
        },
        participations
      )
    },

    async findContactByEmail(
      email: string
    ): Promise<Array<{ id: string; eventId: string; editionId: string }>> {
      const contacts = await pb.collection('contacts').getFullList({
        filter: safeFilter`email = ${email}`,
        fields: 'id,eventId'
      })

      const results: Array<{ id: string; eventId: string; editionId: string }> = []

      for (const contact of contacts) {
        const links = await pb.collection('contact_edition_links').getFullList({
          filter: safeFilter`contactId = ${contact.id}`,
          fields: 'editionId'
        })

        for (const link of links) {
          results.push({
            id: contact.id,
            eventId: contact.eventId as string,
            editionId: link.editionId as string
          })
        }

        if (links.length === 0) {
          results.push({
            id: contact.id,
            eventId: contact.eventId as string,
            editionId: ''
          })
        }
      }

      return results
    },

    async getContactsWithMultipleEvents(minEvents = 2): Promise<ContactCrossEventSummary[]> {
      const participations = await pb.collection('contact_event_participations').getFullList({
        sort: '-occurredAt'
      })

      const contactParticipations = new Map<string, ContactEventParticipation[]>()

      for (const record of participations) {
        const p = mapRecordToParticipation(record)
        const existing = contactParticipations.get(p.contactId) || []
        existing.push(p)
        contactParticipations.set(p.contactId, existing)
      }

      const results: ContactCrossEventSummary[] = []

      for (const [contactId, parts] of contactParticipations) {
        const uniqueEvents = new Set(parts.map((p) => p.eventId))
        if (uniqueEvents.size >= minEvents) {
          const contact = await getContact(contactId)
          if (contact) {
            const summary = buildCrossEventSummary(
              {
                id: contact.id as string,
                email: (contact.email as string) || '',
                firstName: (contact.firstName as string) || '',
                lastName: (contact.lastName as string) || ''
              },
              parts
            )
            results.push(summary)
          }
        }
      }

      return results.sort((a, b) => b.loyaltyScore - a.loyaltyScore)
    },

    async getEditionParticipants(
      editionId: string,
      participationType?: EventParticipationType
    ): Promise<ContactEventParticipation[]> {
      const filters = [safeFilter`editionId = ${editionId}`]

      if (participationType) {
        filters.push(safeFilter`participationType = ${participationType}`)
      }

      const records = await pb.collection('contact_event_participations').getFullList({
        filter: filters.join(' && '),
        sort: '-occurredAt'
      })

      return records.map(mapRecordToParticipation)
    }
  }
}

function mapRecordToParticipation(record: Record<string, unknown>): ContactEventParticipation {
  return {
    id: record.id as string,
    contactId: record.contactId as string,
    eventId: record.eventId as string,
    editionId: record.editionId as string,
    participationType: record.participationType as EventParticipationType,
    relatedEntityId: record.relatedEntityId as string | undefined,
    relatedEntityType: record.relatedEntityType as string | undefined,
    metadata: record.metadata as Record<string, unknown> | undefined,
    occurredAt: new Date(record.occurredAt as string),
    createdAt: new Date(record.created as string)
  }
}
