import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Escape special characters for iCal format
 */
function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/**
 * Format a date and time as iCal DATETIME (YYYYMMDDTHHMMSS)
 */
function formatIcalDateTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':')
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}00`
}

/**
 * Generate a unique UID for an event
 */
function generateUid(sessionId: string, editionSlug: string): string {
  return `${sessionId}@${editionSlug}.oeo`
}

/**
 * Get the session type label
 */
function getSessionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    talk: 'Talk',
    workshop: 'Workshop',
    keynote: 'Keynote',
    panel: 'Panel',
    break: 'Break',
    lunch: 'Lunch',
    networking: 'Networking',
    registration: 'Registration',
    other: 'Other'
  }
  return labels[type] || type
}

interface Speaker {
  firstName: string
  lastName: string
  company?: string
}

interface Talk {
  id: string
  title: string
  speakers: Speaker[]
}

interface SessionEventParams {
  session: Record<string, unknown>
  slot: Record<string, unknown>
  room: Record<string, unknown> | undefined
  track: Record<string, unknown> | null
  talk: Talk | undefined
  edition: Record<string, unknown>
  editionSlug: string
}

/**
 * Build a VEVENT for a session
 */
function buildSessionEvent(params: SessionEventParams): string[] {
  const { session, slot, room, track, talk, edition, editionSlug } = params
  const lines: string[] = []

  const slotDate = new Date(slot.date as string)
  const dtStart = formatIcalDateTime(slotDate, slot.startTime as string)
  const dtEnd = formatIcalDateTime(slotDate, slot.endTime as string)

  // Build description
  const descriptionParts: string[] = []
  descriptionParts.push(`Type: ${getSessionTypeLabel(session.type as string)}`)

  if (track) {
    descriptionParts.push(`Track: ${track.name as string}`)
  }

  if (talk?.speakers && talk.speakers.length > 0) {
    const speakerNames = talk.speakers
      .map((s) => {
        const name = `${s.firstName} ${s.lastName}`
        return s.company ? `${name} (${s.company})` : name
      })
      .join(', ')
    descriptionParts.push(`Speaker(s): ${speakerNames}`)
  }

  if (session.description) {
    descriptionParts.push('')
    descriptionParts.push(session.description as string)
  }

  const description = descriptionParts.join('\\n')

  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${generateUid(session.id as string, editionSlug)}`)
  lines.push(`DTSTAMP:${formatIcalDateTime(new Date(), '00:00')}`)
  lines.push(`DTSTART:${dtStart}`)
  lines.push(`DTEND:${dtEnd}`)
  lines.push(`SUMMARY:${escapeIcal(session.title as string)}`)

  if (room) {
    let location = room.name as string
    if (room.floor) {
      location += ` (${room.floor as string})`
    }
    if (edition.venue) {
      location += `, ${edition.venue as string}`
    }
    lines.push(`LOCATION:${escapeIcal(location)}`)
  }

  lines.push(`DESCRIPTION:${escapeIcal(description)}`)

  if (track) {
    lines.push(`CATEGORIES:${escapeIcal(track.name as string)}`)
  }

  lines.push('END:VEVENT')

  return lines
}

/**
 * Load talks with speaker information
 */
async function loadTalks(
  pb: {
    collection: (name: string) => {
      getFullList: (options: Record<string, unknown>) => Promise<Record<string, unknown>[]>
    }
  },
  talkIds: string[]
): Promise<Talk[]> {
  if (talkIds.length === 0) return []

  const talkRecords = await pb.collection('talks').getFullList({
    filter: talkIds.map((id) => `id = "${id}"`).join(' || '),
    expand: 'speakerIds'
  })

  return talkRecords.map((t) => {
    const expandedSpeakers = t.expand?.speakerIds as Array<Record<string, unknown>> | undefined
    return {
      id: t.id as string,
      title: t.title as string,
      speakers: expandedSpeakers
        ? expandedSpeakers.map((s) => ({
            firstName: s.firstName as string,
            lastName: s.lastName as string,
            company: s.company as string | undefined
          }))
        : []
    }
  })
}

export const GET: RequestHandler = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get the edition by slug
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]

  if (edition.status !== 'published') {
    throw error(404, 'Schedule not available')
  }

  const editionId = edition.id as string
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  // Load all schedule data in parallel
  const [rooms, tracks, slots, sessions] = await Promise.all([
    locals.pb
      .collection('rooms')
      .getFullList({ filter: `editionId = "${editionId}"`, sort: 'order,name' }),
    locals.pb
      .collection('tracks')
      .getFullList({ filter: `editionId = "${editionId}"`, sort: 'order,name' }),
    locals.pb
      .collection('slots')
      .getFullList({ filter: `editionId = "${editionId}"`, sort: 'date,startTime' }),
    locals.pb.collection('sessions').getFullList({ filter: `editionId = "${editionId}"` })
  ])

  const talkIds = sessions.filter((s) => s.talkId).map((s) => s.talkId as string)
  const talks = await loadTalks(locals.pb, talkIds)

  // Build iCal content
  const calendarName = `${event.name as string} - ${edition.name as string}`
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open Event Orchestrator//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    `X-WR-CALDESC:Schedule for ${escapeIcal(edition.name as string)}`
  ]

  if (edition.city || edition.country) {
    const location = [edition.city, edition.country].filter(Boolean).join(', ')
    lines.push(`X-WR-TIMEZONE:${escapeIcal(location)}`)
  }

  // Add each session as a VEVENT
  for (const session of sessions) {
    const slot = slots.find((s) => s.id === session.slotId)
    if (!slot) continue

    const eventLines = buildSessionEvent({
      session,
      slot,
      room: rooms.find((r) => r.id === slot.roomId),
      track: session.trackId ? tracks.find((t) => t.id === session.trackId) || null : null,
      talk: session.talkId ? talks.find((t) => t.id === session.talkId) : undefined,
      edition,
      editionSlug
    })
    lines.push(...eventLines)
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${editionSlug}-schedule.ics"`
    }
  })
}
