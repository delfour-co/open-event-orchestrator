/**
 * Suppression List Service
 *
 * Manages the email suppression list, including:
 * - Checking if emails should be suppressed before sending
 * - Adding entries automatically (bounces, complaints) or manually
 * - Import/export functionality
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  SUPPRESSION_CONFIG,
  formatSuppressionCsv,
  normalizeEmail,
  parseSuppressionCsv
} from '../domain/suppression-list'
import type {
  CreateSuppressionEntry,
  SuppressionCheckResult,
  SuppressionEntry,
  SuppressionImportResult,
  SuppressionReason
} from '../domain/suppression-list'

/**
 * Build a scope filter for suppression queries
 */
function buildScopeFilter(scope?: { organizationId?: string; eventId?: string }): string {
  let scopeFilter = 'organizationId = "" && eventId = ""'
  if (scope?.organizationId) {
    scopeFilter = `(${scopeFilter} || organizationId = "${scope.organizationId}")`
  }
  if (scope?.eventId) {
    scopeFilter = `(${scopeFilter} || eventId = "${scope.eventId}")`
  }
  return scopeFilter
}

export interface SuppressionListService {
  /**
   * Check if an email is suppressed
   */
  isEmailSuppressed(
    email: string,
    scope?: { organizationId?: string; eventId?: string }
  ): Promise<SuppressionCheckResult>

  /**
   * Check multiple emails and return suppressed ones
   */
  filterSuppressed(
    emails: string[],
    scope?: { organizationId?: string; eventId?: string }
  ): Promise<string[]>

  /**
   * Add an email to the suppression list
   */
  addEntry(entry: CreateSuppressionEntry): Promise<SuppressionEntry>

  /**
   * Remove an email from the suppression list
   */
  removeEntry(
    email: string,
    scope?: { organizationId?: string; eventId?: string }
  ): Promise<boolean>

  /**
   * Get suppression list entries
   */
  getEntries(options?: {
    organizationId?: string
    eventId?: string
    reason?: SuppressionReason
    page?: number
    perPage?: number
  }): Promise<{ entries: SuppressionEntry[]; total: number }>

  /**
   * Import emails from CSV
   */
  importCsv(
    content: string,
    options: {
      reason?: SuppressionReason
      source?: string
      organizationId?: string
      eventId?: string
      createdBy?: string
    }
  ): Promise<SuppressionImportResult>

  /**
   * Export suppression list as CSV
   */
  exportCsv(scope?: { organizationId?: string; eventId?: string }): Promise<string>

  /**
   * Process a bounce event and update suppression list if needed
   */
  processBounce(
    contactId: string,
    email: string,
    bounceType: 'hard' | 'soft',
    campaignId?: string
  ): Promise<boolean>
}

export function createSuppressionListService(pb: PocketBase): SuppressionListService {
  return {
    async isEmailSuppressed(
      email: string,
      scope?: { organizationId?: string; eventId?: string }
    ): Promise<SuppressionCheckResult> {
      const normalizedEmail = normalizeEmail(email)
      const scopeFilter = buildScopeFilter(scope)

      try {
        const records = await pb.collection('suppression_list').getList(1, 1, {
          filter: `email = "${normalizedEmail}" && (${scopeFilter})`
        })

        if (records.items.length > 0) {
          const record = records.items[0]
          return {
            isSuppressed: true,
            entry: {
              id: record.id,
              email: record.email as string,
              reason: record.reason as SuppressionReason,
              source: record.source as string | undefined,
              note: record.note as string | undefined,
              organizationId: record.organizationId as string | undefined,
              eventId: record.eventId as string | undefined,
              createdAt: new Date(record.created as string),
              createdBy: record.createdBy as string | undefined
            },
            reason: `Email suppressed: ${record.reason}`
          }
        }

        return { isSuppressed: false }
      } catch {
        // If collection doesn't exist yet, not suppressed
        return { isSuppressed: false }
      }
    },

    async filterSuppressed(
      emails: string[],
      scope?: { organizationId?: string; eventId?: string }
    ): Promise<string[]> {
      if (emails.length === 0) return []

      const normalizedEmails = emails.map(normalizeEmail)
      const scopeFilter = buildScopeFilter(scope)
      const suppressed: string[] = []
      const batchSize = 100

      for (let i = 0; i < normalizedEmails.length; i += batchSize) {
        const batch = normalizedEmails.slice(i, i + batchSize)
        const emailFilter = batch.map((e) => `email = "${e}"`).join(' || ')

        try {
          const records = await pb.collection('suppression_list').getFullList({
            filter: `(${emailFilter}) && (${scopeFilter})`
          })
          for (const record of records) {
            suppressed.push(record.email as string)
          }
        } catch {
          // If collection doesn't exist, no suppressions
        }
      }

      return suppressed
    },

    async addEntry(entry: CreateSuppressionEntry): Promise<SuppressionEntry> {
      const normalizedEmail = normalizeEmail(entry.email)

      // Check if already exists
      const existing = await this.isEmailSuppressed(normalizedEmail, {
        organizationId: entry.organizationId,
        eventId: entry.eventId
      })

      if (existing.isSuppressed && existing.entry) {
        return existing.entry
      }

      const record = await pb.collection('suppression_list').create({
        email: normalizedEmail,
        reason: entry.reason,
        source: entry.source,
        note: entry.note,
        organizationId: entry.organizationId || '',
        eventId: entry.eventId || '',
        createdBy: entry.createdBy || ''
      })

      return {
        id: record.id,
        email: record.email as string,
        reason: record.reason as SuppressionReason,
        source: record.source as string | undefined,
        note: record.note as string | undefined,
        organizationId: record.organizationId as string | undefined,
        eventId: record.eventId as string | undefined,
        createdAt: new Date(record.created as string),
        createdBy: record.createdBy as string | undefined
      }
    },

    async removeEntry(
      email: string,
      scope?: { organizationId?: string; eventId?: string }
    ): Promise<boolean> {
      const normalizedEmail = normalizeEmail(email)

      try {
        let filter = safeFilter`email = ${normalizedEmail}`
        if (scope?.organizationId) {
          filter += safeFilter` && organizationId = ${scope.organizationId}`
        }
        if (scope?.eventId) {
          filter += safeFilter` && eventId = ${scope.eventId}`
        }

        const records = await pb.collection('suppression_list').getFullList({ filter })

        for (const record of records) {
          await pb.collection('suppression_list').delete(record.id)
        }

        return records.length > 0
      } catch {
        return false
      }
    },

    async getEntries(options?: {
      organizationId?: string
      eventId?: string
      reason?: SuppressionReason
      page?: number
      perPage?: number
    }): Promise<{ entries: SuppressionEntry[]; total: number }> {
      const page = options?.page ?? 1
      const perPage = options?.perPage ?? 50

      const filters: string[] = []
      if (options?.organizationId) {
        filters.push(safeFilter`organizationId = ${options.organizationId}`)
      }
      if (options?.eventId) {
        filters.push(safeFilter`eventId = ${options.eventId}`)
      }
      if (options?.reason) {
        filters.push(safeFilter`reason = ${options.reason}`)
      }

      const filter = filters.length > 0 ? filters.join(' && ') : undefined

      const records = await pb.collection('suppression_list').getList(page, perPage, {
        filter,
        sort: '-created'
      })

      const entries: SuppressionEntry[] = records.items.map((record) => ({
        id: record.id,
        email: record.email as string,
        reason: record.reason as SuppressionReason,
        source: record.source as string | undefined,
        note: record.note as string | undefined,
        organizationId: record.organizationId as string | undefined,
        eventId: record.eventId as string | undefined,
        createdAt: new Date(record.created as string),
        createdBy: record.createdBy as string | undefined
      }))

      return { entries, total: records.totalItems }
    },

    async importCsv(
      content: string,
      options: {
        reason?: SuppressionReason
        source?: string
        organizationId?: string
        eventId?: string
        createdBy?: string
      }
    ): Promise<SuppressionImportResult> {
      const { emails, errors } = parseSuppressionCsv(content)
      const reason = options.reason ?? 'manual'

      let added = 0
      let duplicates = 0

      for (const email of emails) {
        const existing = await this.isEmailSuppressed(email, {
          organizationId: options.organizationId,
          eventId: options.eventId
        })

        if (existing.isSuppressed) {
          duplicates++
        } else {
          await this.addEntry({
            email,
            reason,
            source: options.source ?? 'csv_import',
            organizationId: options.organizationId,
            eventId: options.eventId,
            createdBy: options.createdBy
          })
          added++
        }
      }

      return {
        total: emails.length + errors.length,
        added,
        duplicates,
        invalid: errors.length,
        errors
      }
    },

    async exportCsv(scope?: { organizationId?: string; eventId?: string }): Promise<string> {
      const filters: string[] = []
      if (scope?.organizationId) {
        filters.push(safeFilter`organizationId = ${scope.organizationId}`)
      }
      if (scope?.eventId) {
        filters.push(safeFilter`eventId = ${scope.eventId}`)
      }

      const filter = filters.length > 0 ? filters.join(' && ') : undefined

      const records = await pb.collection('suppression_list').getFullList({
        filter,
        sort: '-created'
      })

      const entries: SuppressionEntry[] = records.map((record) => ({
        id: record.id,
        email: record.email as string,
        reason: record.reason as SuppressionReason,
        source: record.source as string | undefined,
        note: record.note as string | undefined,
        organizationId: record.organizationId as string | undefined,
        eventId: record.eventId as string | undefined,
        createdAt: new Date(record.created as string),
        createdBy: record.createdBy as string | undefined
      }))

      return formatSuppressionCsv(entries)
    },

    async processBounce(
      contactId: string,
      email: string,
      bounceType: 'hard' | 'soft',
      campaignId?: string
    ): Promise<boolean> {
      // Get current contact bounce counts
      const contact = await pb.collection('contacts').getOne(contactId)
      const hardBounces =
        ((contact.hardBounceCount as number) || 0) + (bounceType === 'hard' ? 1 : 0)
      const softBounces =
        ((contact.softBounceCount as number) || 0) + (bounceType === 'soft' ? 1 : 0)

      // Update contact with new counts
      await pb.collection('contacts').update(contactId, {
        hardBounceCount: hardBounces,
        softBounceCount: softBounces,
        lastBounceAt: new Date().toISOString()
      })

      // Check if should suppress
      const shouldSuppress =
        hardBounces >= SUPPRESSION_CONFIG.HARD_BOUNCE_THRESHOLD ||
        softBounces >= SUPPRESSION_CONFIG.SOFT_BOUNCE_THRESHOLD

      if (shouldSuppress) {
        const reason: SuppressionReason =
          hardBounces >= SUPPRESSION_CONFIG.HARD_BOUNCE_THRESHOLD
            ? 'hard_bounce'
            : 'soft_bounce_limit'

        // Add to suppression list
        await this.addEntry({
          email,
          reason,
          source: campaignId,
          note: `Auto-suppressed after ${hardBounces} hard bounces and ${softBounces} soft bounces`
        })

        // Mark contact as suppressed
        await pb.collection('contacts').update(contactId, {
          isSuppressed: true
        })

        return true
      }

      return false
    }
  }
}
