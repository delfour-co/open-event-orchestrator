/**
 * Contact Deduplication Service
 *
 * Handles duplicate detection, comparison, and merging of contacts.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  CONFIDENCE_THRESHOLDS,
  CONTACT_COMPARE_FIELDS,
  type ContactComparison,
  type DuplicateMatchType,
  type DuplicatePair,
  type DuplicateStatus,
  type MergeDecision,
  type MergeResult,
  buildContactComparison,
  calculateDuplicateConfidence,
  mergeArrays
} from '../domain/contact-deduplication'

export interface DuplicateScanResult {
  scannedContacts: number
  duplicatesFound: number
  newPairs: number
}

export interface ContactDeduplicationService {
  scanForDuplicates(eventId: string): Promise<DuplicateScanResult>
  getDuplicatePairs(
    eventId: string,
    options?: { status?: DuplicateStatus; minConfidence?: number; page?: number; perPage?: number }
  ): Promise<{ pairs: DuplicatePair[]; total: number }>
  getDuplicatePair(pairId: string): Promise<DuplicatePair | null>
  compareContacts(contactId1: string, contactId2: string): Promise<ContactComparison>
  mergeContacts(
    survivorId: string,
    mergedId: string,
    decisions: MergeDecision[],
    userId: string
  ): Promise<MergeResult>
  undoMerge(mergeHistoryId: string, userId: string): Promise<MergeResult>
  dismissDuplicate(pairId: string, userId: string): Promise<void>
  bulkMergeExactDuplicates(
    eventId: string,
    userId: string
  ): Promise<{ merged: number; errors: number }>
}

export function createContactDeduplicationService(pb: PocketBase): ContactDeduplicationService {
  async function getContact(contactId: string): Promise<Record<string, unknown> | null> {
    try {
      return await pb.collection('contacts').getOne(contactId)
    } catch {
      return null
    }
  }

  async function findExistingPair(
    contactId1: string,
    contactId2: string
  ): Promise<DuplicatePair | null> {
    try {
      const filter1 = safeFilter`(contactId1 = ${contactId1} && contactId2 = ${contactId2})`
      const filter2 = safeFilter`(contactId1 = ${contactId2} && contactId2 = ${contactId1})`
      const records = await pb.collection('duplicate_pairs').getList(1, 1, {
        filter: `${filter1} || ${filter2}`
      })
      if (records.items.length === 0) return null
      return mapRecordToPair(records.items[0])
    } catch {
      return null
    }
  }

  async function processDuplicatePair(
    eventId: string,
    contact1: Record<string, unknown>,
    contact2: Record<string, unknown>
  ): Promise<boolean> {
    const { score, matchType } = calculateDuplicateConfidence(
      (contact1.email as string) || '',
      (contact2.email as string) || '',
      (contact1.firstName as string) || '',
      (contact1.lastName as string) || '',
      (contact2.firstName as string) || '',
      (contact2.lastName as string) || ''
    )

    if (score < CONFIDENCE_THRESHOLDS.medium) {
      return false
    }

    const existingPair = await findExistingPair(contact1.id as string, contact2.id as string)
    if (existingPair) {
      return false
    }

    await createDuplicatePair(
      eventId,
      contact1.id as string,
      contact2.id as string,
      matchType,
      score
    )
    return true
  }

  async function applyMergeDecisions(
    survivor: Record<string, unknown>,
    merged: Record<string, unknown>,
    decisions: MergeDecision[]
  ): Promise<Record<string, unknown>> {
    const updateData: Record<string, unknown> = {}

    for (const decision of decisions) {
      if (decision.source === 'contact1') {
        updateData[decision.fieldName] = survivor[decision.fieldName]
      } else if (decision.source === 'contact2') {
        updateData[decision.fieldName] = merged[decision.fieldName]
      } else if (decision.source === 'combined' && decision.customValue) {
        updateData[decision.fieldName] = decision.customValue
      }
    }

    const survivorTags = (survivor.tags as string[]) || []
    const mergedTags = (merged.tags as string[]) || []
    updateData.tags = mergeArrays(survivorTags, mergedTags)

    const survivorSegments = (survivor.segments as string[]) || []
    const mergedSegments = (merged.segments as string[]) || []
    updateData.segments = mergeArrays(survivorSegments, mergedSegments)

    return updateData
  }

  async function createDuplicatePair(
    eventId: string,
    contactId1: string,
    contactId2: string,
    matchType: DuplicateMatchType,
    confidenceScore: number
  ): Promise<void> {
    const [id1, id2] = [contactId1, contactId2].sort()

    await pb.collection('duplicate_pairs').create({
      eventId,
      contactId1: id1,
      contactId2: id2,
      matchType,
      confidenceScore,
      status: 'pending'
    })
  }

  return {
    async scanForDuplicates(eventId: string): Promise<DuplicateScanResult> {
      const contacts = await pb.collection('contacts').getFullList({
        filter: safeFilter`eventId = ${eventId}`,
        fields: 'id,email,firstName,lastName'
      })

      let duplicatesFound = 0
      let newPairs = 0

      for (let i = 0; i < contacts.length; i++) {
        for (let j = i + 1; j < contacts.length; j++) {
          const { score } = calculateDuplicateConfidence(
            (contacts[i].email as string) || '',
            (contacts[j].email as string) || '',
            (contacts[i].firstName as string) || '',
            (contacts[i].lastName as string) || '',
            (contacts[j].firstName as string) || '',
            (contacts[j].lastName as string) || ''
          )

          if (score >= CONFIDENCE_THRESHOLDS.medium) {
            duplicatesFound++
            const isNew = await processDuplicatePair(eventId, contacts[i], contacts[j])
            if (isNew) newPairs++
          }
        }
      }

      return { scannedContacts: contacts.length, duplicatesFound, newPairs }
    },

    async getDuplicatePairs(
      eventId: string,
      options: {
        status?: DuplicateStatus
        minConfidence?: number
        page?: number
        perPage?: number
      } = {}
    ): Promise<{ pairs: DuplicatePair[]; total: number }> {
      const { status, minConfidence = 0, page = 1, perPage = 20 } = options

      const filters = [safeFilter`eventId = ${eventId}`]
      if (status) {
        filters.push(safeFilter`status = ${status}`)
      }
      if (minConfidence > 0) {
        filters.push(`confidenceScore >= ${minConfidence}`)
      }

      const records = await pb.collection('duplicate_pairs').getList(page, perPage, {
        filter: filters.join(' && '),
        sort: '-confidenceScore,-created'
      })

      return {
        pairs: records.items.map(mapRecordToPair),
        total: records.totalItems
      }
    },

    async getDuplicatePair(pairId: string): Promise<DuplicatePair | null> {
      try {
        const record = await pb.collection('duplicate_pairs').getOne(pairId)
        return mapRecordToPair(record)
      } catch {
        return null
      }
    },

    async compareContacts(contactId1: string, contactId2: string): Promise<ContactComparison> {
      const contact1 = await getContact(contactId1)
      const contact2 = await getContact(contactId2)

      if (!contact1 || !contact2) {
        throw new Error('One or both contacts not found')
      }

      return buildContactComparison(contact1, contact2, [...CONTACT_COMPARE_FIELDS])
    },

    async mergeContacts(
      survivorId: string,
      mergedId: string,
      decisions: MergeDecision[],
      userId: string
    ): Promise<MergeResult> {
      try {
        const survivor = await getContact(survivorId)
        const merged = await getContact(mergedId)

        if (!survivor || !merged) {
          return { success: false, error: 'One or both contacts not found' }
        }

        const updateData = await applyMergeDecisions(survivor, merged, decisions)
        await pb.collection('contacts').update(survivorId, updateData)

        await pb.collection('contact_merge_history').create({
          eventId: survivor.eventId,
          survivorContactId: survivorId,
          mergedContactId: mergedId,
          survivorData: survivor,
          mergedData: merged,
          mergeDecisions: decisions,
          mergedBy: userId,
          undone: false
        })

        await pb.collection('contacts').delete(mergedId)

        const existingPair = await findExistingPair(survivorId, mergedId)
        if (existingPair) {
          await pb.collection('duplicate_pairs').update(existingPair.id, {
            status: 'merged',
            mergedContactId: survivorId
          })
        }

        return { success: true, mergedContactId: survivorId, deletedContactId: mergedId }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to merge contacts'
        }
      }
    },

    async undoMerge(mergeHistoryId: string, userId: string): Promise<MergeResult> {
      try {
        const history = await pb.collection('contact_merge_history').getOne(mergeHistoryId)

        if (history.undone) {
          return { success: false, error: 'Merge has already been undone' }
        }

        const mergedData = history.mergedData as Record<string, unknown>

        const recreatedContact = await pb.collection('contacts').create({
          ...mergedData,
          id: undefined
        })

        const survivorData = history.survivorData as Record<string, unknown>
        await pb.collection('contacts').update(history.survivorContactId as string, survivorData)

        await pb.collection('contact_merge_history').update(mergeHistoryId, {
          undone: true,
          undoneAt: new Date().toISOString(),
          undoneBy: userId
        })

        const existingPair = await findExistingPair(
          history.survivorContactId as string,
          recreatedContact.id
        )
        if (existingPair) {
          await pb.collection('duplicate_pairs').update(existingPair.id, {
            status: 'pending',
            mergedContactId: null
          })
        }

        return {
          success: true,
          mergedContactId: history.survivorContactId as string,
          deletedContactId: recreatedContact.id
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to undo merge'
        }
      }
    },

    async dismissDuplicate(pairId: string, userId: string): Promise<void> {
      await pb.collection('duplicate_pairs').update(pairId, {
        status: 'dismissed',
        dismissedBy: userId,
        dismissedAt: new Date().toISOString()
      })
    },

    async bulkMergeExactDuplicates(
      eventId: string,
      userId: string
    ): Promise<{ merged: number; errors: number }> {
      const { pairs } = await this.getDuplicatePairs(eventId, {
        status: 'pending',
        minConfidence: 100
      })

      let merged = 0
      let errors = 0

      for (const pair of pairs) {
        const comparison = await this.compareContacts(pair.contactId1, pair.contactId2)

        const decisions: MergeDecision[] = comparison.fields.map((field) => ({
          fieldName: field.fieldName,
          source: field.suggestedSource
        }))

        const result = await this.mergeContacts(pair.contactId1, pair.contactId2, decisions, userId)

        if (result.success) {
          merged++
        } else {
          errors++
        }
      }

      return { merged, errors }
    }
  }
}

function mapRecordToPair(record: Record<string, unknown>): DuplicatePair {
  return {
    id: record.id as string,
    eventId: record.eventId as string,
    contactId1: record.contactId1 as string,
    contactId2: record.contactId2 as string,
    matchType: record.matchType as DuplicateMatchType,
    confidenceScore: record.confidenceScore as number,
    status: (record.status as DuplicateStatus) || 'pending',
    mergedContactId: record.mergedContactId as string | undefined,
    dismissedBy: record.dismissedBy as string | undefined,
    dismissedAt: record.dismissedAt ? new Date(record.dismissedAt as string) : undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}
