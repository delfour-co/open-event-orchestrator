/**
 * iCal Export Domain
 *
 * Handles iCalendar (.ics) generation for public schedule exports.
 * Supports full schedule, track-based, and day-based exports.
 */

import { z } from 'zod'

/**
 * iCal export format options
 */
export const icalExportFormatSchema = z.enum(['full', 'compact'])
export type IcalExportFormat = z.infer<typeof icalExportFormatSchema>

/**
 * iCal export filter options
 */
export interface IcalExportFilter {
  trackId?: string
  roomId?: string
  date?: Date
  sessionIds?: string[]
}

/**
 * Session data for iCal export
 */
export interface IcalSession {
  id: string
  title: string
  description?: string
  date: Date
  startTime: string // HH:MM
  endTime: string // HH:MM
  roomName?: string
  roomFloor?: string
  trackName?: string
  trackColor?: string
  speakerNames?: string[]
  language?: string
  level?: string
  tags?: string[]
  url?: string
}

/**
 * Event metadata for iCal calendar
 */
export interface IcalEventInfo {
  eventName: string
  eventSlug: string
  editionName: string
  editionSlug: string
  location?: string
  timezone: string
  organizerEmail: string
  organizerName?: string
  baseUrl: string
}

/**
 * Generated iCal result
 */
export interface IcalExportResult {
  content: string
  filename: string
  sessionCount: number
}

// ============================================================================
// iCal Formatting Functions
// ============================================================================

/**
 * Format a date and time to iCal datetime format with timezone
 */
export function formatIcalDateTimeWithTz(date: Date, time: string, timezone: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const [hours, minutes] = time.split(':')
  return `TZID=${timezone}:${year}${month}${day}T${hours}${minutes}00`
}

/**
 * Format a date and time to UTC iCal datetime format
 */
export function formatIcalDateTimeUtc(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Format a date to iCal date format
 */
export function formatIcalDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Escape special characters for iCal text (RFC 5545)
 */
export function escapeIcalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Fold long lines for iCal (RFC 5545: max 75 octets per line)
 */
export function foldIcalLine(line: string, maxLength = 75): string {
  if (line.length <= maxLength) {
    return line
  }

  const result: string[] = []
  let remaining = line

  while (remaining.length > 0) {
    if (result.length === 0) {
      // First line: use full maxLength
      result.push(remaining.slice(0, maxLength))
      remaining = remaining.slice(maxLength)
    } else {
      // Continuation lines: start with space, use maxLength - 1
      result.push(` ${remaining.slice(0, maxLength - 1)}`)
      remaining = remaining.slice(maxLength - 1)
    }
  }

  return result.join('\r\n')
}

/**
 * Generate a unique UID for iCal event
 */
export function generateSessionUid(sessionId: string, domain: string): string {
  return `session-${sessionId}@${domain}`
}

// ============================================================================
// iCal Content Generation
// ============================================================================

/**
 * Build location string from room info
 */
export function buildIcalLocation(roomName?: string, roomFloor?: string, venue?: string): string {
  const parts: string[] = []
  if (roomName) {
    parts.push(roomFloor ? `${roomName} (${roomFloor})` : roomName)
  }
  if (venue) {
    parts.push(venue)
  }
  return parts.join(', ')
}

/**
 * Build session description for iCal
 */
export function buildSessionDescription(
  session: IcalSession,
  format: IcalExportFormat,
  sessionUrl?: string
): string {
  const lines: string[] = []

  if (format === 'full') {
    // Full description with all details
    if (session.description) {
      lines.push(session.description)
      lines.push('')
    }

    if (session.speakerNames && session.speakerNames.length > 0) {
      lines.push(`Speakers: ${session.speakerNames.join(', ')}`)
    }

    if (session.trackName) {
      lines.push(`Track: ${session.trackName}`)
    }

    if (session.level) {
      lines.push(`Level: ${session.level}`)
    }

    if (session.language) {
      lines.push(`Language: ${session.language}`)
    }

    if (session.tags && session.tags.length > 0) {
      lines.push(`Tags: ${session.tags.join(', ')}`)
    }
  } else {
    // Compact description (summary only)
    if (session.speakerNames && session.speakerNames.length > 0) {
      lines.push(`By ${session.speakerNames.join(', ')}`)
    }

    if (session.trackName) {
      lines.push(`Track: ${session.trackName}`)
    }
  }

  if (sessionUrl) {
    lines.push('')
    lines.push(`More info: ${sessionUrl}`)
  }

  return lines.join('\n')
}

/**
 * Generate iCal VEVENT for a single session
 */
export function generateSessionEvent(
  session: IcalSession,
  eventInfo: IcalEventInfo,
  format: IcalExportFormat
): string {
  const uid = generateSessionUid(session.id, new URL(eventInfo.baseUrl).hostname)
  const dtstamp = formatIcalDateTimeUtc(new Date())
  const dtstart = formatIcalDateTimeWithTz(session.date, session.startTime, eventInfo.timezone)
  const dtend = formatIcalDateTimeWithTz(session.date, session.endTime, eventInfo.timezone)
  const location = buildIcalLocation(session.roomName, session.roomFloor, eventInfo.location)
  const sessionUrl =
    session.url || `${eventInfo.baseUrl}/schedule/${eventInfo.editionSlug}/session/${session.id}`
  const description = buildSessionDescription(session, format, sessionUrl)

  const lines: string[] = []
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${uid}`)
  lines.push(`DTSTAMP:${dtstamp}`)
  lines.push(foldIcalLine(`DTSTART;${dtstart}`))
  lines.push(foldIcalLine(`DTEND;${dtend}`))
  lines.push(foldIcalLine(`SUMMARY:${escapeIcalText(session.title)}`))

  if (description) {
    lines.push(foldIcalLine(`DESCRIPTION:${escapeIcalText(description)}`))
  }

  if (location) {
    lines.push(foldIcalLine(`LOCATION:${escapeIcalText(location)}`))
  }

  if (sessionUrl) {
    lines.push(foldIcalLine(`URL:${sessionUrl}`))
  }

  // Categories
  const categories: string[] = []
  if (session.trackName) {
    categories.push(session.trackName)
  }
  if (session.level) {
    categories.push(session.level)
  }
  if (categories.length > 0) {
    lines.push(foldIcalLine(`CATEGORIES:${categories.map(escapeIcalText).join(',')}`))
  }

  // Organizer
  if (eventInfo.organizerName) {
    lines.push(
      foldIcalLine(
        `ORGANIZER;CN=${escapeIcalText(eventInfo.organizerName)}:mailto:${eventInfo.organizerEmail}`
      )
    )
  } else {
    lines.push(foldIcalLine(`ORGANIZER:mailto:${eventInfo.organizerEmail}`))
  }

  lines.push('STATUS:CONFIRMED')
  lines.push('TRANSP:OPAQUE')
  lines.push('END:VEVENT')

  return lines.join('\r\n')
}

/**
 * Generate VTIMEZONE component for a timezone
 * Note: This is a simplified version. For full support, use a library like ical.js
 */
export function generateTimezoneComponent(timezone: string): string {
  // Most common European/American timezones
  // For production, use a proper timezone database
  const timezoneRules: Record<string, { standard: string; daylight?: string }> = {
    'Europe/Paris': {
      standard:
        'BEGIN:STANDARD\r\nDTSTART:19701025T030000\r\nRRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\nTZNAME:CET\r\nEND:STANDARD',
      daylight:
        'BEGIN:DAYLIGHT\r\nDTSTART:19700329T020000\r\nRRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\nTZNAME:CEST\r\nEND:DAYLIGHT'
    },
    'America/New_York': {
      standard:
        'BEGIN:STANDARD\r\nDTSTART:19701101T020000\r\nRRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11\r\nTZOFFSETFROM:-0400\r\nTZOFFSETTO:-0500\r\nTZNAME:EST\r\nEND:STANDARD',
      daylight:
        'BEGIN:DAYLIGHT\r\nDTSTART:19700308T020000\r\nRRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3\r\nTZOFFSETFROM:-0500\r\nTZOFFSETTO:-0400\r\nTZNAME:EDT\r\nEND:DAYLIGHT'
    },
    'America/Los_Angeles': {
      standard:
        'BEGIN:STANDARD\r\nDTSTART:19701101T020000\r\nRRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11\r\nTZOFFSETFROM:-0700\r\nTZOFFSETTO:-0800\r\nTZNAME:PST\r\nEND:STANDARD',
      daylight:
        'BEGIN:DAYLIGHT\r\nDTSTART:19700308T020000\r\nRRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3\r\nTZOFFSETFROM:-0800\r\nTZOFFSETTO:-0700\r\nTZNAME:PDT\r\nEND:DAYLIGHT'
    },
    UTC: {
      standard:
        'BEGIN:STANDARD\r\nDTSTART:19700101T000000\r\nTZOFFSETFROM:+0000\r\nTZOFFSETTO:+0000\r\nTZNAME:UTC\r\nEND:STANDARD'
    }
  }

  const rules = timezoneRules[timezone] || timezoneRules.UTC

  const lines: string[] = []
  lines.push('BEGIN:VTIMEZONE')
  lines.push(`TZID:${timezone}`)
  lines.push(rules.standard)
  if (rules.daylight) {
    lines.push(rules.daylight)
  }
  lines.push('END:VTIMEZONE')

  return lines.join('\r\n')
}

/**
 * Generate complete iCal calendar for sessions
 */
export function generateIcalCalendar(
  sessions: IcalSession[],
  eventInfo: IcalEventInfo,
  format: IcalExportFormat = 'full'
): string {
  const lines: string[] = []

  // Calendar header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//Open Event Orchestrator//Schedule Export//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  lines.push(
    foldIcalLine(
      `X-WR-CALNAME:${escapeIcalText(`${eventInfo.eventName} - ${eventInfo.editionName}`)}`
    )
  )

  if (eventInfo.timezone) {
    lines.push(`X-WR-TIMEZONE:${eventInfo.timezone}`)
  }

  // Timezone component
  lines.push(generateTimezoneComponent(eventInfo.timezone))

  // Events
  for (const session of sessions) {
    lines.push(generateSessionEvent(session, eventInfo, format))
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Generate full schedule export
 */
export function exportFullSchedule(
  sessions: IcalSession[],
  eventInfo: IcalEventInfo,
  format: IcalExportFormat = 'full'
): IcalExportResult {
  const content = generateIcalCalendar(sessions, eventInfo, format)
  const filename = `${eventInfo.editionSlug}-schedule.ics`

  return {
    content,
    filename,
    sessionCount: sessions.length
  }
}

/**
 * Generate track-specific export
 */
export function exportTrackSchedule(
  sessions: IcalSession[],
  trackName: string,
  eventInfo: IcalEventInfo,
  format: IcalExportFormat = 'full'
): IcalExportResult {
  const filteredSessions = sessions.filter((s) => s.trackName === trackName)
  const content = generateIcalCalendar(filteredSessions, eventInfo, format)
  const trackSlug = trackName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `${eventInfo.editionSlug}-${trackSlug}.ics`

  return {
    content,
    filename,
    sessionCount: filteredSessions.length
  }
}

/**
 * Generate day-specific export
 */
export function exportDaySchedule(
  sessions: IcalSession[],
  date: Date,
  eventInfo: IcalEventInfo,
  format: IcalExportFormat = 'full'
): IcalExportResult {
  const targetDate = formatIcalDateOnly(date)
  const filteredSessions = sessions.filter((s) => formatIcalDateOnly(s.date) === targetDate)
  const content = generateIcalCalendar(filteredSessions, eventInfo, format)
  const filename = `${eventInfo.editionSlug}-${targetDate}.ics`

  return {
    content,
    filename,
    sessionCount: filteredSessions.length
  }
}

/**
 * Generate single session export
 */
export function exportSingleSession(
  session: IcalSession,
  eventInfo: IcalEventInfo,
  format: IcalExportFormat = 'full'
): IcalExportResult {
  const content = generateIcalCalendar([session], eventInfo, format)
  const filename = `session-${session.id}.ics`

  return {
    content,
    filename,
    sessionCount: 1
  }
}

/**
 * Generate filtered export based on filter options
 */
export function exportFilteredSchedule(
  sessions: IcalSession[],
  filter: IcalExportFilter,
  eventInfo: IcalEventInfo,
  format: IcalExportFormat = 'full'
): IcalExportResult {
  let filtered = sessions

  if (filter.trackId) {
    filtered = filtered.filter((s) => s.trackName === filter.trackId)
  }

  if (filter.roomId) {
    filtered = filtered.filter((s) => s.roomName === filter.roomId)
  }

  if (filter.date) {
    const targetDate = formatIcalDateOnly(filter.date)
    filtered = filtered.filter((s) => formatIcalDateOnly(s.date) === targetDate)
  }

  if (filter.sessionIds && filter.sessionIds.length > 0) {
    filtered = filtered.filter((s) => filter.sessionIds?.includes(s.id))
  }

  const content = generateIcalCalendar(filtered, eventInfo, format)
  const filename = `${eventInfo.editionSlug}-custom.ics`

  return {
    content,
    filename,
    sessionCount: filtered.length
  }
}

// ============================================================================
// URL Generation
// ============================================================================

/**
 * Generate dynamic calendar URL for full schedule
 */
export function buildScheduleCalendarUrl(baseUrl: string, editionSlug: string): string {
  return `${baseUrl}/api/schedule/${editionSlug}/ical`
}

/**
 * Generate dynamic calendar URL for track
 */
export function buildTrackCalendarUrl(
  baseUrl: string,
  editionSlug: string,
  trackSlug: string
): string {
  return `${baseUrl}/api/schedule/${editionSlug}/ical?track=${trackSlug}`
}

/**
 * Generate dynamic calendar URL for day
 */
export function buildDayCalendarUrl(baseUrl: string, editionSlug: string, date: Date): string {
  const dateStr = formatIcalDateOnly(date)
  return `${baseUrl}/api/schedule/${editionSlug}/ical?date=${dateStr}`
}

/**
 * Generate webcal:// URL for calendar subscription
 */
export function buildWebcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https?:\/\//, 'webcal://')
}

/**
 * Generate Google Calendar add URL
 */
export function buildGoogleCalendarUrl(icalUrl: string): string {
  const encodedUrl = encodeURIComponent(icalUrl)
  return `https://calendar.google.com/calendar/render?cid=${encodedUrl}`
}

/**
 * Generate Outlook web add URL
 */
export function buildOutlookCalendarUrl(icalUrl: string): string {
  const encodedUrl = encodeURIComponent(icalUrl)
  return `https://outlook.live.com/calendar/0/addfromweb?url=${encodedUrl}`
}

// ============================================================================
// Validation & Utility
// ============================================================================

/**
 * Validate iCal content (basic check)
 */
export function isValidIcalContent(content: string): boolean {
  return (
    content.includes('BEGIN:VCALENDAR') &&
    content.includes('END:VCALENDAR') &&
    content.includes('VERSION:2.0')
  )
}

/**
 * Get iCal MIME type
 */
export function getIcalMimeType(): string {
  return 'text/calendar; charset=utf-8'
}

/**
 * Get iCal content disposition header
 */
export function getIcalContentDisposition(filename: string): string {
  return `attachment; filename="${filename}"`
}

/**
 * Parse date from iCal format (YYYYMMDD)
 */
export function parseIcalDate(icalDate: string): Date {
  const year = Number.parseInt(icalDate.slice(0, 4), 10)
  const month = Number.parseInt(icalDate.slice(4, 6), 10) - 1
  const day = Number.parseInt(icalDate.slice(6, 8), 10)
  return new Date(year, month, day)
}

/**
 * Sort sessions by date and start time
 */
export function sortSessionsByDateTime(sessions: IcalSession[]): IcalSession[] {
  return [...sessions].sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime()
    if (dateCompare !== 0) return dateCompare
    return a.startTime.localeCompare(b.startTime)
  })
}

/**
 * Get unique dates from sessions
 */
export function getUniqueDates(sessions: IcalSession[]): Date[] {
  const dateSet = new Set<string>()
  const dates: Date[] = []

  for (const session of sessions) {
    const dateStr = formatIcalDateOnly(session.date)
    if (!dateSet.has(dateStr)) {
      dateSet.add(dateStr)
      dates.push(session.date)
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Get unique tracks from sessions
 */
export function getUniqueTracks(sessions: IcalSession[]): string[] {
  const tracks = new Set<string>()

  for (const session of sessions) {
    if (session.trackName) {
      tracks.add(session.trackName)
    }
  }

  return Array.from(tracks).sort()
}
