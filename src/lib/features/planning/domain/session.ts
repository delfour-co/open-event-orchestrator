import { z } from 'zod'

export const sessionTypeSchema = z.enum([
  'talk',
  'workshop',
  'keynote',
  'panel',
  'break',
  'lunch',
  'networking',
  'registration',
  'other'
])

export type SessionType = z.infer<typeof sessionTypeSchema>

export const sessionSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  slotId: z.string(),
  talkId: z.string().optional(), // Optional: linked talk from CFP
  trackId: z.string().optional(), // Optional: track assignment
  title: z.string().min(1).max(200), // Custom title if no talk, or override
  description: z.string().max(2000).optional(),
  type: sessionTypeSchema.default('talk'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Session = z.infer<typeof sessionSchema>

export const createSessionSchema = sessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSession = z.infer<typeof createSessionSchema>

export const updateSessionSchema = createSessionSchema.partial().extend({
  id: z.string()
})

export type UpdateSession = z.infer<typeof updateSessionSchema>

// Domain functions
export function validateSession(data: unknown): Session {
  return sessionSchema.parse(data)
}

export function createSession(data: unknown): CreateSession {
  return createSessionSchema.parse(data)
}

/**
 * Check if a session is a break/non-talk session
 */
export function isBreakSession(session: Session): boolean {
  return ['break', 'lunch', 'networking', 'registration'].includes(session.type)
}

/**
 * Check if a session requires a talk
 */
export function requiresTalk(session: Session): boolean {
  return ['talk', 'workshop', 'keynote', 'panel'].includes(session.type)
}

/**
 * Get display label for session type
 */
export function getSessionTypeLabel(type: SessionType): string {
  const labels: Record<SessionType, string> = {
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
  return labels[type]
}

/**
 * Get color for session type (for calendar display)
 */
export function getSessionTypeColor(type: SessionType): string {
  const colors: Record<SessionType, string> = {
    talk: 'blue',
    workshop: 'purple',
    keynote: 'orange',
    panel: 'green',
    break: 'gray',
    lunch: 'yellow',
    networking: 'pink',
    registration: 'slate',
    other: 'gray'
  }
  return colors[type]
}
