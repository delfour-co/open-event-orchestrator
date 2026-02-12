/**
 * iCal Export Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type IcalEventInfo,
  type IcalSession,
  buildDayCalendarUrl,
  buildGoogleCalendarUrl,
  buildIcalLocation,
  buildOutlookCalendarUrl,
  buildScheduleCalendarUrl,
  buildSessionDescription,
  buildTrackCalendarUrl,
  buildWebcalUrl,
  escapeIcalText,
  exportDaySchedule,
  exportFilteredSchedule,
  exportFullSchedule,
  exportSingleSession,
  exportTrackSchedule,
  foldIcalLine,
  formatIcalDateOnly,
  formatIcalDateTimeUtc,
  formatIcalDateTimeWithTz,
  generateIcalCalendar,
  generateSessionUid,
  getIcalMimeType,
  getUniqueDates,
  getUniqueTracks,
  isValidIcalContent,
  parseIcalDate,
  sortSessionsByDateTime
} from './ical-export'

// Test fixtures
const createSession = (overrides?: Partial<IcalSession>): IcalSession => ({
  id: 'session-001',
  title: 'Introduction to TypeScript',
  description: 'Learn the basics of TypeScript',
  date: new Date('2025-06-15'),
  startTime: '09:00',
  endTime: '10:00',
  roomName: 'Room A',
  roomFloor: 'Floor 1',
  trackName: 'Web Development',
  speakerNames: ['John Doe', 'Jane Smith'],
  language: 'en',
  level: 'Beginner',
  tags: ['typescript', 'javascript'],
  ...overrides
})

const createEventInfo = (overrides?: Partial<IcalEventInfo>): IcalEventInfo => ({
  eventName: 'Tech Conference',
  eventSlug: 'tech-conf',
  editionName: '2025',
  editionSlug: 'tech-conf-2025',
  location: 'Paris, France',
  timezone: 'Europe/Paris',
  organizerEmail: 'contact@techconf.com',
  organizerName: 'Tech Conference Team',
  baseUrl: 'https://techconf.com',
  ...overrides
})

describe('Date Formatting', () => {
  describe('formatIcalDateTimeWithTz', () => {
    it('should format date with timezone', () => {
      const date = new Date('2025-06-15')
      const result = formatIcalDateTimeWithTz(date, '09:30', 'Europe/Paris')
      expect(result).toBe('TZID=Europe/Paris:20250615T093000')
    })
  })

  describe('formatIcalDateTimeUtc', () => {
    it('should format date in UTC', () => {
      const date = new Date('2025-06-15T12:30:45Z')
      const result = formatIcalDateTimeUtc(date)
      expect(result).toBe('20250615T123045Z')
    })
  })

  describe('formatIcalDateOnly', () => {
    it('should format date without time', () => {
      const date = new Date('2025-06-15')
      const result = formatIcalDateOnly(date)
      expect(result).toBe('20250615')
    })
  })

  describe('parseIcalDate', () => {
    it('should parse iCal date format', () => {
      const result = parseIcalDate('20250615')
      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(5) // June (0-indexed)
      expect(result.getDate()).toBe(15)
    })
  })
})

describe('Text Escaping', () => {
  describe('escapeIcalText', () => {
    it('should escape backslashes', () => {
      expect(escapeIcalText('path\\to\\file')).toBe('path\\\\to\\\\file')
    })

    it('should escape semicolons', () => {
      expect(escapeIcalText('a;b;c')).toBe('a\\;b\\;c')
    })

    it('should escape commas', () => {
      expect(escapeIcalText('a,b,c')).toBe('a\\,b\\,c')
    })

    it('should escape newlines', () => {
      expect(escapeIcalText('line1\nline2')).toBe('line1\\nline2')
    })

    it('should handle combined escapes', () => {
      expect(escapeIcalText('a;b,c\nd')).toBe('a\\;b\\,c\\nd')
    })
  })

  describe('foldIcalLine', () => {
    it('should not fold short lines', () => {
      const line = 'SHORT LINE'
      expect(foldIcalLine(line)).toBe(line)
    })

    it('should fold long lines', () => {
      const line = 'A'.repeat(100)
      const result = foldIcalLine(line)
      expect(result).toContain('\r\n ')
    })

    it('should respect custom max length', () => {
      const line = 'A'.repeat(30)
      const result = foldIcalLine(line, 20)
      expect(result).toContain('\r\n ')
    })
  })
})

describe('UID Generation', () => {
  describe('generateSessionUid', () => {
    it('should generate correct UID format', () => {
      const uid = generateSessionUid('session-123', 'example.com')
      expect(uid).toBe('session-session-123@example.com')
    })
  })
})

describe('Location Building', () => {
  describe('buildIcalLocation', () => {
    it('should build location with room only', () => {
      expect(buildIcalLocation('Room A')).toBe('Room A')
    })

    it('should build location with room and floor', () => {
      expect(buildIcalLocation('Room A', 'Floor 1')).toBe('Room A (Floor 1)')
    })

    it('should build location with venue only', () => {
      expect(buildIcalLocation(undefined, undefined, 'Convention Center')).toBe('Convention Center')
    })

    it('should build location with all parts', () => {
      expect(buildIcalLocation('Room A', 'Floor 1', 'Convention Center')).toBe(
        'Room A (Floor 1), Convention Center'
      )
    })

    it('should return empty string when all undefined', () => {
      expect(buildIcalLocation()).toBe('')
    })
  })
})

describe('Description Building', () => {
  describe('buildSessionDescription', () => {
    it('should build full description', () => {
      const session = createSession()
      const result = buildSessionDescription(session, 'full', 'https://example.com/session/1')

      expect(result).toContain('Learn the basics of TypeScript')
      expect(result).toContain('John Doe')
      expect(result).toContain('Web Development')
      expect(result).toContain('Beginner')
      expect(result).toContain('https://example.com/session/1')
    })

    it('should build compact description', () => {
      const session = createSession()
      const result = buildSessionDescription(session, 'compact', 'https://example.com/session/1')

      expect(result).toContain('John Doe')
      expect(result).toContain('Web Development')
      expect(result).not.toContain('Learn the basics')
    })

    it('should handle session without speakers', () => {
      const session = createSession({ speakerNames: [] })
      const result = buildSessionDescription(session, 'compact')

      expect(result).not.toContain('By')
    })
  })
})

describe('iCal Generation', () => {
  describe('generateIcalCalendar', () => {
    it('should generate valid iCal content', () => {
      const sessions = [createSession()]
      const eventInfo = createEventInfo()

      const result = generateIcalCalendar(sessions, eventInfo)

      expect(result).toContain('BEGIN:VCALENDAR')
      expect(result).toContain('END:VCALENDAR')
      expect(result).toContain('VERSION:2.0')
      expect(result).toContain('BEGIN:VEVENT')
      expect(result).toContain('END:VEVENT')
    })

    it('should include calendar name', () => {
      const sessions = [createSession()]
      const eventInfo = createEventInfo()

      const result = generateIcalCalendar(sessions, eventInfo)

      expect(result).toContain('X-WR-CALNAME')
      expect(result).toContain('Tech Conference')
    })

    it('should include timezone', () => {
      const sessions = [createSession()]
      const eventInfo = createEventInfo({ timezone: 'Europe/Paris' })

      const result = generateIcalCalendar(sessions, eventInfo)

      expect(result).toContain('X-WR-TIMEZONE:Europe/Paris')
      expect(result).toContain('BEGIN:VTIMEZONE')
    })

    it('should generate multiple events', () => {
      const sessions = [createSession({ id: 'session-1' }), createSession({ id: 'session-2' })]
      const eventInfo = createEventInfo()

      const result = generateIcalCalendar(sessions, eventInfo)

      const eventCount = (result.match(/BEGIN:VEVENT/g) || []).length
      expect(eventCount).toBe(2)
    })
  })

  describe('isValidIcalContent', () => {
    it('should validate correct iCal content', () => {
      const content = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR'
      expect(isValidIcalContent(content)).toBe(true)
    })

    it('should reject content without calendar start', () => {
      const content = 'VERSION:2.0\r\nEND:VCALENDAR'
      expect(isValidIcalContent(content)).toBe(false)
    })

    it('should reject content without version', () => {
      const content = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR'
      expect(isValidIcalContent(content)).toBe(false)
    })
  })
})

describe('Export Functions', () => {
  describe('exportFullSchedule', () => {
    it('should export all sessions', () => {
      const sessions = [createSession({ id: 'session-1' }), createSession({ id: 'session-2' })]
      const eventInfo = createEventInfo()

      const result = exportFullSchedule(sessions, eventInfo)

      expect(result.sessionCount).toBe(2)
      expect(result.filename).toBe('tech-conf-2025-schedule.ics')
      expect(isValidIcalContent(result.content)).toBe(true)
    })
  })

  describe('exportTrackSchedule', () => {
    it('should filter by track', () => {
      const sessions = [
        createSession({ id: 'session-1', trackName: 'Web Development' }),
        createSession({ id: 'session-2', trackName: 'Mobile' }),
        createSession({ id: 'session-3', trackName: 'Web Development' })
      ]
      const eventInfo = createEventInfo()

      const result = exportTrackSchedule(sessions, 'Web Development', eventInfo)

      expect(result.sessionCount).toBe(2)
      expect(result.filename).toContain('web-development')
    })
  })

  describe('exportDaySchedule', () => {
    it('should filter by date', () => {
      const sessions = [
        createSession({ id: 'session-1', date: new Date('2025-06-15') }),
        createSession({ id: 'session-2', date: new Date('2025-06-16') }),
        createSession({ id: 'session-3', date: new Date('2025-06-15') })
      ]
      const eventInfo = createEventInfo()

      const result = exportDaySchedule(sessions, new Date('2025-06-15'), eventInfo)

      expect(result.sessionCount).toBe(2)
      expect(result.filename).toContain('20250615')
    })
  })

  describe('exportSingleSession', () => {
    it('should export single session', () => {
      const session = createSession()
      const eventInfo = createEventInfo()

      const result = exportSingleSession(session, eventInfo)

      expect(result.sessionCount).toBe(1)
      expect(result.filename).toBe('session-session-001.ics')
    })
  })

  describe('exportFilteredSchedule', () => {
    it('should apply multiple filters', () => {
      const sessions = [
        createSession({ id: '1', trackName: 'Web', date: new Date('2025-06-15') }),
        createSession({ id: '2', trackName: 'Web', date: new Date('2025-06-16') }),
        createSession({ id: '3', trackName: 'Mobile', date: new Date('2025-06-15') })
      ]
      const eventInfo = createEventInfo()

      const result = exportFilteredSchedule(
        sessions,
        { trackId: 'Web', date: new Date('2025-06-15') },
        eventInfo
      )

      expect(result.sessionCount).toBe(1)
    })

    it('should filter by session IDs', () => {
      const sessions = [
        createSession({ id: '1' }),
        createSession({ id: '2' }),
        createSession({ id: '3' })
      ]
      const eventInfo = createEventInfo()

      const result = exportFilteredSchedule(sessions, { sessionIds: ['1', '3'] }, eventInfo)

      expect(result.sessionCount).toBe(2)
    })
  })
})

describe('URL Generation', () => {
  describe('buildScheduleCalendarUrl', () => {
    it('should build correct URL', () => {
      const result = buildScheduleCalendarUrl('https://example.com', 'conf-2025')
      expect(result).toBe('https://example.com/api/schedule/conf-2025/ical')
    })
  })

  describe('buildTrackCalendarUrl', () => {
    it('should build URL with track parameter', () => {
      const result = buildTrackCalendarUrl('https://example.com', 'conf-2025', 'web-dev')
      expect(result).toBe('https://example.com/api/schedule/conf-2025/ical?track=web-dev')
    })
  })

  describe('buildDayCalendarUrl', () => {
    it('should build URL with date parameter', () => {
      const result = buildDayCalendarUrl('https://example.com', 'conf-2025', new Date('2025-06-15'))
      expect(result).toBe('https://example.com/api/schedule/conf-2025/ical?date=20250615')
    })
  })

  describe('buildWebcalUrl', () => {
    it('should convert https to webcal', () => {
      const result = buildWebcalUrl('https://example.com/calendar.ics')
      expect(result).toBe('webcal://example.com/calendar.ics')
    })

    it('should convert http to webcal', () => {
      const result = buildWebcalUrl('http://example.com/calendar.ics')
      expect(result).toBe('webcal://example.com/calendar.ics')
    })
  })

  describe('buildGoogleCalendarUrl', () => {
    it('should build Google Calendar URL', () => {
      const result = buildGoogleCalendarUrl('https://example.com/cal.ics')
      expect(result).toContain('calendar.google.com')
      expect(result).toContain(encodeURIComponent('https://example.com/cal.ics'))
    })
  })

  describe('buildOutlookCalendarUrl', () => {
    it('should build Outlook Calendar URL', () => {
      const result = buildOutlookCalendarUrl('https://example.com/cal.ics')
      expect(result).toContain('outlook.live.com')
      expect(result).toContain(encodeURIComponent('https://example.com/cal.ics'))
    })
  })
})

describe('Utility Functions', () => {
  describe('getIcalMimeType', () => {
    it('should return correct MIME type', () => {
      expect(getIcalMimeType()).toBe('text/calendar; charset=utf-8')
    })
  })

  describe('sortSessionsByDateTime', () => {
    it('should sort by date then time', () => {
      const sessions = [
        createSession({ id: '1', date: new Date('2025-06-16'), startTime: '09:00' }),
        createSession({ id: '2', date: new Date('2025-06-15'), startTime: '14:00' }),
        createSession({ id: '3', date: new Date('2025-06-15'), startTime: '09:00' })
      ]

      const result = sortSessionsByDateTime(sessions)

      expect(result[0].id).toBe('3')
      expect(result[1].id).toBe('2')
      expect(result[2].id).toBe('1')
    })
  })

  describe('getUniqueDates', () => {
    it('should return unique dates sorted', () => {
      const sessions = [
        createSession({ date: new Date('2025-06-16') }),
        createSession({ date: new Date('2025-06-15') }),
        createSession({ date: new Date('2025-06-16') }),
        createSession({ date: new Date('2025-06-17') })
      ]

      const result = getUniqueDates(sessions)

      expect(result).toHaveLength(3)
      expect(formatIcalDateOnly(result[0])).toBe('20250615')
      expect(formatIcalDateOnly(result[1])).toBe('20250616')
      expect(formatIcalDateOnly(result[2])).toBe('20250617')
    })
  })

  describe('getUniqueTracks', () => {
    it('should return unique tracks sorted', () => {
      const sessions = [
        createSession({ trackName: 'Mobile' }),
        createSession({ trackName: 'Web' }),
        createSession({ trackName: 'Mobile' }),
        createSession({ trackName: 'AI' })
      ]

      const result = getUniqueTracks(sessions)

      expect(result).toHaveLength(3)
      expect(result).toEqual(['AI', 'Mobile', 'Web'])
    })

    it('should handle sessions without tracks', () => {
      const sessions = [
        createSession({ trackName: 'Web' }),
        createSession({ trackName: undefined })
      ]

      const result = getUniqueTracks(sessions)

      expect(result).toHaveLength(1)
      expect(result).toEqual(['Web'])
    })
  })
})
