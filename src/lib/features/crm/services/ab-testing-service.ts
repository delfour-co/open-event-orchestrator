/**
 * A/B Testing Service
 *
 * Manages A/B test campaigns, variants, and result analysis.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type AbTestCampaign,
  type AbTestResults,
  type AbTestStatus,
  type AbTestVariant,
  type CreateAbTestCampaign,
  type CreateAbTestVariant,
  type UpdateAbTestVariant,
  type VariantName,
  type WinnerCriteria,
  buildVariantStats,
  canStartTest,
  determineWinner,
  isTestDurationElapsed
} from '../domain/ab-testing'

export interface AbTestingService {
  createTest(input: CreateAbTestCampaign): Promise<AbTestCampaign>
  updateTest(
    id: string,
    updates: Partial<
      Pick<AbTestCampaign, 'name' | 'segmentId' | 'testPercentage' | 'testDurationHours'>
    >
  ): Promise<AbTestCampaign>
  deleteTest(id: string): Promise<void>
  getTest(id: string): Promise<AbTestCampaign | null>
  getTestsByEvent(eventId: string, status?: AbTestStatus): Promise<AbTestCampaign[]>

  createVariant(input: CreateAbTestVariant): Promise<AbTestVariant>
  updateVariant(id: string, updates: UpdateAbTestVariant): Promise<AbTestVariant>
  deleteVariant(id: string): Promise<void>
  getVariants(testId: string): Promise<AbTestVariant[]>

  startTest(testId: string, totalRecipients: number): Promise<{ success: boolean; error?: string }>
  selectWinner(testId: string, variantId: string): Promise<{ success: boolean; error?: string }>
  cancelTest(testId: string): Promise<void>
  completeTest(testId: string): Promise<void>

  getResults(testId: string): Promise<AbTestResults | null>
  checkAndSelectWinner(testId: string): Promise<{ selected: boolean; variantId?: string }>
  updateVariantStats(
    variantId: string,
    stats: Partial<
      Pick<
        AbTestVariant,
        'sentCount' | 'deliveredCount' | 'openedCount' | 'clickedCount' | 'bouncedCount'
      >
    >
  ): Promise<void>
}

export function createAbTestingService(pb: PocketBase): AbTestingService {
  async function getTestRecord(testId: string): Promise<AbTestCampaign | null> {
    try {
      const record = await pb.collection('ab_test_campaigns').getOne(testId)
      return mapRecordToTest(record)
    } catch {
      return null
    }
  }

  return {
    async createTest(input: CreateAbTestCampaign): Promise<AbTestCampaign> {
      const record = await pb.collection('ab_test_campaigns').create({
        eventId: input.eventId,
        editionId: input.editionId || '',
        name: input.name,
        segmentId: input.segmentId || '',
        testVariable: input.testVariable,
        winnerCriteria: input.winnerCriteria,
        testPercentage: input.testPercentage || 20,
        testDurationHours: input.testDurationHours || 24,
        status: 'draft',
        totalRecipients: 0,
        createdBy: input.createdBy || ''
      })

      return mapRecordToTest(record)
    },

    async updateTest(
      id: string,
      updates: Partial<
        Pick<AbTestCampaign, 'name' | 'segmentId' | 'testPercentage' | 'testDurationHours'>
      >
    ): Promise<AbTestCampaign> {
      const record = await pb.collection('ab_test_campaigns').update(id, updates)
      return mapRecordToTest(record)
    },

    async deleteTest(id: string): Promise<void> {
      await pb.collection('ab_test_campaigns').delete(id)
    },

    async getTest(id: string): Promise<AbTestCampaign | null> {
      return getTestRecord(id)
    },

    async getTestsByEvent(eventId: string, status?: AbTestStatus): Promise<AbTestCampaign[]> {
      const filters = [safeFilter`eventId = ${eventId}`]
      if (status) {
        filters.push(safeFilter`status = ${status}`)
      }

      const records = await pb.collection('ab_test_campaigns').getFullList({
        filter: filters.join(' && '),
        sort: '-created'
      })

      return records.map(mapRecordToTest)
    },

    async createVariant(input: CreateAbTestVariant): Promise<AbTestVariant> {
      const record = await pb.collection('ab_test_variants').create({
        testId: input.testId,
        name: input.name,
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent || '',
        senderName: input.senderName || '',
        scheduledAt: input.scheduledAt?.toISOString() || null,
        recipientCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        isWinner: false
      })

      return mapRecordToVariant(record)
    },

    async updateVariant(id: string, updates: UpdateAbTestVariant): Promise<AbTestVariant> {
      const data: Record<string, unknown> = {}
      if (updates.subject !== undefined) data.subject = updates.subject
      if (updates.htmlContent !== undefined) data.htmlContent = updates.htmlContent
      if (updates.textContent !== undefined) data.textContent = updates.textContent
      if (updates.senderName !== undefined) data.senderName = updates.senderName
      if (updates.scheduledAt !== undefined) {
        data.scheduledAt = updates.scheduledAt?.toISOString() || null
      }

      const record = await pb.collection('ab_test_variants').update(id, data)
      return mapRecordToVariant(record)
    },

    async deleteVariant(id: string): Promise<void> {
      await pb.collection('ab_test_variants').delete(id)
    },

    async getVariants(testId: string): Promise<AbTestVariant[]> {
      const records = await pb.collection('ab_test_variants').getFullList({
        filter: safeFilter`testId = ${testId}`,
        sort: 'name'
      })

      return records.map(mapRecordToVariant)
    },

    async startTest(
      testId: string,
      totalRecipients: number
    ): Promise<{ success: boolean; error?: string }> {
      const test = await getTestRecord(testId)
      if (!test) {
        return { success: false, error: 'Test not found' }
      }

      const variants = await this.getVariants(testId)
      const canStart = canStartTest({ ...test, totalRecipients }, variants.length)

      if (!canStart.can) {
        return { success: false, error: canStart.reason }
      }

      await pb.collection('ab_test_campaigns').update(testId, {
        status: 'testing',
        totalRecipients,
        testStartedAt: new Date().toISOString()
      })

      return { success: true }
    },

    async selectWinner(
      testId: string,
      variantId: string
    ): Promise<{ success: boolean; error?: string }> {
      const test = await getTestRecord(testId)
      if (!test) {
        return { success: false, error: 'Test not found' }
      }

      if (test.status !== 'testing') {
        return { success: false, error: 'Test must be in testing status' }
      }

      const variants = await this.getVariants(testId)
      for (const variant of variants) {
        await pb.collection('ab_test_variants').update(variant.id, {
          isWinner: variant.id === variantId
        })
      }

      await pb.collection('ab_test_campaigns').update(testId, {
        status: 'winner_selected',
        winnerVariantId: variantId,
        winnerSelectedAt: new Date().toISOString()
      })

      return { success: true }
    },

    async cancelTest(testId: string): Promise<void> {
      await pb.collection('ab_test_campaigns').update(testId, {
        status: 'cancelled'
      })
    },

    async completeTest(testId: string): Promise<void> {
      await pb.collection('ab_test_campaigns').update(testId, {
        status: 'completed',
        testEndedAt: new Date().toISOString()
      })
    },

    async getResults(testId: string): Promise<AbTestResults | null> {
      const test = await getTestRecord(testId)
      if (!test) return null

      const variants = await this.getVariants(testId)
      const variantStats = variants.map(buildVariantStats)

      const testDuration = test.testStartedAt
        ? (new Date().getTime() - test.testStartedAt.getTime()) / (1000 * 60 * 60)
        : 0

      return {
        testId,
        status: test.status,
        winnerVariantId: test.winnerVariantId,
        variants: variantStats,
        testDuration: Math.round(testDuration * 10) / 10,
        totalRecipients: test.totalRecipients
      }
    },

    async checkAndSelectWinner(testId: string): Promise<{ selected: boolean; variantId?: string }> {
      const test = await getTestRecord(testId)
      if (!test || test.status !== 'testing') {
        return { selected: false }
      }

      if (!test.testStartedAt) {
        return { selected: false }
      }

      if (!isTestDurationElapsed(test.testStartedAt, test.testDurationHours)) {
        return { selected: false }
      }

      const variants = await this.getVariants(testId)
      const variantStats = variants.map(buildVariantStats)
      const winner = determineWinner(variantStats, test.winnerCriteria)

      if (!winner) {
        return { selected: false }
      }

      await this.selectWinner(testId, winner.variantId)
      return { selected: true, variantId: winner.variantId }
    },

    async updateVariantStats(
      variantId: string,
      stats: Partial<
        Pick<
          AbTestVariant,
          'sentCount' | 'deliveredCount' | 'openedCount' | 'clickedCount' | 'bouncedCount'
        >
      >
    ): Promise<void> {
      await pb.collection('ab_test_variants').update(variantId, stats)
    }
  }
}

function mapRecordToTest(record: Record<string, unknown>): AbTestCampaign {
  return {
    id: record.id as string,
    eventId: record.eventId as string,
    editionId: (record.editionId as string) || undefined,
    name: record.name as string,
    segmentId: (record.segmentId as string) || undefined,
    testVariable: record.testVariable as AbTestCampaign['testVariable'],
    winnerCriteria: record.winnerCriteria as WinnerCriteria,
    testPercentage: (record.testPercentage as number) || 20,
    testDurationHours: (record.testDurationHours as number) || 24,
    status: (record.status as AbTestStatus) || 'draft',
    winnerVariantId: (record.winnerVariantId as string) || undefined,
    winnerSelectedAt: record.winnerSelectedAt
      ? new Date(record.winnerSelectedAt as string)
      : undefined,
    testStartedAt: record.testStartedAt ? new Date(record.testStartedAt as string) : undefined,
    testEndedAt: record.testEndedAt ? new Date(record.testEndedAt as string) : undefined,
    totalRecipients: (record.totalRecipients as number) || 0,
    createdBy: (record.createdBy as string) || undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

function mapRecordToVariant(record: Record<string, unknown>): AbTestVariant {
  return {
    id: record.id as string,
    testId: record.testId as string,
    name: record.name as VariantName,
    subject: record.subject as string,
    htmlContent: record.htmlContent as string,
    textContent: (record.textContent as string) || undefined,
    senderName: (record.senderName as string) || undefined,
    scheduledAt: record.scheduledAt ? new Date(record.scheduledAt as string) : undefined,
    recipientCount: (record.recipientCount as number) || 0,
    sentCount: (record.sentCount as number) || 0,
    deliveredCount: (record.deliveredCount as number) || 0,
    openedCount: (record.openedCount as number) || 0,
    clickedCount: (record.clickedCount as number) || 0,
    bouncedCount: (record.bouncedCount as number) || 0,
    isWinner: (record.isWinner as boolean) || false,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}
