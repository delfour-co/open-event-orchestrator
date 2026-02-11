/**
 * Contact Activity Service
 *
 * Records and retrieves contact activities for timeline display
 * and engagement scoring.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import { calculateEngagementScore } from '../domain/contact-activity'
import type {
  ActivityFilterOptions,
  ActivityType,
  ContactActivity,
  CreateContactActivity,
  EngagementScore
} from '../domain/contact-activity'

export interface ContactActivityService {
  /**
   * Record a new activity
   */
  record(activity: CreateContactActivity): Promise<ContactActivity>

  /**
   * Get activities for a contact
   */
  getByContact(options: ActivityFilterOptions): Promise<{
    activities: ContactActivity[]
    total: number
  }>

  /**
   * Get recent activities across all contacts (for admin dashboard)
   */
  getRecent(options: {
    eventId?: string
    editionId?: string
    types?: ActivityType[]
    limit?: number
  }): Promise<ContactActivity[]>

  /**
   * Calculate engagement score for a contact
   */
  getEngagementScore(contactId: string): Promise<EngagementScore>

  /**
   * Get engagement scores for multiple contacts
   */
  getBulkEngagementScores(contactIds: string[]): Promise<Map<string, EngagementScore>>
}

export function createContactActivityService(pb: PocketBase): ContactActivityService {
  return {
    async record(activity: CreateContactActivity): Promise<ContactActivity> {
      const record = await pb.collection('contact_activities').create({
        contactId: activity.contactId,
        eventId: activity.eventId || '',
        editionId: activity.editionId || '',
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata || {}
      })

      return {
        id: record.id,
        contactId: record.contactId as string,
        eventId: record.eventId as string | undefined,
        editionId: record.editionId as string | undefined,
        type: record.type as ActivityType,
        description: record.description as string,
        metadata: record.metadata as Record<string, unknown> | undefined,
        createdAt: new Date(record.created as string)
      }
    },

    async getByContact(options: ActivityFilterOptions): Promise<{
      activities: ContactActivity[]
      total: number
    }> {
      const page = options.page ?? 1
      const perPage = options.perPage ?? 50

      const filters: string[] = [safeFilter`contactId = ${options.contactId}`]

      if (options.types && options.types.length > 0) {
        const typeFilters = options.types.map((t) => safeFilter`type = ${t}`)
        filters.push(`(${typeFilters.join(' || ')})`)
      }

      if (options.eventId) {
        filters.push(safeFilter`eventId = ${options.eventId}`)
      }

      if (options.editionId) {
        filters.push(safeFilter`editionId = ${options.editionId}`)
      }

      if (options.startDate) {
        filters.push(safeFilter`created >= ${options.startDate.toISOString()}`)
      }

      if (options.endDate) {
        filters.push(safeFilter`created <= ${options.endDate.toISOString()}`)
      }

      const records = await pb.collection('contact_activities').getList(page, perPage, {
        filter: filters.join(' && '),
        sort: '-created'
      })

      const activities: ContactActivity[] = records.items.map((record) => ({
        id: record.id,
        contactId: record.contactId as string,
        eventId: record.eventId as string | undefined,
        editionId: record.editionId as string | undefined,
        type: record.type as ActivityType,
        description: record.description as string,
        metadata: record.metadata as Record<string, unknown> | undefined,
        createdAt: new Date(record.created as string)
      }))

      return { activities, total: records.totalItems }
    },

    async getRecent(options: {
      eventId?: string
      editionId?: string
      types?: ActivityType[]
      limit?: number
    }): Promise<ContactActivity[]> {
      const limit = options.limit ?? 50
      const filters: string[] = []

      if (options.eventId) {
        filters.push(safeFilter`eventId = ${options.eventId}`)
      }

      if (options.editionId) {
        filters.push(safeFilter`editionId = ${options.editionId}`)
      }

      if (options.types && options.types.length > 0) {
        const typeFilters = options.types.map((t) => safeFilter`type = ${t}`)
        filters.push(`(${typeFilters.join(' || ')})`)
      }

      const filter = filters.length > 0 ? filters.join(' && ') : undefined

      const records = await pb.collection('contact_activities').getList(1, limit, {
        filter,
        sort: '-created'
      })

      return records.items.map((record) => ({
        id: record.id,
        contactId: record.contactId as string,
        eventId: record.eventId as string | undefined,
        editionId: record.editionId as string | undefined,
        type: record.type as ActivityType,
        description: record.description as string,
        metadata: record.metadata as Record<string, unknown> | undefined,
        createdAt: new Date(record.created as string)
      }))
    },

    async getEngagementScore(contactId: string): Promise<EngagementScore> {
      // Get all activities for the contact (last 180 days for efficiency)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

      const records = await pb.collection('contact_activities').getFullList({
        filter: safeFilter`contactId = ${contactId} && created >= ${sixMonthsAgo.toISOString()}`,
        sort: '-created'
      })

      const activities: ContactActivity[] = records.map((record) => ({
        id: record.id,
        contactId: record.contactId as string,
        eventId: record.eventId as string | undefined,
        editionId: record.editionId as string | undefined,
        type: record.type as ActivityType,
        description: record.description as string,
        metadata: record.metadata as Record<string, unknown> | undefined,
        createdAt: new Date(record.created as string)
      }))

      const score = calculateEngagementScore(activities)
      score.contactId = contactId
      return score
    },

    async getBulkEngagementScores(contactIds: string[]): Promise<Map<string, EngagementScore>> {
      if (contactIds.length === 0) {
        return new Map()
      }

      const sixMonthsAgo = new Date()
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

      // Batch query for all activities
      const idFilters = contactIds.map((id) => safeFilter`contactId = ${id}`)
      const filter = `(${idFilters.join(' || ')}) && created >= "${sixMonthsAgo.toISOString()}"`

      const records = await pb.collection('contact_activities').getFullList({
        filter,
        sort: '-created'
      })

      // Group by contact
      const activitiesByContact = new Map<string, ContactActivity[]>()
      for (const id of contactIds) {
        activitiesByContact.set(id, [])
      }

      for (const record of records) {
        const contactId = record.contactId as string
        const activities = activitiesByContact.get(contactId)
        if (activities) {
          activities.push({
            id: record.id,
            contactId,
            eventId: record.eventId as string | undefined,
            editionId: record.editionId as string | undefined,
            type: record.type as ActivityType,
            description: record.description as string,
            metadata: record.metadata as Record<string, unknown> | undefined,
            createdAt: new Date(record.created as string)
          })
        }
      }

      // Calculate scores
      const scores = new Map<string, EngagementScore>()
      for (const [contactId, activities] of activitiesByContact) {
        const score = calculateEngagementScore(activities)
        score.contactId = contactId
        scores.set(contactId, score)
      }

      return scores
    }
  }
}
