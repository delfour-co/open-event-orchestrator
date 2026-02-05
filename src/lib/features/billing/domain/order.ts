import { z } from 'zod'
import { currencySchema } from './ticket-type'

export const orderStatusSchema = z.enum(['pending', 'paid', 'cancelled', 'refunded'])

export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  orderNumber: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  status: orderStatusSchema.default('pending'),
  totalAmount: z.number().int().min(0),
  currency: currencySchema.default('EUR'),
  stripeSessionId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  paidAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Order = z.infer<typeof orderSchema>

export const createOrderSchema = orderSchema.omit({
  id: true,
  orderNumber: true,
  status: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  paidAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true
})

export type CreateOrder = z.infer<typeof createOrderSchema>

export const canCancelOrder = (status: OrderStatus): boolean => {
  return status === 'pending'
}

export const canRefundOrder = (status: OrderStatus): boolean => {
  return status === 'paid'
}

export const isOrderCompleted = (status: OrderStatus): boolean => {
  return status === 'paid'
}

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  }
  return labels[status]
}

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: 'yellow',
    paid: 'green',
    cancelled: 'gray',
    refunded: 'orange'
  }
  return colors[status]
}

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}
