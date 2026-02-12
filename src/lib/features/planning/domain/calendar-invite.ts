/**
 * Calendar Invite Domain
 *
 * Handles iCal generation for speaker session invitations.
 * Supports creating, updating, and cancelling calendar events.
 */

import { z } from 'zod'

/**
 * Calendar invite method (RFC 5545)
 * - REQUEST: New or updated event
 * - CANCEL: Cancelled event
 */
export const calendarMethodSchema = z.enum(['REQUEST', 'CANCEL'])
export type CalendarMethod = z.infer<typeof calendarMethodSchema>

/**
 * Calendar invite status
 */
export const calendarInviteStatusSchema = z.enum([
  'pending', // Not yet sent
  'sent', // Successfully sent
  'updated', // Update sent
  'cancelled', // Cancellation sent
  'failed' // Delivery failed
])
export type CalendarInviteStatus = z.infer<typeof calendarInviteStatusSchema>

/**
 * Session info for calendar invite generation
 */
export interface SessionCalendarInfo {
  sessionId: string
  editionId: string
  title: string
  description?: string
  date: Date
  startTime: string // HH:MM
  endTime: string // HH:MM
  roomName?: string
  roomFloor?: string
  trackName?: string
  eventName: string
  eventLocation?: string
  organizerEmail: string
  organizerName?: string
  programUrl?: string
  speakerNotes?: string
}

/**
 * Speaker info for calendar invite
 */
export interface SpeakerCalendarInfo {
  speakerId: string
  email: string
  firstName: string
  lastName: string
}

/**
 * Calendar invite record schema (for tracking sent invites)
 */
export const calendarInviteRecordSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  speakerId: z.string(),
  speakerEmail: z.string(),
  method: calendarMethodSchema,
  status: calendarInviteStatusSchema,
  sequence: z.number().int().min(0).default(0),
  lastSentAt: z.date().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CalendarInviteRecord = z.infer<typeof calendarInviteRecordSchema>

/**
 * Input for creating a calendar invite record
 */
export const createCalendarInviteRecordSchema = calendarInviteRecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateCalendarInviteRecord = z.infer<typeof createCalendarInviteRecordSchema>

// ============================================================================
// iCal Generation Functions
// ============================================================================

/**
 * Format a date and time to iCal datetime format (YYYYMMDDTHHMMSS)
 */
export function formatIcalDateTime(date: Date, time: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const [hours, minutes] = time.split(':')
  return `${year}${month}${day}T${hours}${minutes}00`
}

/**
 * Format a date to iCal date format (YYYYMMDD)
 */
export function formatIcalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Escape special characters for iCal text
 */
export function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Generate a unique UID for iCal event
 */
export function generateEventUid(sessionId: string, speakerId: string, domain: string): string {
  return `session-${sessionId}-speaker-${speakerId}@${domain}`
}

/**
 * Build location string from room info
 */
export function buildLocationString(
  roomName?: string,
  roomFloor?: string,
  eventLocation?: string
): string {
  const parts: string[] = []
  if (roomName) {
    if (roomFloor) {
      parts.push(`${roomName} (${roomFloor})`)
    } else {
      parts.push(roomName)
    }
  }
  if (eventLocation) {
    parts.push(eventLocation)
  }
  return parts.join(' - ')
}

/**
 * Build description for calendar event
 */
export function buildEventDescription(
  session: SessionCalendarInfo,
  speaker: SpeakerCalendarInfo
): string {
  const lines: string[] = []

  lines.push(`You are scheduled to present "${session.title}" at ${session.eventName}.`)
  lines.push('')

  if (session.description) {
    lines.push('Session Description:')
    lines.push(session.description)
    lines.push('')
  }

  if (session.trackName) {
    lines.push(`Track: ${session.trackName}`)
  }

  if (session.roomName) {
    const room = session.roomFloor ? `${session.roomName} (${session.roomFloor})` : session.roomName
    lines.push(`Room: ${room}`)
  }

  lines.push(`Time: ${session.startTime} - ${session.endTime}`)

  if (session.speakerNotes) {
    lines.push('')
    lines.push('Notes:')
    lines.push(session.speakerNotes)
  }

  if (session.programUrl) {
    lines.push('')
    lines.push(`View program: ${session.programUrl}`)
  }

  return lines.join('\n')
}

/**
 * Generate iCal content for a speaker session invite
 */
export function generateIcalInvite(
  session: SessionCalendarInfo,
  speaker: SpeakerCalendarInfo,
  method: CalendarMethod,
  sequence: number,
  domain: string
): string {
  const uid = generateEventUid(session.sessionId, speaker.speakerId, domain)
  const now = new Date()
  const dtstamp = formatIcalDateTime(
    now,
    `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  )
  const dtstart = formatIcalDateTime(session.date, session.startTime)
  const dtend = formatIcalDateTime(session.date, session.endTime)
  const location = buildLocationString(session.roomName, session.roomFloor, session.eventLocation)
  const description = buildEventDescription(session, speaker)
  const summary = `[Speaker] ${session.title}`

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open Event Orchestrator//Speaker Calendar//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`
  ]

  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${uid}`)
  lines.push(`DTSTAMP:${dtstamp}`)
  lines.push(`DTSTART:${dtstart}`)
  lines.push(`DTEND:${dtend}`)
  lines.push(`SEQUENCE:${sequence}`)
  lines.push(`SUMMARY:${escapeIcal(summary)}`)

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcal(description)}`)
  }

  if (location) {
    lines.push(`LOCATION:${escapeIcal(location)}`)
  }

  // Organizer
  if (session.organizerName) {
    lines.push(`ORGANIZER;CN=${escapeIcal(session.organizerName)}:mailto:${session.organizerEmail}`)
  } else {
    lines.push(`ORGANIZER:mailto:${session.organizerEmail}`)
  }

  // Attendee (the speaker)
  const speakerName = `${speaker.firstName} ${speaker.lastName}`
  lines.push(
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=${escapeIcal(speakerName)}:mailto:${speaker.email}`
  )

  // Status based on method
  if (method === 'CANCEL') {
    lines.push('STATUS:CANCELLED')
  } else {
    lines.push('STATUS:CONFIRMED')
  }

  // Categories
  lines.push('CATEGORIES:Speaker Session')
  if (session.trackName) {
    lines.push(`CATEGORIES:${escapeIcal(session.trackName)}`)
  }

  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Calculate session duration in minutes
 */
export function calculateSessionDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  return endH * 60 + endM - (startH * 60 + startM)
}

/**
 * Format duration for display (e.g., "1h 30min")
 */
export function formatSessionDuration(startTime: string, endTime: string): string {
  const duration = calculateSessionDuration(startTime, endTime)
  if (duration >= 60) {
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }
  return `${duration}min`
}

/**
 * Check if a calendar invite needs to be sent (session is assigned)
 */
export function shouldSendCalendarInvite(
  sessionHasSlot: boolean,
  sessionHasTalk: boolean
): boolean {
  return sessionHasSlot && sessionHasTalk
}

/**
 * Check if a calendar update is needed (compare current vs previous state)
 */
export function needsCalendarUpdate(
  previous: SessionCalendarInfo,
  current: SessionCalendarInfo
): boolean {
  return (
    previous.date.getTime() !== current.date.getTime() ||
    previous.startTime !== current.startTime ||
    previous.endTime !== current.endTime ||
    previous.roomName !== current.roomName ||
    previous.title !== current.title
  )
}

/**
 * Get email subject for calendar invite
 */
export function getCalendarInviteSubject(
  method: CalendarMethod,
  sessionTitle: string,
  eventName: string
): string {
  switch (method) {
    case 'REQUEST':
      return `Session scheduled: ${sessionTitle} at ${eventName}`
    case 'CANCEL':
      return `Session cancelled: ${sessionTitle} at ${eventName}`
  }
}

/**
 * Get email body for calendar invite (HTML)
 */
export function getCalendarInviteEmailHtml(
  method: CalendarMethod,
  session: SessionCalendarInfo,
  speaker: SpeakerCalendarInfo
): string {
  const speakerName = speaker.firstName

  if (method === 'CANCEL') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <h2>Session Cancelled</h2>
  <p>Hello ${speakerName},</p>
  <p>We regret to inform you that your session <strong>"${session.title}"</strong> at ${session.eventName} has been cancelled or rescheduled.</p>
  <p>Please check your calendar for updates or contact the organizers if you have questions.</p>
  <p>Best regards,<br>${session.organizerName || 'The Event Team'}</p>
</body>
</html>`
  }

  const location = buildLocationString(session.roomName, session.roomFloor)
  const duration = formatSessionDuration(session.startTime, session.endTime)
  const dateStr = session.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <h2>Your Session is Scheduled!</h2>
  <p>Hello ${speakerName},</p>
  <p>Great news! Your session has been scheduled at <strong>${session.eventName}</strong>.</p>

  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">${session.title}</h3>
    <p style="margin-bottom: 5px;"><strong>Date:</strong> ${dateStr}</p>
    <p style="margin-bottom: 5px;"><strong>Time:</strong> ${session.startTime} - ${session.endTime} (${duration})</p>
    ${location ? `<p style="margin-bottom: 5px;"><strong>Room:</strong> ${location}</p>` : ''}
    ${session.trackName ? `<p style="margin-bottom: 5px;"><strong>Track:</strong> ${session.trackName}</p>` : ''}
  </div>

  ${session.speakerNotes ? `<p><strong>Notes from organizers:</strong><br>${session.speakerNotes}</p>` : ''}

  <p>A calendar invitation is attached to this email. Please add it to your calendar to receive automatic updates.</p>

  ${session.programUrl ? `<p><a href="${session.programUrl}">View the full program</a></p>` : ''}

  <p>If you have any questions, please contact the organizers.</p>

  <p>Best regards,<br>${session.organizerName || 'The Event Team'}</p>
</body>
</html>`
}

/**
 * Get email body for calendar invite (plain text)
 */
export function getCalendarInviteEmailText(
  method: CalendarMethod,
  session: SessionCalendarInfo,
  speaker: SpeakerCalendarInfo
): string {
  const speakerName = speaker.firstName

  if (method === 'CANCEL') {
    return `Session Cancelled

Hello ${speakerName},

We regret to inform you that your session "${session.title}" at ${session.eventName} has been cancelled or rescheduled.

Please check your calendar for updates or contact the organizers if you have questions.

Best regards,
${session.organizerName || 'The Event Team'}`
  }

  const location = buildLocationString(session.roomName, session.roomFloor)
  const duration = formatSessionDuration(session.startTime, session.endTime)
  const dateStr = session.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let text = `Your Session is Scheduled!

Hello ${speakerName},

Great news! Your session has been scheduled at ${session.eventName}.

SESSION DETAILS
---------------
Title: ${session.title}
Date: ${dateStr}
Time: ${session.startTime} - ${session.endTime} (${duration})`

  if (location) {
    text += `\nRoom: ${location}`
  }
  if (session.trackName) {
    text += `\nTrack: ${session.trackName}`
  }

  if (session.speakerNotes) {
    text += `\n\nNotes from organizers:\n${session.speakerNotes}`
  }

  text += `\n
A calendar invitation is attached to this email. Please add it to your calendar to receive automatic updates.`

  if (session.programUrl) {
    text += `\n\nView the full program: ${session.programUrl}`
  }

  text += `\n
If you have any questions, please contact the organizers.

Best regards,
${session.organizerName || 'The Event Team'}`

  return text
}
