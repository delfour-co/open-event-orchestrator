import { z } from 'zod'

export const slotSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  roomId: z.string(),
  date: z.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Slot = z.infer<typeof slotSchema>

export const createSlotSchema = slotSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(':').map(Number)
      const [endH, endM] = data.endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      return endMinutes > startMinutes
    },
    { message: 'End time must be after start time' }
  )

export type CreateSlot = z.infer<typeof createSlotSchema>

export const updateSlotSchema = slotSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  })
  .partial()
  .extend({
    id: z.string()
  })

export type UpdateSlot = z.infer<typeof updateSlotSchema>

// Domain functions
export function validateSlot(data: unknown): Slot {
  return slotSchema.parse(data)
}

export function createSlot(data: unknown): CreateSlot {
  return createSlotSchema.parse(data)
}

/**
 * Calculate slot duration in minutes
 */
export function getSlotDuration(slot: Slot): number {
  const [startH, startM] = slot.startTime.split(':').map(Number)
  const [endH, endM] = slot.endTime.split(':').map(Number)
  return endH * 60 + endM - (startH * 60 + startM)
}

/**
 * Check if two slots overlap (same room, same date)
 */
export function slotsOverlap(slot1: Slot, slot2: Slot): boolean {
  // Must be same room and same date
  if (slot1.roomId !== slot2.roomId) return false
  if (slot1.date.toDateString() !== slot2.date.toDateString()) return false

  const [start1H, start1M] = slot1.startTime.split(':').map(Number)
  const [end1H, end1M] = slot1.endTime.split(':').map(Number)
  const [start2H, start2M] = slot2.startTime.split(':').map(Number)
  const [end2H, end2M] = slot2.endTime.split(':').map(Number)

  const start1 = start1H * 60 + start1M
  const end1 = end1H * 60 + end1M
  const start2 = start2H * 60 + start2M
  const end2 = end2H * 60 + end2M

  // Overlap if one starts before the other ends
  return start1 < end2 && start2 < end1
}
