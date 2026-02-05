import type { Ticket } from '../domain'
import type { TicketRepository } from '../infra'

export interface CheckInResult {
  success: boolean
  ticket: Ticket | null
  error?: string
}

export const createCheckInTicketUseCase = (ticketRepository: TicketRepository) => {
  return async (ticketNumber: string, checkedInBy: string): Promise<CheckInResult> => {
    const ticket = await ticketRepository.findByTicketNumber(ticketNumber)

    if (!ticket) {
      return {
        success: false,
        ticket: null,
        error: 'Ticket not found'
      }
    }

    if (ticket.status === 'used') {
      return {
        success: false,
        ticket,
        error: `Ticket already used (checked in at ${ticket.checkedInAt?.toLocaleString()})`
      }
    }

    if (ticket.status === 'cancelled') {
      return {
        success: false,
        ticket,
        error: 'Ticket has been cancelled'
      }
    }

    const updatedTicket = await ticketRepository.checkIn(ticket.id, checkedInBy)

    return {
      success: true,
      ticket: updatedTicket
    }
  }
}

export type CheckInTicketUseCase = ReturnType<typeof createCheckInTicketUseCase>
