/**
 * Service Session Domain
 *
 * Handles special non-talk sessions like breaks, meals, registration, and networking.
 * These sessions can span all rooms (global) or be room-specific.
 */

import { z } from 'zod'

/**
 * Service session types with predefined configurations
 */
export const serviceSessionTypeSchema = z.enum([
  'break', // Coffee break
  'lunch', // Lunch break
  'registration', // Registration/check-in
  'networking', // Networking session
  'sponsor', // Sponsor presentation
  'announcement', // General announcement
  'ceremony', // Opening/closing ceremony
  'custom' // Custom service session
])

export type ServiceSessionType = z.infer<typeof serviceSessionTypeSchema>

/**
 * Icon names for service sessions (using Lucide icon names)
 */
export const serviceSessionIconSchema = z.enum([
  'coffee', // Break
  'utensils', // Lunch
  'clipboard-check', // Registration
  'users', // Networking
  'megaphone', // Sponsor
  'info', // Announcement
  'award', // Ceremony
  'star' // Custom default
])

export type ServiceSessionIcon = z.infer<typeof serviceSessionIconSchema>

/**
 * Service session schema extending base session concept
 */
export const serviceSessionSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  type: serviceSessionTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  icon: serviceSessionIconSchema.optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(), // Hex color
  date: z.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
  isGlobal: z.boolean().default(true), // Spans all rooms
  roomIds: z.array(z.string()).optional(), // Specific rooms if not global
  isPublic: z.boolean().default(true), // Include in public export
  sortOrder: z.number().int().default(0), // Order within same time slot
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ServiceSession = z.infer<typeof serviceSessionSchema>

export const createServiceSessionSchema = serviceSessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateServiceSession = z.infer<typeof createServiceSessionSchema>

export const updateServiceSessionSchema = createServiceSessionSchema.partial().extend({
  id: z.string()
})

export type UpdateServiceSession = z.infer<typeof updateServiceSessionSchema>

/**
 * Predefined service session templates
 */
export interface ServiceSessionTemplate {
  type: ServiceSessionType
  title: string
  description?: string
  icon: ServiceSessionIcon
  color: string
  defaultDuration: number // in minutes
  isGlobal: boolean
  isPublic: boolean
}

export const SERVICE_SESSION_TEMPLATES: Record<ServiceSessionType, ServiceSessionTemplate> = {
  break: {
    type: 'break',
    title: 'Coffee Break',
    description: 'Take a break and network with other attendees',
    icon: 'coffee',
    color: '#9CA3AF', // gray-400
    defaultDuration: 30,
    isGlobal: true,
    isPublic: true
  },
  lunch: {
    type: 'lunch',
    title: 'Lunch Break',
    description: 'Lunch break',
    icon: 'utensils',
    color: '#FBBF24', // yellow-400
    defaultDuration: 60,
    isGlobal: true,
    isPublic: true
  },
  registration: {
    type: 'registration',
    title: 'Registration',
    description: 'Badge pickup and registration',
    icon: 'clipboard-check',
    color: '#64748B', // slate-500
    defaultDuration: 60,
    isGlobal: false,
    isPublic: true
  },
  networking: {
    type: 'networking',
    title: 'Networking',
    description: 'Networking session',
    icon: 'users',
    color: '#EC4899', // pink-500
    defaultDuration: 45,
    isGlobal: true,
    isPublic: true
  },
  sponsor: {
    type: 'sponsor',
    title: 'Sponsor Session',
    description: 'Message from our sponsors',
    icon: 'megaphone',
    color: '#8B5CF6', // violet-500
    defaultDuration: 15,
    isGlobal: true,
    isPublic: true
  },
  announcement: {
    type: 'announcement',
    title: 'Announcement',
    description: 'Important announcement',
    icon: 'info',
    color: '#3B82F6', // blue-500
    defaultDuration: 10,
    isGlobal: true,
    isPublic: true
  },
  ceremony: {
    type: 'ceremony',
    title: 'Opening Ceremony',
    description: 'Welcome and introduction',
    icon: 'award',
    color: '#F97316', // orange-500
    defaultDuration: 30,
    isGlobal: true,
    isPublic: true
  },
  custom: {
    type: 'custom',
    title: 'Custom Session',
    description: '',
    icon: 'star',
    color: '#6B7280', // gray-500
    defaultDuration: 30,
    isGlobal: true,
    isPublic: true
  }
}

// ============================================================================
// Domain Functions
// ============================================================================

/**
 * Validate service session data
 */
export function validateServiceSession(data: unknown): ServiceSession {
  return serviceSessionSchema.parse(data)
}

/**
 * Create a service session from input
 */
export function createServiceSession(data: unknown): CreateServiceSession {
  return createServiceSessionSchema.parse(data)
}

/**
 * Get template for a service session type
 */
export function getServiceSessionTemplate(type: ServiceSessionType): ServiceSessionTemplate {
  return SERVICE_SESSION_TEMPLATES[type]
}

/**
 * Create service session from template
 */
export function createFromTemplate(
  type: ServiceSessionType,
  editionId: string,
  date: Date,
  startTime: string,
  overrides?: Partial<CreateServiceSession>
): CreateServiceSession {
  const template = getServiceSessionTemplate(type)
  const endTime = calculateEndTime(startTime, template.defaultDuration)

  return {
    editionId,
    type,
    title: overrides?.title || template.title,
    description: overrides?.description || template.description,
    icon: overrides?.icon || template.icon,
    color: overrides?.color || template.color,
    date,
    startTime,
    endTime: overrides?.endTime || endTime,
    isGlobal: overrides?.isGlobal ?? template.isGlobal,
    roomIds: overrides?.roomIds,
    isPublic: overrides?.isPublic ?? template.isPublic,
    sortOrder: overrides?.sortOrder ?? 0
  }
}

/**
 * Calculate end time from start time and duration in minutes
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

/**
 * Calculate duration in minutes from start and end times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  return endH * 60 + endM - (startH * 60 + startM)
}

/**
 * Check if a service session is global (spans all rooms)
 */
export function isGlobalSession(session: ServiceSession): boolean {
  return session.isGlobal
}

/**
 * Check if a service session should be exported publicly
 */
export function isPublicSession(session: ServiceSession): boolean {
  return session.isPublic
}

/**
 * Get display label for service session type
 */
export function getServiceSessionTypeLabel(type: ServiceSessionType): string {
  const labels: Record<ServiceSessionType, string> = {
    break: 'Coffee Break',
    lunch: 'Lunch Break',
    registration: 'Registration',
    networking: 'Networking',
    sponsor: 'Sponsor Session',
    announcement: 'Announcement',
    ceremony: 'Ceremony',
    custom: 'Custom'
  }
  return labels[type]
}

/**
 * Get icon name for service session type
 */
export function getServiceSessionIcon(type: ServiceSessionType): ServiceSessionIcon {
  return SERVICE_SESSION_TEMPLATES[type].icon
}

/**
 * Get default color for service session type
 */
export function getServiceSessionColor(type: ServiceSessionType): string {
  return SERVICE_SESSION_TEMPLATES[type].color
}

/**
 * Check if two service sessions overlap in time
 */
export function serviceSessionsOverlap(
  session1: ServiceSession,
  session2: ServiceSession
): boolean {
  // Must be same date
  if (session1.date.toDateString() !== session2.date.toDateString()) {
    return false
  }

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const s1Start = toMinutes(session1.startTime)
  const s1End = toMinutes(session1.endTime)
  const s2Start = toMinutes(session2.startTime)
  const s2End = toMinutes(session2.endTime)

  return s1Start < s2End && s2Start < s1End
}

/**
 * Check if a service session overlaps with a time range
 */
export function sessionOverlapsTimeRange(
  session: ServiceSession,
  date: Date,
  startTime: string,
  endTime: string
): boolean {
  if (session.date.toDateString() !== date.toDateString()) {
    return false
  }

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const sessionStart = toMinutes(session.startTime)
  const sessionEnd = toMinutes(session.endTime)
  const rangeStart = toMinutes(startTime)
  const rangeEnd = toMinutes(endTime)

  return sessionStart < rangeEnd && rangeStart < sessionEnd
}

/**
 * Filter service sessions for public export
 */
export function filterPublicSessions(sessions: ServiceSession[]): ServiceSession[] {
  return sessions.filter((s) => s.isPublic)
}

/**
 * Filter global service sessions
 */
export function filterGlobalSessions(sessions: ServiceSession[]): ServiceSession[] {
  return sessions.filter((s) => s.isGlobal)
}

/**
 * Filter service sessions for a specific room
 */
export function filterSessionsByRoom(sessions: ServiceSession[], roomId: string): ServiceSession[] {
  return sessions.filter((s) => s.isGlobal || s.roomIds?.includes(roomId))
}

/**
 * Sort service sessions by time and sort order
 */
export function sortServiceSessions(sessions: ServiceSession[]): ServiceSession[] {
  return [...sessions].sort((a, b) => {
    // First sort by date
    const dateCompare = a.date.getTime() - b.date.getTime()
    if (dateCompare !== 0) return dateCompare

    // Then by start time
    const [aH, aM] = a.startTime.split(':').map(Number)
    const [bH, bM] = b.startTime.split(':').map(Number)
    const timeCompare = aH * 60 + aM - (bH * 60 + bM)
    if (timeCompare !== 0) return timeCompare

    // Finally by sort order
    return a.sortOrder - b.sortOrder
  })
}

/**
 * Group service sessions by date
 */
export function groupSessionsByDate(sessions: ServiceSession[]): Map<string, ServiceSession[]> {
  const groups = new Map<string, ServiceSession[]>()

  for (const session of sessions) {
    const dateKey = session.date.toISOString().split('T')[0]
    const existing = groups.get(dateKey) || []
    existing.push(session)
    groups.set(dateKey, existing)
  }

  return groups
}

/**
 * Get available service session types for quick creation
 */
export function getAvailableServiceTypes(): ServiceSessionType[] {
  return Object.keys(SERVICE_SESSION_TEMPLATES) as ServiceSessionType[]
}

/**
 * Format service session time range for display
 */
export function formatTimeRange(session: ServiceSession): string {
  return `${session.startTime} - ${session.endTime}`
}

/**
 * Format service session duration for display
 */
export function formatDuration(session: ServiceSession): string {
  const duration = calculateDuration(session.startTime, session.endTime)
  if (duration >= 60) {
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }
  return `${duration}min`
}
