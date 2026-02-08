import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateTicket, Ticket, TicketStatus } from '../domain'

const COLLECTION = 'billing_tickets'

export const createTicketRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Ticket | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToTicket(record)
    } catch {
      return null
    }
  },

  async findByOrder(orderId: string): Promise<Ticket[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`orderId = ${orderId}`,
      sort: 'created'
    })
    return records.map(mapRecordToTicket)
  },

  async findByEdition(editionId: string): Promise<Ticket[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-created'
    })
    return records.map(mapRecordToTicket)
  },

  async findByTicketNumber(ticketNumber: string): Promise<Ticket | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: safeFilter`ticketNumber = ${ticketNumber}`
      })
      if (records.items.length === 0) return null
      return mapRecordToTicket(records.items[0])
    } catch {
      return null
    }
  },

  async create(data: CreateTicket & { ticketNumber: string; qrCode?: string }): Promise<Ticket> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      status: 'valid'
    })
    return mapRecordToTicket(record)
  },

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const record = await pb.collection(COLLECTION).update(id, { status })
    return mapRecordToTicket(record)
  },

  async checkIn(id: string, checkedInBy: string): Promise<Ticket> {
    const record = await pb.collection(COLLECTION).update(id, {
      status: 'used',
      checkedInAt: new Date().toISOString(),
      checkedInBy
    })
    return mapRecordToTicket(record)
  },

  async countByEdition(
    editionId: string
  ): Promise<{ total: number; byStatus: Record<TicketStatus, number> }> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'status'
    })

    const byStatus: Record<TicketStatus, number> = {
      valid: 0,
      used: 0,
      cancelled: 0
    }

    for (const record of records) {
      const status = record.status as TicketStatus
      byStatus[status]++
    }

    return {
      total: records.length,
      byStatus
    }
  }
})

const mapRecordToTicket = (record: Record<string, unknown>): Ticket => ({
  id: record.id as string,
  orderId: record.orderId as string,
  ticketTypeId: record.ticketTypeId as string,
  editionId: record.editionId as string,
  attendeeEmail: record.attendeeEmail as string,
  attendeeFirstName: record.attendeeFirstName as string,
  attendeeLastName: record.attendeeLastName as string,
  ticketNumber: record.ticketNumber as string,
  qrCode: record.qrCode as string | undefined,
  status: (record.status as TicketStatus) || 'valid',
  checkedInAt: record.checkedInAt ? new Date(record.checkedInAt as string) : undefined,
  checkedInBy: record.checkedInBy as string | undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type TicketRepository = ReturnType<typeof createTicketRepository>
