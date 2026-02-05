import { z } from 'zod'

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  ticketTypeId: z.string(),
  ticketTypeName: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
  totalPrice: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type OrderItem = z.infer<typeof orderItemSchema>

export const createOrderItemSchema = orderItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateOrderItem = z.infer<typeof createOrderItemSchema>

export const calculateItemTotal = (unitPrice: number, quantity: number): number => {
  return unitPrice * quantity
}
