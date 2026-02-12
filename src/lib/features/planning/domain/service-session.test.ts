import { describe, expect, it } from 'vitest'
import {
  SERVICE_SESSION_TEMPLATES,
  type ServiceSession,
  calculateDuration,
  calculateEndTime,
  createFromTemplate,
  filterGlobalSessions,
  filterPublicSessions,
  filterSessionsByRoom,
  formatDuration,
  formatTimeRange,
  getAvailableServiceTypes,
  getServiceSessionColor,
  getServiceSessionIcon,
  getServiceSessionTemplate,
  getServiceSessionTypeLabel,
  groupSessionsByDate,
  isGlobalSession,
  isPublicSession,
  serviceSessionsOverlap,
  sessionOverlapsTimeRange,
  sortServiceSessions
} from './service-session'

describe('service-session', () => {
  const createServiceSession = (
    id: string,
    overrides: Partial<ServiceSession> = {}
  ): ServiceSession => ({
    id,
    editionId: 'edition-1',
    type: 'break',
    title: 'Coffee Break',
    date: new Date('2024-06-15'),
    startTime: '10:00',
    endTime: '10:30',
    isGlobal: true,
    isPublic: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  describe('SERVICE_SESSION_TEMPLATES', () => {
    it('should have templates for all service session types', () => {
      expect(SERVICE_SESSION_TEMPLATES.break).toBeDefined()
      expect(SERVICE_SESSION_TEMPLATES.lunch).toBeDefined()
      expect(SERVICE_SESSION_TEMPLATES.registration).toBeDefined()
      expect(SERVICE_SESSION_TEMPLATES.networking).toBeDefined()
      expect(SERVICE_SESSION_TEMPLATES.sponsor).toBeDefined()
      expect(SERVICE_SESSION_TEMPLATES.announcement).toBeDefined()
      expect(SERVICE_SESSION_TEMPLATES.ceremony).toBeDefined()
      expect(SERVICE_SESSION_TEMPLATES.custom).toBeDefined()
    })

    it('should have valid default durations', () => {
      for (const template of Object.values(SERVICE_SESSION_TEMPLATES)) {
        expect(template.defaultDuration).toBeGreaterThan(0)
      }
    })
  })

  describe('getServiceSessionTemplate', () => {
    it('should return correct template for type', () => {
      const template = getServiceSessionTemplate('lunch')
      expect(template.type).toBe('lunch')
      expect(template.icon).toBe('utensils')
      expect(template.defaultDuration).toBe(60)
    })
  })

  describe('createFromTemplate', () => {
    it('should create session from template with defaults', () => {
      const date = new Date('2024-06-15')
      const session = createFromTemplate('break', 'edition-1', date, '10:00')

      expect(session.type).toBe('break')
      expect(session.title).toBe('Coffee Break')
      expect(session.icon).toBe('coffee')
      expect(session.isGlobal).toBe(true)
      expect(session.endTime).toBe('10:30') // 30 min default
    })

    it('should allow overriding template values', () => {
      const date = new Date('2024-06-15')
      const session = createFromTemplate('break', 'edition-1', date, '10:00', {
        title: 'Morning Coffee',
        endTime: '10:45'
      })

      expect(session.title).toBe('Morning Coffee')
      expect(session.endTime).toBe('10:45')
    })
  })

  describe('calculateEndTime', () => {
    it('should calculate end time correctly', () => {
      expect(calculateEndTime('09:00', 30)).toBe('09:30')
      expect(calculateEndTime('09:30', 60)).toBe('10:30')
      expect(calculateEndTime('23:30', 60)).toBe('00:30')
    })

    it('should handle midnight wraparound', () => {
      expect(calculateEndTime('23:00', 120)).toBe('01:00')
    })
  })

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      expect(calculateDuration('09:00', '09:30')).toBe(30)
      expect(calculateDuration('09:00', '10:30')).toBe(90)
      expect(calculateDuration('12:00', '13:00')).toBe(60)
    })
  })

  describe('isGlobalSession', () => {
    it('should return true for global sessions', () => {
      const session = createServiceSession('1', { isGlobal: true })
      expect(isGlobalSession(session)).toBe(true)
    })

    it('should return false for room-specific sessions', () => {
      const session = createServiceSession('1', { isGlobal: false, roomIds: ['room-1'] })
      expect(isGlobalSession(session)).toBe(false)
    })
  })

  describe('isPublicSession', () => {
    it('should return true for public sessions', () => {
      const session = createServiceSession('1', { isPublic: true })
      expect(isPublicSession(session)).toBe(true)
    })

    it('should return false for private sessions', () => {
      const session = createServiceSession('1', { isPublic: false })
      expect(isPublicSession(session)).toBe(false)
    })
  })

  describe('getServiceSessionTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getServiceSessionTypeLabel('break')).toBe('Coffee Break')
      expect(getServiceSessionTypeLabel('lunch')).toBe('Lunch Break')
      expect(getServiceSessionTypeLabel('registration')).toBe('Registration')
      expect(getServiceSessionTypeLabel('networking')).toBe('Networking')
    })
  })

  describe('getServiceSessionIcon', () => {
    it('should return correct icons', () => {
      expect(getServiceSessionIcon('break')).toBe('coffee')
      expect(getServiceSessionIcon('lunch')).toBe('utensils')
      expect(getServiceSessionIcon('registration')).toBe('clipboard-check')
    })
  })

  describe('getServiceSessionColor', () => {
    it('should return valid hex colors', () => {
      const color = getServiceSessionColor('break')
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  describe('serviceSessionsOverlap', () => {
    it('should detect overlapping sessions', () => {
      const s1 = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      const s2 = createServiceSession('2', { startTime: '10:15', endTime: '10:45' })
      expect(serviceSessionsOverlap(s1, s2)).toBe(true)
    })

    it('should return false for non-overlapping sessions', () => {
      const s1 = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      const s2 = createServiceSession('2', { startTime: '11:00', endTime: '11:30' })
      expect(serviceSessionsOverlap(s1, s2)).toBe(false)
    })

    it('should return false for adjacent sessions', () => {
      const s1 = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      const s2 = createServiceSession('2', { startTime: '10:30', endTime: '11:00' })
      expect(serviceSessionsOverlap(s1, s2)).toBe(false)
    })

    it('should return false for different dates', () => {
      const s1 = createServiceSession('1', { date: new Date('2024-06-15') })
      const s2 = createServiceSession('2', { date: new Date('2024-06-16') })
      expect(serviceSessionsOverlap(s1, s2)).toBe(false)
    })
  })

  describe('sessionOverlapsTimeRange', () => {
    it('should detect overlap with time range', () => {
      const session = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      expect(sessionOverlapsTimeRange(session, new Date('2024-06-15'), '10:15', '11:00')).toBe(true)
    })

    it('should return false for no overlap', () => {
      const session = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      expect(sessionOverlapsTimeRange(session, new Date('2024-06-15'), '11:00', '12:00')).toBe(
        false
      )
    })

    it('should return false for different date', () => {
      const session = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      expect(sessionOverlapsTimeRange(session, new Date('2024-06-16'), '10:00', '10:30')).toBe(
        false
      )
    })
  })

  describe('filterPublicSessions', () => {
    it('should filter only public sessions', () => {
      const sessions = [
        createServiceSession('1', { isPublic: true }),
        createServiceSession('2', { isPublic: false }),
        createServiceSession('3', { isPublic: true })
      ]
      const result = filterPublicSessions(sessions)
      expect(result).toHaveLength(2)
      expect(result.every((s) => s.isPublic)).toBe(true)
    })
  })

  describe('filterGlobalSessions', () => {
    it('should filter only global sessions', () => {
      const sessions = [
        createServiceSession('1', { isGlobal: true }),
        createServiceSession('2', { isGlobal: false }),
        createServiceSession('3', { isGlobal: true })
      ]
      const result = filterGlobalSessions(sessions)
      expect(result).toHaveLength(2)
      expect(result.every((s) => s.isGlobal)).toBe(true)
    })
  })

  describe('filterSessionsByRoom', () => {
    it('should include global sessions for any room', () => {
      const sessions = [createServiceSession('1', { isGlobal: true })]
      const result = filterSessionsByRoom(sessions, 'room-1')
      expect(result).toHaveLength(1)
    })

    it('should include room-specific sessions for matching room', () => {
      const sessions = [createServiceSession('1', { isGlobal: false, roomIds: ['room-1'] })]
      const result = filterSessionsByRoom(sessions, 'room-1')
      expect(result).toHaveLength(1)
    })

    it('should exclude room-specific sessions for non-matching room', () => {
      const sessions = [createServiceSession('1', { isGlobal: false, roomIds: ['room-1'] })]
      const result = filterSessionsByRoom(sessions, 'room-2')
      expect(result).toHaveLength(0)
    })
  })

  describe('sortServiceSessions', () => {
    it('should sort by date, then time, then order', () => {
      const sessions = [
        createServiceSession('3', {
          date: new Date('2024-06-15'),
          startTime: '10:00',
          sortOrder: 1
        }),
        createServiceSession('1', {
          date: new Date('2024-06-15'),
          startTime: '09:00',
          sortOrder: 0
        }),
        createServiceSession('2', {
          date: new Date('2024-06-15'),
          startTime: '10:00',
          sortOrder: 0
        })
      ]

      const sorted = sortServiceSessions(sessions)
      expect(sorted[0].id).toBe('1') // 09:00
      expect(sorted[1].id).toBe('2') // 10:00, order 0
      expect(sorted[2].id).toBe('3') // 10:00, order 1
    })

    it('should sort by date first', () => {
      const sessions = [
        createServiceSession('2', { date: new Date('2024-06-16') }),
        createServiceSession('1', { date: new Date('2024-06-15') })
      ]

      const sorted = sortServiceSessions(sessions)
      expect(sorted[0].id).toBe('1')
      expect(sorted[1].id).toBe('2')
    })
  })

  describe('groupSessionsByDate', () => {
    it('should group sessions by date', () => {
      const sessions = [
        createServiceSession('1', { date: new Date('2024-06-15') }),
        createServiceSession('2', { date: new Date('2024-06-15') }),
        createServiceSession('3', { date: new Date('2024-06-16') })
      ]

      const groups = groupSessionsByDate(sessions)
      expect(groups.size).toBe(2)
      expect(groups.get('2024-06-15')).toHaveLength(2)
      expect(groups.get('2024-06-16')).toHaveLength(1)
    })
  })

  describe('getAvailableServiceTypes', () => {
    it('should return all service session types', () => {
      const types = getAvailableServiceTypes()
      expect(types).toContain('break')
      expect(types).toContain('lunch')
      expect(types).toContain('registration')
      expect(types).toContain('networking')
      expect(types).toContain('sponsor')
      expect(types).toContain('announcement')
      expect(types).toContain('ceremony')
      expect(types).toContain('custom')
    })
  })

  describe('formatTimeRange', () => {
    it('should format time range correctly', () => {
      const session = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      expect(formatTimeRange(session)).toBe('10:00 - 10:30')
    })
  })

  describe('formatDuration', () => {
    it('should format short durations in minutes', () => {
      const session = createServiceSession('1', { startTime: '10:00', endTime: '10:30' })
      expect(formatDuration(session)).toBe('30min')
    })

    it('should format long durations with hours', () => {
      const session = createServiceSession('1', { startTime: '10:00', endTime: '11:30' })
      expect(formatDuration(session)).toBe('1h 30min')
    })

    it('should format exact hours without minutes', () => {
      const session = createServiceSession('1', { startTime: '10:00', endTime: '11:00' })
      expect(formatDuration(session)).toBe('1h')
    })
  })
})
