import { z } from 'zod'

export const roomAssignmentSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  memberId: z.string(),
  editionId: z.string(),
  date: z.date().optional(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  notes: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type RoomAssignment = z.infer<typeof roomAssignmentSchema>

export const createRoomAssignmentSchema = roomAssignmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateRoomAssignment = z.infer<typeof createRoomAssignmentSchema>

export function validateRoomAssignment(data: unknown): RoomAssignment {
  return roomAssignmentSchema.parse(data)
}

export function createRoomAssignment(data: unknown): CreateRoomAssignment {
  return createRoomAssignmentSchema.parse(data)
}
