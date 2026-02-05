import { describe, expect, it, vi } from 'vitest'
import type { TicketRepository } from '../infra'
import { createCheckInTicketUseCase } from './check-in-ticket'

const now = new Date()

const makeTicket = (overrides: Record<string, unknown> = {}) => ({
  id: 'ticket-1',
  orderId: 'order-1',
  ticketTypeId: 'tt-1',
  editionId: 'ed-1',
  attendeeEmail: 'john@example.com',
  attendeeFirstName: 'John',
  attendeeLastName: 'Doe',
  ticketNumber: 'TKT-TEST-123',
  status: 'valid' as const,
  createdAt: now,
  updatedAt: now,
  ...overrides
})

const createMockRepo = (): TicketRepository => ({
  findById: vi.fn(),
  findByOrder: vi.fn(),
  findByEdition: vi.fn(),
  findByTicketNumber: vi.fn().mockResolvedValue(makeTicket()),
  create: vi.fn(),
  updateStatus: vi.fn(),
  checkIn: vi
    .fn()
    .mockResolvedValue(makeTicket({ status: 'used', checkedInAt: now, checkedInBy: 'staff-1' })),
  countByEdition: vi.fn()
})

describe('createCheckInTicketUseCase', () => {
  it('should check in a valid ticket', async () => {
    const repo = createMockRepo()
    const useCase = createCheckInTicketUseCase(repo)

    const result = await useCase('TKT-TEST-123', 'staff-1')

    expect(result.success).toBe(true)
    expect(result.ticket).not.toBeNull()
    expect(result.error).toBeUndefined()
    expect(repo.checkIn).toHaveBeenCalledWith('ticket-1', 'staff-1')
  })

  it('should return error for non-existent ticket', async () => {
    const repo = createMockRepo()
    vi.mocked(repo.findByTicketNumber).mockResolvedValue(null)

    const useCase = createCheckInTicketUseCase(repo)

    const result = await useCase('TKT-UNKNOWN', 'staff-1')

    expect(result.success).toBe(false)
    expect(result.ticket).toBeNull()
    expect(result.error).toBe('Ticket not found')
    expect(repo.checkIn).not.toHaveBeenCalled()
  })

  it('should return error for already used ticket', async () => {
    const repo = createMockRepo()
    vi.mocked(repo.findByTicketNumber).mockResolvedValue(
      makeTicket({ status: 'used', checkedInAt: now })
    )

    const useCase = createCheckInTicketUseCase(repo)

    const result = await useCase('TKT-TEST-123', 'staff-1')

    expect(result.success).toBe(false)
    expect(result.ticket).not.toBeNull()
    expect(result.error).toContain('already used')
    expect(repo.checkIn).not.toHaveBeenCalled()
  })

  it('should return error for cancelled ticket', async () => {
    const repo = createMockRepo()
    vi.mocked(repo.findByTicketNumber).mockResolvedValue(makeTicket({ status: 'cancelled' }))

    const useCase = createCheckInTicketUseCase(repo)

    const result = await useCase('TKT-TEST-123', 'staff-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Ticket has been cancelled')
    expect(repo.checkIn).not.toHaveBeenCalled()
  })

  it('should return the updated ticket on success', async () => {
    const repo = createMockRepo()
    const checkedInTicket = makeTicket({
      status: 'used',
      checkedInAt: now,
      checkedInBy: 'staff-1'
    })
    vi.mocked(repo.checkIn).mockResolvedValue(checkedInTicket)

    const useCase = createCheckInTicketUseCase(repo)

    const result = await useCase('TKT-TEST-123', 'staff-1')

    expect(result.ticket?.status).toBe('used')
    expect(result.ticket?.checkedInBy).toBe('staff-1')
  })

  it('should include check-in timestamp in error message for used tickets', async () => {
    const repo = createMockRepo()
    const checkInDate = new Date('2025-06-15T10:30:00')
    vi.mocked(repo.findByTicketNumber).mockResolvedValue(
      makeTicket({ status: 'used', checkedInAt: checkInDate })
    )

    const useCase = createCheckInTicketUseCase(repo)

    const result = await useCase('TKT-TEST-123', 'staff-1')

    expect(result.error).toContain('checked in at')
  })
})
