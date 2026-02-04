import { z } from 'zod'

export const roomSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(100),
  capacity: z.number().int().positive().optional(),
  floor: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  order: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Room = z.infer<typeof roomSchema>

export const createRoomSchema = roomSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateRoom = z.infer<typeof createRoomSchema>

export const updateRoomSchema = createRoomSchema.partial().extend({
  id: z.string()
})

export type UpdateRoom = z.infer<typeof updateRoomSchema>

// Domain functions
export function validateRoom(data: unknown): Room {
  return roomSchema.parse(data)
}

export function createRoom(data: unknown): CreateRoom {
  return createRoomSchema.parse(data)
}
