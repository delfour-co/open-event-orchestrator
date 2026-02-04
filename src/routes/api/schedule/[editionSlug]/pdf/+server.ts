import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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

interface ScheduleData {
  rooms: Record<string, unknown>[]
  tracks: Record<string, unknown>[]
  slots: Record<string, unknown>[]
  sessions: Record<string, unknown>[]
  talks: Talk[]
}

function buildSessionHtml(
  slot: Record<string, unknown>,
  session: Record<string, unknown> | undefined,
  talks: Talk[],
  tracks: Record<string, unknown>[]
): string {
  if (!session) {
    return `<div class="empty-slot">
      <div class="session-time">${slot.startTime} - ${slot.endTime}</div>
      <div>No session</div>
    </div>`
  }

  const talk = session.talkId ? talks.find((t) => t.id === session.talkId) : null
  const track = session.trackId ? tracks.find((t) => t.id === session.trackId) : null
  const trackColor = (track?.color as string) || '#6b7280'
  const trackName = (track?.name as string) || ''
  const speakers = talk?.speakers?.length
    ? talk.speakers.map((s) => `${s.firstName} ${s.lastName}`).join(', ')
    : ''

  return `<div class="session" style="border-left-color: ${trackColor}; background-color: ${trackColor}10;">
    <div class="session-time">${slot.startTime} - ${slot.endTime}</div>
    <div class="session-title">${escapeHtml(session.title as string)}</div>
    <div class="session-meta">${getSessionTypeLabel(session.type as string)}${trackName ? ` | ${escapeHtml(trackName)}` : ''}</div>
    ${speakers ? `<div class="session-speakers">${escapeHtml(speakers)}</div>` : ''}
  </div>`
}

function buildRoomRow(
  room: Record<string, unknown>,
  uniqueDates: string[],
  slotsByRoomAndDate: Record<string, Record<string, Record<string, unknown>[]>>,
  data: ScheduleData
): string {
  const roomId = room.id as string
  const roomCell = `<td>
    <div class="room-name">${escapeHtml(room.name as string)}</div>
    ${room.capacity ? `<div class="room-details">Capacity: ${room.capacity}</div>` : ''}
    ${room.floor ? `<div class="room-details">${escapeHtml(room.floor as string)}</div>` : ''}
  </td>`

  const dayCells = uniqueDates.map((dateStr) => {
    const daySlots = slotsByRoomAndDate[roomId]?.[dateStr] || []
    if (daySlots.length === 0) return '<td></td>'

    const sessionHtmls = daySlots.map((slot) => {
      const session = data.sessions.find((s) => s.slotId === slot.id)
      return buildSessionHtml(slot, session, data.talks, data.tracks)
    })

    return `<td>${sessionHtmls.join('')}</td>`
  })

  return `<tr>${roomCell}${dayCells.join('')}</tr>`
}

function buildScheduleTable(
  uniqueDates: string[],
  data: ScheduleData,
  slotsByRoomAndDate: Record<string, Record<string, Record<string, unknown>[]>>
): string {
  if (uniqueDates.length === 0 || data.sessions.length === 0) {
    return `<div style="text-align: center; padding: 40px; color: #666;">
      <p>No schedule available yet.</p>
    </div>`
  }

  const headerCells = uniqueDates.map((d) => `<th>${formatShortDate(new Date(d))}</th>`).join('')
  const bodyRows = data.rooms
    .map((room) => buildRoomRow(room, uniqueDates, slotsByRoomAndDate, data))
    .join('')

  return `<table class="schedule-table">
    <thead><tr><th class="room-header">Room</th>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>`
}

function buildTrackLegend(tracks: Record<string, unknown>[]): string {
  if (tracks.length === 0) return ''

  const items = tracks
    .map(
      (t) => `<div class="track-item">
      <div class="track-color" style="background-color: ${t.color}"></div>
      <span>${escapeHtml(t.name as string)}</span>
    </div>`
    )
    .join('')

  return `<div class="track-legend"><h3>Track Legend</h3><div class="track-list">${items}</div></div>`
}

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
    const expand = t.expand as { speakerIds?: Array<Record<string, unknown>> } | undefined
    const expandedSpeakers = expand?.speakerIds
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

const CSS_STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.4; color: #1a1a1a; background: white; }
.container { max-width: 100%; padding: 20px; }
.header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5; }
.header h1 { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
.header .subtitle { font-size: 18px; color: #666; margin-bottom: 10px; }
.header .event-info { font-size: 14px; color: #444; }
.header .event-info span { margin: 0 10px; }
.schedule-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
.schedule-table th, .schedule-table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
.schedule-table th { background-color: #f3f4f6; font-weight: 600; text-align: center; }
.schedule-table th.room-header { text-align: left; width: 120px; }
.room-name { font-weight: 600; }
.room-details { font-size: 10px; color: #666; }
.session { padding: 6px; border-radius: 4px; margin-bottom: 6px; border-left: 4px solid; background-color: #fafafa; }
.session:last-child { margin-bottom: 0; }
.session-time { font-size: 10px; color: #666; margin-bottom: 2px; }
.session-title { font-weight: 600; margin-bottom: 2px; }
.session-meta { font-size: 10px; color: #666; }
.session-speakers { font-size: 10px; color: #444; margin-top: 3px; }
.empty-slot { padding: 6px; color: #999; font-style: italic; border: 1px dashed #d1d5db; border-radius: 4px; margin-bottom: 6px; }
.empty-slot:last-child { margin-bottom: 0; }
.track-legend { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e5e5; }
.track-legend h3 { font-size: 14px; margin-bottom: 10px; }
.track-list { display: flex; flex-wrap: wrap; gap: 15px; }
.track-item { display: flex; align-items: center; gap: 6px; }
.track-color { width: 14px; height: 14px; border-radius: 50%; }
.footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 10px; color: #666; }
@media print {
  body { font-size: 10px; }
  .container { padding: 10px; }
  .header { margin-bottom: 20px; padding-bottom: 15px; }
  .header h1 { font-size: 22px; }
  .header .subtitle { font-size: 14px; }
  .schedule-table th, .schedule-table td { padding: 5px; }
  .session { padding: 4px; margin-bottom: 4px; }
  .track-legend { page-break-inside: avoid; }
  .footer { margin-top: 20px; padding-top: 10px; }
  @page { margin: 1cm; size: landscape; }
}
`

export const GET: RequestHandler = async ({ params, locals }) => {
  const { editionSlug } = params

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

  const data: ScheduleData = { rooms, tracks, slots, sessions, talks }

  const uniqueDates = [
    ...new Set(slots.map((s) => new Date(s.date as string).toISOString().split('T')[0]))
  ].sort()

  const slotsByRoomAndDate: Record<string, Record<string, Record<string, unknown>[]>> = {}
  for (const room of rooms) {
    slotsByRoomAndDate[room.id as string] = {}
    for (const dateStr of uniqueDates) {
      slotsByRoomAndDate[room.id as string][dateStr] = slots.filter(
        (s) =>
          (s.roomId as string) === room.id &&
          new Date(s.date as string).toISOString().split('T')[0] === dateStr
      )
    }
  }

  const locationParts = [edition.venue, edition.city, edition.country].filter(Boolean)
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : ''
  const startDate = new Date(edition.startDate as string)
  const endDate = new Date(edition.endDate as string)
  const dateRange =
    endDate.getTime() !== startDate.getTime()
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : formatDate(startDate)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Schedule - ${escapeHtml(edition.name as string)}</title>
  <style>${CSS_STYLES}</style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${escapeHtml(edition.name as string)}</h1>
      <div class="subtitle">Schedule</div>
      <div class="event-info">
        <span>${dateRange}</span>
        ${locationStr ? `<span>|</span><span>${escapeHtml(locationStr)}</span>` : ''}
      </div>
    </header>
    ${buildScheduleTable(uniqueDates, data, slotsByRoomAndDate)}
    ${buildTrackLegend(tracks)}
    <footer class="footer">
      <p>Generated by Open Event Orchestrator on ${formatDate(new Date())}</p>
      <p style="margin-top: 5px;">Use your browser's Print function (Ctrl+P / Cmd+P) to save as PDF</p>
    </footer>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
