import type PocketBase from 'pocketbase'
import type { OrderStatus } from '../domain'

export interface SalesStats {
  totalSales: number
  totalRevenue: number
  totalCapacity: number
  soldPercentage: number
  ordersByStatus: Record<OrderStatus, number>
}

export interface RevenueByTicketType {
  ticketTypeId: string
  ticketTypeName: string
  quantitySold: number
  revenue: number
  percentage: number
}

export interface DailySales {
  date: string
  quantity: number
  revenue: number
}

export interface SalesTrend {
  dailySales: DailySales[]
  totalDays: number
  averageDailySales: number
  averageDailyRevenue: number
}

export interface LowStockAlert {
  ticketTypeId: string
  ticketTypeName: string
  remaining: number
  total: number
  percentageRemaining: number
}

export interface BillingStatsService {
  getSalesStats(editionId: string): Promise<SalesStats>
  getRevenueByTicketType(editionId: string): Promise<RevenueByTicketType[]>
  getSalesTrend(editionId: string, days?: number): Promise<SalesTrend>
  getLowStockAlerts(editionId: string, threshold?: number): Promise<LowStockAlert[]>
}

const LOW_STOCK_THRESHOLD = 10

export const createBillingStatsService = (pb: PocketBase): BillingStatsService => ({
  async getSalesStats(editionId: string): Promise<SalesStats> {
    const [ticketTypes, orders] = await Promise.all([
      pb.collection('ticket_types').getFullList({
        filter: `editionId = "${editionId}"`,
        fields: 'quantity,quantitySold'
      }),
      pb.collection('orders').getFullList({
        filter: `editionId = "${editionId}"`,
        fields: 'status,totalAmount'
      })
    ])

    const totalCapacity = ticketTypes.reduce((sum, t) => sum + (t.quantity as number), 0)
    const totalSales = ticketTypes.reduce((sum, t) => sum + ((t.quantitySold as number) || 0), 0)

    const ordersByStatus: Record<OrderStatus, number> = {
      pending: 0,
      paid: 0,
      cancelled: 0,
      refunded: 0
    }

    let totalRevenue = 0
    for (const order of orders) {
      const status = order.status as OrderStatus
      ordersByStatus[status]++
      if (status === 'paid') {
        totalRevenue += order.totalAmount as number
      }
    }

    const soldPercentage = totalCapacity > 0 ? Math.round((totalSales / totalCapacity) * 100) : 0

    return {
      totalSales,
      totalRevenue,
      totalCapacity,
      soldPercentage,
      ordersByStatus
    }
  },

  async getRevenueByTicketType(editionId: string): Promise<RevenueByTicketType[]> {
    const ticketTypes = await pb.collection('ticket_types').getFullList({
      filter: `editionId = "${editionId}"`,
      fields: 'id,name,price,quantitySold'
    })

    const totalRevenue = ticketTypes.reduce(
      (sum, t) => sum + (t.price as number) * ((t.quantitySold as number) || 0),
      0
    )

    const result: RevenueByTicketType[] = ticketTypes.map((t) => {
      const quantitySold = (t.quantitySold as number) || 0
      const revenue = (t.price as number) * quantitySold
      return {
        ticketTypeId: t.id,
        ticketTypeName: t.name as string,
        quantitySold,
        revenue,
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
      }
    })

    result.sort((a, b) => b.revenue - a.revenue)

    return result
  },

  async getSalesTrend(editionId: string, days = 30): Promise<SalesTrend> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    const orders = await pb.collection('orders').getFullList({
      filter: `editionId = "${editionId}" && status = "paid" && paidAt >= "${startDate.toISOString()}"`,
      fields: 'paidAt,totalAmount',
      sort: 'paidAt'
    })

    const tickets = await pb.collection('billing_tickets').getFullList({
      filter: `editionId = "${editionId}" && status != "cancelled"`,
      fields: 'orderId,created'
    })

    const orderIds = new Set(orders.map((o) => o.id))
    const ticketsByOrder = new Map<string, number>()

    for (const ticket of tickets) {
      const orderId = ticket.orderId as string
      if (orderIds.has(orderId)) {
        ticketsByOrder.set(orderId, (ticketsByOrder.get(orderId) || 0) + 1)
      }
    }

    const dailyMap = new Map<string, { quantity: number; revenue: number }>()

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dailyMap.set(dateStr, { quantity: 0, revenue: 0 })
    }

    for (const order of orders) {
      const paidAt = new Date(order.paidAt as string)
      const dateStr = paidAt.toISOString().split('T')[0]
      const ticketCount = ticketsByOrder.get(order.id) || 1

      const current = dailyMap.get(dateStr)
      if (current) {
        current.quantity += ticketCount
        current.revenue += order.totalAmount as number
      }
    }

    const dailySales: DailySales[] = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        quantity: data.quantity,
        revenue: data.revenue
      }))

    const totalQuantity = dailySales.reduce((sum, d) => sum + d.quantity, 0)
    const totalRevenue = dailySales.reduce((sum, d) => sum + d.revenue, 0)

    return {
      dailySales,
      totalDays: days,
      averageDailySales: days > 0 ? Math.round((totalQuantity / days) * 10) / 10 : 0,
      averageDailyRevenue: days > 0 ? Math.round(totalRevenue / days) : 0
    }
  },

  async getLowStockAlerts(
    editionId: string,
    threshold = LOW_STOCK_THRESHOLD
  ): Promise<LowStockAlert[]> {
    const ticketTypes = await pb.collection('ticket_types').getFullList({
      filter: `editionId = "${editionId}" && isActive = true`,
      fields: 'id,name,quantity,quantitySold'
    })

    const alerts: LowStockAlert[] = []

    for (const t of ticketTypes) {
      const total = t.quantity as number
      const sold = (t.quantitySold as number) || 0
      const remaining = total - sold
      const percentageRemaining = total > 0 ? Math.round((remaining / total) * 100) : 0

      if (remaining <= threshold && remaining >= 0) {
        alerts.push({
          ticketTypeId: t.id,
          ticketTypeName: t.name as string,
          remaining,
          total,
          percentageRemaining
        })
      }
    }

    alerts.sort((a, b) => a.remaining - b.remaining)

    return alerts
  }
})

export type { BillingStatsService as BillingStatsServiceType }
