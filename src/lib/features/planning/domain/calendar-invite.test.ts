/**
 * Calendar Invite Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type SessionCalendarInfo,
  type SpeakerCalendarInfo,
  buildEventDescription,
  buildLocationString,
  calculateSessionDuration,
  escapeIcal,
  formatIcalDate,
  formatIcalDateTime,
  formatSessionDuration,
  generateEventUid,
  generateIcalInvite,
  getCalendarInviteEmailHtml,
  getCalendarInviteEmailText,
  getCalendarInviteSubject,
  needsCalendarUpdate,
  shouldSendCalendarInvite
} from './calendar-invite'

// Test fixtures
const createSessionInfo = (overrides?: Partial<SessionCalendarInfo>): SessionCalendarInfo => ({
  sessionId: 'session-123',
  editionId: 'edition-456',
  title: 'Building Scalable APIs',
  description: 'Learn how to build APIs that scale',
  date: new Date('2025-06-15'),
  startTime: '14:00',
  endTime: '15:00',
  roomName: 'Main Hall',
  roomFloor: 'Floor 1',
  trackName: 'Backend',
  eventName: 'DevConf 2025',
  eventLocation: 'Paris, France',
  organizerEmail: 'organizer@devconf.com',
  organizerName: 'DevConf Team',
  programUrl: 'https://devconf.com/program',
  speakerNotes: 'Please arrive 10 minutes early',
  ...overrides
})

const createSpeakerInfo = (overrides?: Partial<SpeakerCalendarInfo>): SpeakerCalendarInfo => ({
  speakerId: 'speaker-789',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  ...overrides
})

describe('formatIcalDateTime', () => {
  it('should format date and time correctly', () => {
    const date = new Date('2025-06-15')
    const result = formatIcalDateTime(date, '14:30')
    expect(result).toBe('20250615T143000')
  })

  it('should handle midnight', () => {
    const date = new Date('2025-01-01')
    const result = formatIcalDateTime(date, '00:00')
    expect(result).toBe('20250101T000000')
  })

  it('should handle end of day', () => {
    const date = new Date('2025-12-31')
    const result = formatIcalDateTime(date, '23:59')
    expect(result).toBe('20251231T235900')
  })
})

describe('formatIcalDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-06-15')
    const result = formatIcalDate(date)
    expect(result).toBe('20250615')
  })

  it('should pad single digit months', () => {
    const date = new Date('2025-01-05')
    const result = formatIcalDate(date)
    expect(result).toBe('20250105')
  })
})

describe('escapeIcal', () => {
  it('should escape backslashes', () => {
    expect(escapeIcal('path\\to\\file')).toBe('path\\\\to\\\\file')
  })

  it('should escape semicolons', () => {
    expect(escapeIcal('item1;item2')).toBe('item1\\;item2')
  })

  it('should escape commas', () => {
    expect(escapeIcal('one, two, three')).toBe('one\\, two\\, three')
  })

  it('should escape newlines', () => {
    expect(escapeIcal('line1\nline2')).toBe('line1\\nline2')
  })

  it('should handle multiple special characters', () => {
    const input = 'Hello; World,\nNew line \\ test'
    const expected = 'Hello\\; World\\,\\nNew line \\\\ test'
    expect(escapeIcal(input)).toBe(expected)
  })
})

describe('generateEventUid', () => {
  it('should generate unique UID', () => {
    const uid = generateEventUid('session-123', 'speaker-456', 'devconf.com')
    expect(uid).toBe('session-session-123-speaker-speaker-456@devconf.com')
  })
})

describe('buildLocationString', () => {
  it('should build full location with room and floor', () => {
    const result = buildLocationString('Main Hall', 'Floor 1', 'Paris, France')
    expect(result).toBe('Main Hall (Floor 1) - Paris, France')
  })

  it('should handle room without floor', () => {
    const result = buildLocationString('Conference Room', undefined, 'London, UK')
    expect(result).toBe('Conference Room - London, UK')
  })

  it('should handle only event location', () => {
    const result = buildLocationString(undefined, undefined, 'Berlin, Germany')
    expect(result).toBe('Berlin, Germany')
  })

  it('should handle only room', () => {
    const result = buildLocationString('Room A')
    expect(result).toBe('Room A')
  })

  it('should return empty string when no location info', () => {
    const result = buildLocationString()
    expect(result).toBe('')
  })
})

describe('buildEventDescription', () => {
  it('should build full description', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const description = buildEventDescription(session, speaker)

    expect(description).toContain('Building Scalable APIs')
    expect(description).toContain('DevConf 2025')
    expect(description).toContain('Session Description:')
    expect(description).toContain('Learn how to build APIs that scale')
    expect(description).toContain('Track: Backend')
    expect(description).toContain('Room: Main Hall (Floor 1)')
    expect(description).toContain('Time: 14:00 - 15:00')
    expect(description).toContain('Notes:')
    expect(description).toContain('Please arrive 10 minutes early')
    expect(description).toContain('View program: https://devconf.com/program')
  })

  it('should handle minimal session info', () => {
    const session = createSessionInfo({
      description: undefined,
      trackName: undefined,
      roomName: undefined,
      speakerNotes: undefined,
      programUrl: undefined
    })
    const speaker = createSpeakerInfo()

    const description = buildEventDescription(session, speaker)

    expect(description).toContain('Building Scalable APIs')
    expect(description).toContain('DevConf 2025')
    expect(description).not.toContain('Session Description:')
    expect(description).not.toContain('Track:')
    expect(description).not.toContain('Notes:')
    expect(description).not.toContain('View program:')
  })
})

describe('generateIcalInvite', () => {
  it('should generate valid iCal for REQUEST method', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const ical = generateIcalInvite(session, speaker, 'REQUEST', 0, 'devconf.com')

    expect(ical).toContain('BEGIN:VCALENDAR')
    expect(ical).toContain('VERSION:2.0')
    expect(ical).toContain('METHOD:REQUEST')
    expect(ical).toContain('BEGIN:VEVENT')
    expect(ical).toContain('UID:session-session-123-speaker-speaker-789@devconf.com')
    expect(ical).toContain('DTSTART:20250615T140000')
    expect(ical).toContain('DTEND:20250615T150000')
    expect(ical).toContain('SEQUENCE:0')
    expect(ical).toContain('SUMMARY:[Speaker] Building Scalable APIs')
    expect(ical).toContain('ORGANIZER;CN=DevConf Team:mailto:organizer@devconf.com')
    expect(ical).toContain(
      'ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=John Doe:mailto:john@example.com'
    )
    expect(ical).toContain('STATUS:CONFIRMED')
    expect(ical).toContain('END:VEVENT')
    expect(ical).toContain('END:VCALENDAR')
  })

  it('should generate valid iCal for CANCEL method', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const ical = generateIcalInvite(session, speaker, 'CANCEL', 1, 'devconf.com')

    expect(ical).toContain('METHOD:CANCEL')
    expect(ical).toContain('SEQUENCE:1')
    expect(ical).toContain('STATUS:CANCELLED')
  })

  it('should use CRLF line endings (RFC 5545)', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const ical = generateIcalInvite(session, speaker, 'REQUEST', 0, 'devconf.com')

    expect(ical).toContain('\r\n')
  })

  it('should handle organizer without name', () => {
    const session = createSessionInfo({ organizerName: undefined })
    const speaker = createSpeakerInfo()

    const ical = generateIcalInvite(session, speaker, 'REQUEST', 0, 'devconf.com')

    expect(ical).toContain('ORGANIZER:mailto:organizer@devconf.com')
    expect(ical).not.toContain('ORGANIZER;CN=')
  })

  it('should include track as category', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const ical = generateIcalInvite(session, speaker, 'REQUEST', 0, 'devconf.com')

    expect(ical).toContain('CATEGORIES:Speaker Session')
    expect(ical).toContain('CATEGORIES:Backend')
  })

  it('should include location', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const ical = generateIcalInvite(session, speaker, 'REQUEST', 0, 'devconf.com')

    expect(ical).toContain('LOCATION:Main Hall (Floor 1) - Paris\\, France')
  })
})

describe('calculateSessionDuration', () => {
  it('should calculate 1 hour duration', () => {
    expect(calculateSessionDuration('14:00', '15:00')).toBe(60)
  })

  it('should calculate 30 minute duration', () => {
    expect(calculateSessionDuration('10:00', '10:30')).toBe(30)
  })

  it('should calculate 1h30 duration', () => {
    expect(calculateSessionDuration('09:00', '10:30')).toBe(90)
  })

  it('should handle crossing hours', () => {
    expect(calculateSessionDuration('11:45', '12:15')).toBe(30)
  })
})

describe('formatSessionDuration', () => {
  it('should format minutes only', () => {
    expect(formatSessionDuration('10:00', '10:45')).toBe('45min')
  })

  it('should format exact hours', () => {
    expect(formatSessionDuration('10:00', '12:00')).toBe('2h')
  })

  it('should format hours and minutes', () => {
    expect(formatSessionDuration('10:00', '11:30')).toBe('1h 30min')
  })
})

describe('shouldSendCalendarInvite', () => {
  it('should return true when session has slot and talk', () => {
    expect(shouldSendCalendarInvite(true, true)).toBe(true)
  })

  it('should return false when session has no slot', () => {
    expect(shouldSendCalendarInvite(false, true)).toBe(false)
  })

  it('should return false when session has no talk', () => {
    expect(shouldSendCalendarInvite(true, false)).toBe(false)
  })

  it('should return false when session has neither', () => {
    expect(shouldSendCalendarInvite(false, false)).toBe(false)
  })
})

describe('needsCalendarUpdate', () => {
  it('should detect date change', () => {
    const previous = createSessionInfo({ date: new Date('2025-06-15') })
    const current = createSessionInfo({ date: new Date('2025-06-16') })

    expect(needsCalendarUpdate(previous, current)).toBe(true)
  })

  it('should detect start time change', () => {
    const previous = createSessionInfo({ startTime: '14:00' })
    const current = createSessionInfo({ startTime: '15:00' })

    expect(needsCalendarUpdate(previous, current)).toBe(true)
  })

  it('should detect end time change', () => {
    const previous = createSessionInfo({ endTime: '15:00' })
    const current = createSessionInfo({ endTime: '16:00' })

    expect(needsCalendarUpdate(previous, current)).toBe(true)
  })

  it('should detect room change', () => {
    const previous = createSessionInfo({ roomName: 'Room A' })
    const current = createSessionInfo({ roomName: 'Room B' })

    expect(needsCalendarUpdate(previous, current)).toBe(true)
  })

  it('should detect title change', () => {
    const previous = createSessionInfo({ title: 'Title A' })
    const current = createSessionInfo({ title: 'Title B' })

    expect(needsCalendarUpdate(previous, current)).toBe(true)
  })

  it('should return false when nothing changed', () => {
    const previous = createSessionInfo()
    const current = createSessionInfo()

    expect(needsCalendarUpdate(previous, current)).toBe(false)
  })

  it('should ignore description change', () => {
    const previous = createSessionInfo({ description: 'Desc A' })
    const current = createSessionInfo({ description: 'Desc B' })

    expect(needsCalendarUpdate(previous, current)).toBe(false)
  })
})

describe('getCalendarInviteSubject', () => {
  it('should return scheduled subject for REQUEST', () => {
    const subject = getCalendarInviteSubject('REQUEST', 'My Talk', 'DevConf')
    expect(subject).toBe('Session scheduled: My Talk at DevConf')
  })

  it('should return cancelled subject for CANCEL', () => {
    const subject = getCalendarInviteSubject('CANCEL', 'My Talk', 'DevConf')
    expect(subject).toBe('Session cancelled: My Talk at DevConf')
  })
})

describe('getCalendarInviteEmailHtml', () => {
  it('should generate scheduled email HTML', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const html = getCalendarInviteEmailHtml('REQUEST', session, speaker)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Your Session is Scheduled!')
    expect(html).toContain('Hello John')
    expect(html).toContain('Building Scalable APIs')
    expect(html).toContain('DevConf 2025')
    expect(html).toContain('14:00 - 15:00')
    expect(html).toContain('Main Hall')
    expect(html).toContain('Backend')
    expect(html).toContain('calendar invitation is attached')
    expect(html).toContain('https://devconf.com/program')
    expect(html).toContain('Please arrive 10 minutes early')
  })

  it('should generate cancelled email HTML', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const html = getCalendarInviteEmailHtml('CANCEL', session, speaker)

    expect(html).toContain('Session Cancelled')
    expect(html).toContain('Hello John')
    expect(html).toContain('Building Scalable APIs')
    expect(html).toContain('has been cancelled or rescheduled')
  })

  it('should handle minimal session info', () => {
    const session = createSessionInfo({
      roomName: undefined,
      trackName: undefined,
      speakerNotes: undefined,
      programUrl: undefined
    })
    const speaker = createSpeakerInfo()

    const html = getCalendarInviteEmailHtml('REQUEST', session, speaker)

    expect(html).not.toContain('<strong>Room:</strong>')
    expect(html).not.toContain('<strong>Track:</strong>')
    expect(html).not.toContain('Notes from organizers')
    expect(html).not.toContain('View the full program')
  })
})

describe('getCalendarInviteEmailText', () => {
  it('should generate scheduled email text', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const text = getCalendarInviteEmailText('REQUEST', session, speaker)

    expect(text).toContain('Your Session is Scheduled!')
    expect(text).toContain('Hello John')
    expect(text).toContain('Building Scalable APIs')
    expect(text).toContain('DevConf 2025')
    expect(text).toContain('14:00 - 15:00')
    expect(text).toContain('Room: Main Hall')
    expect(text).toContain('Track: Backend')
    expect(text).toContain('Please arrive 10 minutes early')
    expect(text).toContain('https://devconf.com/program')
  })

  it('should generate cancelled email text', () => {
    const session = createSessionInfo()
    const speaker = createSpeakerInfo()

    const text = getCalendarInviteEmailText('CANCEL', session, speaker)

    expect(text).toContain('Session Cancelled')
    expect(text).toContain('Hello John')
    expect(text).toContain('has been cancelled or rescheduled')
  })
})
