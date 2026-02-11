/**
 * GDPR Compliance Service
 *
 * Provides double opt-in flow, consent audit trail, data export,
 * data deletion, and retention policy management.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type AuditSource,
  type CommunicationFrequency,
  type CommunicationPreferences,
  type CommunicationType,
  type ConsentAuditAction,
  type ConsentAuditLog,
  type CreateConsentAuditLog,
  type DataRetentionPolicy,
  type EmailStatus,
  GDPR_CONFIG,
  type GdprDataExport,
  type UpdateCommunicationPreferences,
  generateConfirmationToken,
  generatePreferenceToken,
  isTokenExpired,
  shouldSendReminder
} from '../domain/gdpr-compliance'

export interface DoubleOptInResult {
  success: boolean
  contactId: string
  confirmationToken?: string
  confirmationUrl?: string
  error?: string
}

export interface ConfirmationResult {
  success: boolean
  contactId?: string
  email?: string
  error?: string
}

export interface DataDeletionResult {
  success: boolean
  contactId: string
  deletedRecords: {
    contact: boolean
    consents: number
    activities: number
    preferences: number
    auditLogs: number
  }
  error?: string
}

export interface GdprComplianceService {
  // Double opt-in
  initiateDoubleOptIn(contactId: string, baseUrl: string): Promise<DoubleOptInResult>
  confirmEmail(token: string, ipAddress?: string): Promise<ConfirmationResult>
  sendConfirmationReminder(contactId: string, baseUrl: string): Promise<DoubleOptInResult>
  getPendingConfirmations(eventId?: string): Promise<
    Array<{
      contactId: string
      email: string
      createdAt: Date
      reminderCount: number
    }>
  >

  // Consent audit trail
  logConsentAction(entry: CreateConsentAuditLog): Promise<ConsentAuditLog>
  getAuditLog(
    contactId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ConsentAuditLog[]>

  // Communication preferences
  getPreferences(contactId: string, eventId?: string): Promise<CommunicationPreferences | null>
  updatePreferences(
    contactId: string,
    preferences: UpdateCommunicationPreferences,
    source: AuditSource,
    ipAddress?: string,
    eventId?: string
  ): Promise<CommunicationPreferences>
  getPreferencesByToken(token: string): Promise<{
    preferences: CommunicationPreferences | null
    contactId?: string
  }>

  // GDPR data rights
  exportContactData(contactId: string): Promise<GdprDataExport>
  deleteContactData(contactId: string, ipAddress?: string): Promise<DataDeletionResult>

  // Retention policies
  createRetentionPolicy(
    policy: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataRetentionPolicy>
  getRetentionPolicies(eventId?: string): Promise<DataRetentionPolicy[]>
  updateRetentionPolicy(
    id: string,
    updates: Partial<Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DataRetentionPolicy>
  getExpiredContacts(eventId?: string): Promise<
    Array<{
      contactId: string
      email: string
      dataType: string
      expiresAt: Date
    }>
  >

  // Unsubscribe (one-click, RFC 8058)
  unsubscribe(
    contactId: string,
    source: AuditSource,
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string }>
  unsubscribeByToken(
    token: string,
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string }>
}

export function createGdprComplianceService(pb: PocketBase): GdprComplianceService {
  async function getContact(contactId: string) {
    return pb.collection('contacts').getOne(contactId)
  }

  async function updateContact(contactId: string, data: Record<string, unknown>) {
    return pb.collection('contacts').update(contactId, data)
  }

  function getOrRefreshToken(
    currentToken: string | null,
    expiresAt: Date | null
  ): { token: string; expiresAt: Date } {
    if (currentToken && expiresAt && !isTokenExpired(expiresAt)) {
      return { token: currentToken, expiresAt }
    }
    return generateConfirmationToken()
  }

  return {
    async initiateDoubleOptIn(contactId: string, baseUrl: string): Promise<DoubleOptInResult> {
      try {
        // Verify contact exists (throws if not found)
        await getContact(contactId)
        const { token, expiresAt } = generateConfirmationToken()

        await updateContact(contactId, {
          emailStatus: 'pending',
          confirmationToken: token,
          confirmationExpiresAt: expiresAt.toISOString(),
          reminderCount: 0
        })

        const confirmationUrl = `${baseUrl}/confirm-email?token=${token}`

        await this.logConsentAction({
          contactId,
          action: 'granted',
          consentType: 'marketing_email',
          source: 'double_opt_in',
          metadata: { stage: 'initiated' }
        })

        return {
          success: true,
          contactId,
          confirmationToken: token,
          confirmationUrl
        }
      } catch (error) {
        return {
          success: false,
          contactId,
          error: error instanceof Error ? error.message : 'Failed to initiate double opt-in'
        }
      }
    },

    async confirmEmail(token: string, ipAddress?: string): Promise<ConfirmationResult> {
      try {
        const records = await pb.collection('contacts').getList(1, 1, {
          filter: safeFilter`confirmationToken = ${token}`
        })

        if (records.items.length === 0) {
          return { success: false, error: 'Invalid confirmation token' }
        }

        const contact = records.items[0]
        const expiresAt = contact.confirmationExpiresAt
          ? new Date(contact.confirmationExpiresAt as string)
          : null

        if (expiresAt && isTokenExpired(expiresAt)) {
          return { success: false, error: 'Confirmation token has expired' }
        }

        await updateContact(contact.id, {
          emailStatus: 'confirmed',
          confirmationToken: null,
          confirmationExpiresAt: null,
          confirmedAt: new Date().toISOString(),
          confirmationIpAddress: ipAddress || null
        })

        await this.logConsentAction({
          contactId: contact.id,
          action: 'confirmed',
          consentType: 'marketing_email',
          source: 'double_opt_in',
          ipAddress
        })

        // Ensure communication preferences exist
        await this.getPreferences(contact.id)

        return {
          success: true,
          contactId: contact.id,
          email: contact.email as string
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to confirm email'
        }
      }
    },

    async sendConfirmationReminder(contactId: string, baseUrl: string): Promise<DoubleOptInResult> {
      try {
        const contact = await getContact(contactId)
        const emailStatus = contact.emailStatus as EmailStatus | undefined
        const reminderCount = (contact.reminderCount as number) || 0
        const lastReminderSentAt = contact.lastReminderSentAt
          ? new Date(contact.lastReminderSentAt as string)
          : undefined

        if (emailStatus !== 'pending') {
          return { success: false, contactId, error: 'Contact is not pending confirmation' }
        }

        if (!shouldSendReminder(lastReminderSentAt, reminderCount)) {
          return { success: false, contactId, error: 'Cannot send reminder yet' }
        }

        const currentToken = contact.confirmationToken as string | null
        const currentExpiry = contact.confirmationExpiresAt
          ? new Date(contact.confirmationExpiresAt as string)
          : null

        const { token, expiresAt } = getOrRefreshToken(currentToken, currentExpiry)

        await updateContact(contactId, {
          confirmationToken: token,
          confirmationExpiresAt: expiresAt.toISOString(),
          lastReminderSentAt: new Date().toISOString(),
          reminderCount: reminderCount + 1
        })

        return {
          success: true,
          contactId,
          confirmationToken: token,
          confirmationUrl: `${baseUrl}/confirm-email?token=${token}`
        }
      } catch (error) {
        return {
          success: false,
          contactId,
          error: error instanceof Error ? error.message : 'Failed to send reminder'
        }
      }
    },

    async getPendingConfirmations(eventId?: string) {
      const filters = ['emailStatus = "pending"']
      if (eventId) {
        filters.push(safeFilter`eventId = ${eventId}`)
      }

      const records = await pb.collection('contacts').getFullList({
        filter: filters.join(' && '),
        sort: 'created'
      })

      return records.map((r) => ({
        contactId: r.id,
        email: r.email as string,
        createdAt: new Date(r.created as string),
        reminderCount: (r.reminderCount as number) || 0
      }))
    },

    async logConsentAction(entry: CreateConsentAuditLog): Promise<ConsentAuditLog> {
      const record = await pb.collection('consent_audit_logs').create({
        contactId: entry.contactId,
        consentId: entry.consentId || '',
        action: entry.action,
        consentType: entry.consentType || '',
        source: entry.source,
        ipAddress: entry.ipAddress || '',
        userAgent: entry.userAgent || '',
        metadata: entry.metadata || {}
      })

      return {
        id: record.id,
        contactId: record.contactId as string,
        consentId: record.consentId as string | undefined,
        action: record.action as ConsentAuditAction,
        consentType: record.consentType as CommunicationType | undefined,
        source: record.source as AuditSource,
        ipAddress: record.ipAddress as string | undefined,
        userAgent: record.userAgent as string | undefined,
        metadata: record.metadata as Record<string, unknown> | undefined,
        createdAt: new Date(record.created as string)
      }
    },

    async getAuditLog(contactId: string, options?: { limit?: number; offset?: number }) {
      const limit = options?.limit || 50
      const page = options?.offset ? Math.floor(options.offset / limit) + 1 : 1

      const records = await pb.collection('consent_audit_logs').getList(page, limit, {
        filter: safeFilter`contactId = ${contactId}`,
        sort: '-created'
      })

      return records.items.map((r) => ({
        id: r.id,
        contactId: r.contactId as string,
        consentId: r.consentId as string | undefined,
        action: r.action as ConsentAuditAction,
        consentType: r.consentType as CommunicationType | undefined,
        source: r.source as AuditSource,
        ipAddress: r.ipAddress as string | undefined,
        userAgent: r.userAgent as string | undefined,
        metadata: r.metadata as Record<string, unknown> | undefined,
        createdAt: new Date(r.created as string)
      }))
    },

    async getPreferences(
      contactId: string,
      eventId?: string
    ): Promise<CommunicationPreferences | null> {
      try {
        const filters = [safeFilter`contactId = ${contactId}`]
        if (eventId) {
          filters.push(safeFilter`eventId = ${eventId}`)
        } else {
          filters.push('eventId = ""')
        }

        const records = await pb.collection('communication_preferences').getList(1, 1, {
          filter: filters.join(' && ')
        })

        if (records.items.length === 0) {
          // Create default preferences
          const token = generatePreferenceToken()
          const record = await pb.collection('communication_preferences').create({
            contactId,
            eventId: eventId || '',
            newsletter: false,
            eventUpdates: true,
            partnerCommunications: false,
            frequency: 'immediate',
            preferenceToken: token
          })

          return mapRecordToPreferences(record)
        }

        return mapRecordToPreferences(records.items[0])
      } catch {
        return null
      }
    },

    async updatePreferences(
      contactId: string,
      preferences: UpdateCommunicationPreferences,
      source: AuditSource,
      ipAddress?: string,
      eventId?: string
    ): Promise<CommunicationPreferences> {
      const existing = await this.getPreferences(contactId, eventId)

      if (!existing) {
        throw new Error('Preferences not found')
      }

      const record = await pb.collection('communication_preferences').update(existing.id, {
        ...preferences
      })

      await this.logConsentAction({
        contactId,
        action: 'preferences_updated',
        source,
        ipAddress,
        metadata: { changes: preferences }
      })

      return mapRecordToPreferences(record)
    },

    async getPreferencesByToken(token: string) {
      try {
        const records = await pb.collection('communication_preferences').getList(1, 1, {
          filter: safeFilter`preferenceToken = ${token}`
        })

        if (records.items.length === 0) {
          return { preferences: null }
        }

        const record = records.items[0]
        return {
          preferences: mapRecordToPreferences(record),
          contactId: record.contactId as string
        }
      } catch {
        return { preferences: null }
      }
    },

    async exportContactData(contactId: string): Promise<GdprDataExport> {
      const contact = await getContact(contactId)

      // Fetch all related data
      const [consents, activities, orders, tickets, talks, auditLogs] = await Promise.all([
        pb.collection('consents').getFullList({
          filter: safeFilter`contactId = ${contactId}`
        }),
        pb.collection('contact_activities').getFullList({
          filter: safeFilter`contactId = ${contactId}`,
          sort: '-created'
        }),
        fetchOrdersForContact(pb, contactId),
        fetchTicketsForContact(pb, contactId),
        fetchTalksForContact(pb, contact.email as string),
        pb.collection('consent_audit_logs').getFullList({
          filter: safeFilter`contactId = ${contactId}`,
          sort: '-created'
        })
      ])

      // Log the export action
      await this.logConsentAction({
        contactId,
        action: 'data_exported',
        source: 'gdpr_request'
      })

      return {
        contact: {
          id: contact.id,
          email: contact.email as string,
          firstName: contact.firstName as string,
          lastName: contact.lastName as string,
          company: contact.company as string | undefined,
          jobTitle: contact.jobTitle as string | undefined,
          phone: contact.phone as string | undefined,
          address: contact.address as string | undefined,
          city: contact.city as string | undefined,
          country: contact.country as string | undefined,
          createdAt: new Date(contact.created as string),
          updatedAt: new Date(contact.updated as string)
        },
        consents: consents.map((c) => ({
          type: c.type as string,
          status: c.status as string,
          grantedAt: c.grantedAt ? new Date(c.grantedAt as string) : undefined,
          withdrawnAt: c.withdrawnAt ? new Date(c.withdrawnAt as string) : undefined,
          source: c.source as string
        })),
        activities: activities.map((a) => ({
          type: a.type as string,
          description: a.description as string,
          createdAt: new Date(a.created as string)
        })),
        orders: orders.map((o) => ({
          id: o.id,
          totalAmount: o.totalAmount as number,
          status: o.status as string,
          createdAt: new Date(o.created as string)
        })),
        tickets: tickets.map((t) => ({
          id: t.id,
          ticketTypeName: t.ticketTypeName as string,
          status: t.status as string,
          createdAt: new Date(t.created as string)
        })),
        talks: talks.map((t) => ({
          id: t.id,
          title: t.title as string,
          status: t.status as string,
          submittedAt: new Date(t.created as string)
        })),
        auditLog: auditLogs.map((l) => ({
          action: l.action as string,
          source: l.source as string,
          createdAt: new Date(l.created as string)
        })),
        exportedAt: new Date()
      }
    },

    async deleteContactData(contactId: string, ipAddress?: string): Promise<DataDeletionResult> {
      const deletedRecords = {
        contact: false,
        consents: 0,
        activities: 0,
        preferences: 0,
        auditLogs: 0
      }

      try {
        // Log deletion before deleting (for audit trail)
        await this.logConsentAction({
          contactId,
          action: 'data_deleted',
          source: 'gdpr_request',
          ipAddress
        })

        // Delete related records
        const consents = await pb.collection('consents').getFullList({
          filter: safeFilter`contactId = ${contactId}`,
          fields: 'id'
        })
        for (const consent of consents) {
          await pb.collection('consents').delete(consent.id)
          deletedRecords.consents++
        }

        const activities = await pb.collection('contact_activities').getFullList({
          filter: safeFilter`contactId = ${contactId}`,
          fields: 'id'
        })
        for (const activity of activities) {
          await pb.collection('contact_activities').delete(activity.id)
          deletedRecords.activities++
        }

        const preferences = await pb.collection('communication_preferences').getFullList({
          filter: safeFilter`contactId = ${contactId}`,
          fields: 'id'
        })
        for (const pref of preferences) {
          await pb.collection('communication_preferences').delete(pref.id)
          deletedRecords.preferences++
        }

        // Keep audit logs for legal compliance but anonymize
        const auditLogs = await pb.collection('consent_audit_logs').getFullList({
          filter: safeFilter`contactId = ${contactId}`,
          fields: 'id'
        })
        for (const log of auditLogs) {
          await pb.collection('consent_audit_logs').update(log.id, {
            contactId: `deleted_${contactId.substring(0, 8)}`,
            ipAddress: '',
            userAgent: '',
            metadata: { deleted: true }
          })
          deletedRecords.auditLogs++
        }

        // Delete contact
        await pb.collection('contacts').delete(contactId)
        deletedRecords.contact = true

        return {
          success: true,
          contactId,
          deletedRecords
        }
      } catch (error) {
        return {
          success: false,
          contactId,
          deletedRecords,
          error: error instanceof Error ? error.message : 'Failed to delete contact data'
        }
      }
    },

    async createRetentionPolicy(
      policy: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<DataRetentionPolicy> {
      const record = await pb.collection('data_retention_policies').create({
        eventId: policy.eventId || '',
        dataType: policy.dataType,
        retentionDays: policy.retentionDays,
        warningDays: policy.warningDays || GDPR_CONFIG.DEFAULT_WARNING_DAYS,
        autoDelete: policy.autoDelete || false,
        description: policy.description || ''
      })

      return mapRecordToRetentionPolicy(record)
    },

    async getRetentionPolicies(eventId?: string): Promise<DataRetentionPolicy[]> {
      const filters: string[] = []
      if (eventId) {
        filters.push(safeFilter`eventId = ${eventId}`)
      }

      const records = await pb.collection('data_retention_policies').getFullList({
        filter: filters.length > 0 ? filters.join(' && ') : undefined,
        sort: 'dataType'
      })

      return records.map(mapRecordToRetentionPolicy)
    },

    async updateRetentionPolicy(
      id: string,
      updates: Partial<Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<DataRetentionPolicy> {
      const record = await pb.collection('data_retention_policies').update(id, updates)
      return mapRecordToRetentionPolicy(record)
    },

    async getExpiredContacts(_eventId?: string) {
      // TODO: Implement with custom query based on retention policies
      // For now, return empty array - would need custom SQL or view
      return []
    },

    async unsubscribe(contactId: string, source: AuditSource, ipAddress?: string) {
      try {
        await updateContact(contactId, {
          emailStatus: 'unsubscribed'
        })

        await this.logConsentAction({
          contactId,
          action: 'unsubscribed',
          source,
          ipAddress
        })

        // Withdraw marketing consent
        const consents = await pb.collection('consents').getFullList({
          filter: safeFilter`contactId = ${contactId} && type = "marketing_email"`
        })

        for (const consent of consents) {
          await pb.collection('consents').update(consent.id, {
            status: 'withdrawn',
            withdrawnAt: new Date().toISOString()
          })
        }

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to unsubscribe'
        }
      }
    },

    async unsubscribeByToken(token: string, ipAddress?: string) {
      try {
        const records = await pb.collection('contacts').getList(1, 1, {
          filter: safeFilter`unsubscribeToken = ${token}`
        })

        if (records.items.length === 0) {
          return { success: false, error: 'Invalid unsubscribe token' }
        }

        const contact = records.items[0]
        return this.unsubscribe(contact.id, 'unsubscribe_link', ipAddress)
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to unsubscribe'
        }
      }
    }
  }
}

function mapRecordToPreferences(record: Record<string, unknown>): CommunicationPreferences {
  return {
    id: record.id as string,
    contactId: record.contactId as string,
    eventId: (record.eventId as string) || undefined,
    newsletter: (record.newsletter as boolean) || false,
    eventUpdates: (record.eventUpdates as boolean) || true,
    partnerCommunications: (record.partnerCommunications as boolean) || false,
    frequency: (record.frequency as CommunicationFrequency) || 'immediate',
    preferenceToken: record.preferenceToken as string | undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

function mapRecordToRetentionPolicy(record: Record<string, unknown>): DataRetentionPolicy {
  return {
    id: record.id as string,
    eventId: (record.eventId as string) || undefined,
    dataType: record.dataType as string,
    retentionDays: record.retentionDays as number,
    warningDays: record.warningDays as number | undefined,
    autoDelete: (record.autoDelete as boolean) || false,
    description: record.description as string | undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

async function fetchOrdersForContact(pb: PocketBase, contactId: string) {
  try {
    return await pb.collection('orders').getFullList({
      filter: safeFilter`contactId = ${contactId}`
    })
  } catch {
    return []
  }
}

async function fetchTicketsForContact(pb: PocketBase, contactId: string) {
  try {
    return await pb.collection('tickets').getFullList({
      filter: safeFilter`contactId = ${contactId}`
    })
  } catch {
    return []
  }
}

async function fetchTalksForContact(pb: PocketBase, email: string) {
  try {
    // Talks are linked via speaker email
    const speakers = await pb.collection('speakers').getFullList({
      filter: safeFilter`email = ${email}`,
      fields: 'id'
    })

    if (speakers.length === 0) return []

    const speakerIds = speakers.map((s) => s.id)
    const idFilters = speakerIds.map((id) => safeFilter`speakerId = ${id}`)

    return await pb.collection('talks').getFullList({
      filter: idFilters.join(' || ')
    })
  } catch {
    return []
  }
}
