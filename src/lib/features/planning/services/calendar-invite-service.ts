/**
 * Calendar Invite Service
 *
 * Handles sending calendar invitations to speakers when sessions are scheduled.
 * Supports sending new invites, updates, and cancellations.
 */

import { safeFilter } from '$lib/server/safe-filter'
import nodemailer from 'nodemailer'
import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import {
  type CalendarInviteRecord,
  type CalendarMethod,
  type CreateCalendarInviteRecord,
  type SessionCalendarInfo,
  type SpeakerCalendarInfo,
  generateIcalInvite,
  getCalendarInviteEmailHtml,
  getCalendarInviteEmailText,
  getCalendarInviteSubject
} from '../domain/calendar-invite'

export interface SmtpConfig {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
}

export interface CalendarInviteService {
  /**
   * Send calendar invite to a speaker for a session
   */
  sendInvite(
    sessionInfo: SessionCalendarInfo,
    speakerInfo: SpeakerCalendarInfo,
    domain: string
  ): Promise<CalendarInviteRecord>

  /**
   * Send calendar update to a speaker (when session time/room changes)
   */
  sendUpdate(
    sessionInfo: SessionCalendarInfo,
    speakerInfo: SpeakerCalendarInfo,
    domain: string
  ): Promise<CalendarInviteRecord>

  /**
   * Send calendar cancellation to a speaker
   */
  sendCancellation(
    sessionInfo: SessionCalendarInfo,
    speakerInfo: SpeakerCalendarInfo,
    domain: string
  ): Promise<CalendarInviteRecord>

  /**
   * Send invites to all speakers of a session
   */
  sendInvitesToAllSpeakers(sessionId: string, domain: string): Promise<CalendarInviteRecord[]>

  /**
   * Send updates to all speakers of a session
   */
  sendUpdatesToAllSpeakers(sessionId: string, domain: string): Promise<CalendarInviteRecord[]>

  /**
   * Send cancellations to all speakers of a session
   */
  sendCancellationsToAllSpeakers(sessionId: string, domain: string): Promise<CalendarInviteRecord[]>

  /**
   * Get invite record for a session/speaker pair
   */
  getInviteRecord(sessionId: string, speakerId: string): Promise<CalendarInviteRecord | null>

  /**
   * List all invite records for a session
   */
  listBySession(sessionId: string): Promise<CalendarInviteRecord[]>

  /**
   * List all invite records for a speaker
   */
  listBySpeaker(speakerId: string): Promise<CalendarInviteRecord[]>
}

export const createCalendarInviteService = (
  pb: PocketBase,
  smtpConfig: SmtpConfig
): CalendarInviteService => {
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    ...(smtpConfig.user && smtpConfig.pass
      ? { auth: { user: smtpConfig.user, pass: smtpConfig.pass } }
      : {})
  })

  function mapRecordToInvite(record: RecordModel): CalendarInviteRecord {
    return {
      id: record.id,
      sessionId: record.sessionId,
      speakerId: record.speakerId,
      speakerEmail: record.speakerEmail,
      method: record.method as CalendarMethod,
      status: record.status as CalendarInviteRecord['status'],
      sequence: record.sequence ?? 0,
      lastSentAt: record.lastSentAt ? new Date(record.lastSentAt) : undefined,
      error: record.error,
      createdAt: new Date(record.created),
      updatedAt: new Date(record.updated)
    }
  }

  async function getOrCreateInviteRecord(
    sessionId: string,
    speakerId: string,
    speakerEmail: string
  ): Promise<{ record: CalendarInviteRecord; isNew: boolean }> {
    try {
      const existing = await pb
        .collection('calendar_invites')
        .getFirstListItem(safeFilter`sessionId = ${sessionId} && speakerId = ${speakerId}`)
      return { record: mapRecordToInvite(existing), isNew: false }
    } catch {
      // Record doesn't exist, create it
      const created = await pb.collection('calendar_invites').create({
        sessionId,
        speakerId,
        speakerEmail,
        method: 'REQUEST',
        status: 'pending',
        sequence: 0
      })
      return { record: mapRecordToInvite(created), isNew: true }
    }
  }

  async function updateInviteRecord(
    id: string,
    data: Partial<CreateCalendarInviteRecord> & { status?: string }
  ): Promise<CalendarInviteRecord> {
    const record = await pb.collection('calendar_invites').update(id, data)
    return mapRecordToInvite(record)
  }

  async function sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
    icalContent: string,
    method: CalendarMethod
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await transporter.sendMail({
        from: smtpConfig.from,
        to,
        subject,
        html,
        text,
        icalEvent: {
          method,
          content: icalContent
        },
        attachments: [
          {
            filename: 'invite.ics',
            content: icalContent,
            contentType: `text/calendar; charset=utf-8; method=${method}`
          }
        ]
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async function sendCalendarEmail(
    sessionInfo: SessionCalendarInfo,
    speakerInfo: SpeakerCalendarInfo,
    method: CalendarMethod,
    domain: string
  ): Promise<CalendarInviteRecord> {
    const { record, isNew } = await getOrCreateInviteRecord(
      sessionInfo.sessionId,
      speakerInfo.speakerId,
      speakerInfo.email
    )

    const sequence = isNew ? 0 : record.sequence + 1

    const icalContent = generateIcalInvite(sessionInfo, speakerInfo, method, sequence, domain)

    const subject = getCalendarInviteSubject(method, sessionInfo.title, sessionInfo.eventName)
    const html = getCalendarInviteEmailHtml(method, sessionInfo, speakerInfo)
    const text = getCalendarInviteEmailText(method, sessionInfo, speakerInfo)

    const result = await sendEmail(speakerInfo.email, subject, html, text, icalContent, method)

    const newStatus = result.success
      ? method === 'CANCEL'
        ? 'cancelled'
        : isNew
          ? 'sent'
          : 'updated'
      : 'failed'

    return updateInviteRecord(record.id, {
      method,
      status: newStatus,
      sequence,
      lastSentAt: new Date(),
      error: result.error
    })
  }

  async function getSessionInfo(sessionId: string): Promise<SessionCalendarInfo | null> {
    try {
      const session = await pb.collection('sessions').getOne(sessionId, {
        expand: 'slotId,slotId.roomId,talkId,trackId'
      })

      if (!session.slotId || !session.talkId) {
        return null
      }

      const slot = session.expand?.slotId as RecordModel | undefined
      const room = slot?.expand?.roomId as RecordModel | undefined
      const talk = session.expand?.talkId as RecordModel | undefined
      const track = session.expand?.trackId as RecordModel | undefined

      if (!slot || !talk) {
        return null
      }

      // Get edition info
      const edition = await pb.collection('editions').getOne(session.editionId, {
        expand: 'eventId'
      })
      const event = edition.expand?.eventId as RecordModel | undefined

      return {
        sessionId: session.id,
        editionId: session.editionId,
        title: talk.title || session.title,
        description: talk.abstract || session.description,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomName: room?.name,
        roomFloor: room?.floor,
        trackName: track?.name,
        eventName: event?.name || edition.name,
        eventLocation: edition.location,
        organizerEmail: event?.contactEmail || 'noreply@example.com',
        organizerName: event?.name
      }
    } catch {
      return null
    }
  }

  async function getSpeakersForSession(sessionId: string): Promise<SpeakerCalendarInfo[]> {
    try {
      const session = await pb.collection('sessions').getOne(sessionId, {
        expand: 'talkId'
      })

      const talk = session.expand?.talkId as RecordModel | undefined
      if (!talk || !talk.speakerIds || talk.speakerIds.length === 0) {
        return []
      }

      const speakerIds = talk.speakerIds as string[]
      const speakers = await pb.collection('speakers').getFullList({
        filter: speakerIds.map((id) => safeFilter`id = ${id}`).join(' || ')
      })

      return speakers.map((s) => ({
        speakerId: s.id,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName
      }))
    } catch {
      return []
    }
  }

  return {
    async sendInvite(
      sessionInfo: SessionCalendarInfo,
      speakerInfo: SpeakerCalendarInfo,
      domain: string
    ): Promise<CalendarInviteRecord> {
      return sendCalendarEmail(sessionInfo, speakerInfo, 'REQUEST', domain)
    },

    async sendUpdate(
      sessionInfo: SessionCalendarInfo,
      speakerInfo: SpeakerCalendarInfo,
      domain: string
    ): Promise<CalendarInviteRecord> {
      return sendCalendarEmail(sessionInfo, speakerInfo, 'REQUEST', domain)
    },

    async sendCancellation(
      sessionInfo: SessionCalendarInfo,
      speakerInfo: SpeakerCalendarInfo,
      domain: string
    ): Promise<CalendarInviteRecord> {
      return sendCalendarEmail(sessionInfo, speakerInfo, 'CANCEL', domain)
    },

    async sendInvitesToAllSpeakers(
      sessionId: string,
      domain: string
    ): Promise<CalendarInviteRecord[]> {
      const sessionInfo = await getSessionInfo(sessionId)
      if (!sessionInfo) {
        return []
      }

      const speakers = await getSpeakersForSession(sessionId)
      const results: CalendarInviteRecord[] = []

      for (const speaker of speakers) {
        const record = await sendCalendarEmail(sessionInfo, speaker, 'REQUEST', domain)
        results.push(record)
      }

      return results
    },

    async sendUpdatesToAllSpeakers(
      sessionId: string,
      domain: string
    ): Promise<CalendarInviteRecord[]> {
      const sessionInfo = await getSessionInfo(sessionId)
      if (!sessionInfo) {
        return []
      }

      const speakers = await getSpeakersForSession(sessionId)
      const results: CalendarInviteRecord[] = []

      for (const speaker of speakers) {
        const record = await sendCalendarEmail(sessionInfo, speaker, 'REQUEST', domain)
        results.push(record)
      }

      return results
    },

    async sendCancellationsToAllSpeakers(
      sessionId: string,
      domain: string
    ): Promise<CalendarInviteRecord[]> {
      const sessionInfo = await getSessionInfo(sessionId)
      if (!sessionInfo) {
        return []
      }

      const speakers = await getSpeakersForSession(sessionId)
      const results: CalendarInviteRecord[] = []

      for (const speaker of speakers) {
        const record = await sendCalendarEmail(sessionInfo, speaker, 'CANCEL', domain)
        results.push(record)
      }

      return results
    },

    async getInviteRecord(
      sessionId: string,
      speakerId: string
    ): Promise<CalendarInviteRecord | null> {
      try {
        const record = await pb
          .collection('calendar_invites')
          .getFirstListItem(safeFilter`sessionId = ${sessionId} && speakerId = ${speakerId}`)
        return mapRecordToInvite(record)
      } catch {
        return null
      }
    },

    async listBySession(sessionId: string): Promise<CalendarInviteRecord[]> {
      const records = await pb.collection('calendar_invites').getFullList({
        filter: safeFilter`sessionId = ${sessionId}`,
        sort: '-created'
      })
      return records.map(mapRecordToInvite)
    },

    async listBySpeaker(speakerId: string): Promise<CalendarInviteRecord[]> {
      const records = await pb.collection('calendar_invites').getFullList({
        filter: safeFilter`speakerId = ${speakerId}`,
        sort: '-created'
      })
      return records.map(mapRecordToInvite)
    }
  }
}

export type { CalendarInviteRecord, SessionCalendarInfo, SpeakerCalendarInfo }
