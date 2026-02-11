import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { Segment } from '../domain'
import {
  type MembershipChange,
  type SegmentMembership,
  calculateMembershipChanges
} from '../domain/segment-membership'
import { createEvaluateSegmentUseCase } from '../usecases/evaluate-segment'

export interface SegmentSyncResult {
  segmentId: string
  previousCount: number
  currentCount: number
  joined: number
  left: number
  changes: MembershipChange[]
}

/**
 * Service for synchronizing segment memberships
 */
export function createSegmentSyncService(pb: PocketBase) {
  const evaluateSegment = createEvaluateSegmentUseCase(pb)

  return {
    /**
     * Sync a single segment's memberships
     */
    async syncSegment(segment: Segment): Promise<SegmentSyncResult> {
      // Get current members from evaluation
      const currentContactIds = await evaluateSegment(segment)
      const currentSet = new Set(currentContactIds)

      // Get previous active memberships
      const previousMemberships = await pb.collection('segment_memberships').getFullList({
        filter: safeFilter`segmentId = ${segment.id} && isActive = ${true}`,
        fields: 'id,contactId'
      })
      const previousSet = new Set(previousMemberships.map((m) => m.contactId as string))

      // Calculate changes
      const changes = calculateMembershipChanges(segment.id, previousSet, currentSet)

      // Apply changes
      for (const change of changes) {
        if (change.changeType === 'joined') {
          // Create new membership
          await pb.collection('segment_memberships').create({
            segmentId: segment.id,
            contactId: change.contactId,
            joinedAt: change.timestamp.toISOString(),
            isActive: true
          })
        } else {
          // Mark existing membership as inactive
          const membership = previousMemberships.find(
            (m) => (m.contactId as string) === change.contactId
          )
          if (membership) {
            await pb.collection('segment_memberships').update(membership.id, {
              leftAt: change.timestamp.toISOString(),
              isActive: false
            })
          }
        }
      }

      // Update segment contact count
      await pb.collection('segments').update(segment.id, {
        contactCount: currentSet.size
      })

      return {
        segmentId: segment.id,
        previousCount: previousSet.size,
        currentCount: currentSet.size,
        joined: changes.filter((c) => c.changeType === 'joined').length,
        left: changes.filter((c) => c.changeType === 'left').length,
        changes
      }
    },

    /**
     * Sync all dynamic segments for an event
     */
    async syncEventSegments(eventId: string): Promise<SegmentSyncResult[]> {
      const segments = await pb.collection('segments').getFullList({
        filter: safeFilter`eventId = ${eventId} && isStatic = ${false}`
      })

      const results: SegmentSyncResult[] = []
      for (const segmentRecord of segments) {
        const segment: Segment = {
          id: segmentRecord.id,
          eventId: segmentRecord.eventId as string,
          editionId: segmentRecord.editionId as string | undefined,
          name: segmentRecord.name as string,
          description: segmentRecord.description as string | undefined,
          criteria: segmentRecord.criteria as Segment['criteria'],
          isStatic: segmentRecord.isStatic as boolean,
          contactCount: segmentRecord.contactCount as number,
          createdAt: new Date(segmentRecord.created as string),
          updatedAt: new Date(segmentRecord.updated as string)
        }

        try {
          const result = await this.syncSegment(segment)
          results.push(result)
        } catch (err) {
          console.error(`Failed to sync segment ${segment.id}:`, err)
        }
      }

      return results
    },

    /**
     * Get current members of a segment
     */
    async getSegmentMembers(segmentId: string): Promise<string[]> {
      const memberships = await pb.collection('segment_memberships').getFullList({
        filter: safeFilter`segmentId = ${segmentId} && isActive = ${true}`,
        fields: 'contactId'
      })
      return memberships.map((m) => m.contactId as string)
    },

    /**
     * Get membership history for a segment
     */
    async getSegmentHistory(segmentId: string, limit = 100): Promise<SegmentMembership[]> {
      const records = await pb.collection('segment_memberships').getList(1, limit, {
        filter: safeFilter`segmentId = ${segmentId}`,
        sort: '-created'
      })

      return records.items.map((r) => ({
        id: r.id,
        segmentId: r.segmentId as string,
        contactId: r.contactId as string,
        joinedAt: new Date(r.joinedAt as string),
        leftAt: r.leftAt ? new Date(r.leftAt as string) : undefined,
        isActive: r.isActive as boolean
      }))
    },

    /**
     * Get segments a contact belongs to
     */
    async getContactSegments(contactId: string): Promise<string[]> {
      const memberships = await pb.collection('segment_memberships').getFullList({
        filter: safeFilter`contactId = ${contactId} && isActive = ${true}`,
        fields: 'segmentId'
      })
      return memberships.map((m) => m.segmentId as string)
    },

    /**
     * Check if a contact is in a segment
     */
    async isContactInSegment(contactId: string, segmentId: string): Promise<boolean> {
      const memberships = await pb.collection('segment_memberships').getList(1, 1, {
        filter: safeFilter`contactId = ${contactId} && segmentId = ${segmentId} && isActive = ${true}`
      })
      return memberships.items.length > 0
    }
  }
}

export type SegmentSyncService = ReturnType<typeof createSegmentSyncService>
