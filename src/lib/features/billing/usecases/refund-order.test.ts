import { describe, expect, it, vi } from 'vitest'
import type {
  OrderItemRepository,
  OrderRepository,
  TicketRepository,
  TicketTypeRepository
} from '../infra'
import { createRefundOrderUseCase } from './refund-order'

const now = new Date()

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  editionId: 'ed-1',
  orderNumber: 'ORD-TEST-123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  status: 'paid' as const,
  totalAmount: 10000,
  currency: 'EUR' as const,
  createdAt: now,
  updatedAt: now,
  ...overrides
})

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

const makeOrderItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'oi-1',
  orderId: 'order-1',
  ticketTypeId: 'tt-1',
  ticketTypeName: 'Standard',
  quantity: 2,
  unitPrice: 5000,
  totalPrice: 10000,
  createdAt: now,
  updatedAt: now,
  ...overrides
})

const createMockRepos = () => {
  const orderRepo: OrderRepository = {
    findById: vi.fn().mockResolvedValue(makeOrder()),
    findByEdition: vi.fn(),
    findByEmail: vi.fn(),
    findByStripeSessionId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    updatePaymentInfo: vi.fn(),
    countByEdition: vi.fn()
  }

  const orderItemRepo: OrderItemRepository = {
    findById: vi.fn(),
    findByOrder: vi.fn().mockResolvedValue([makeOrderItem()]),
    create: vi.fn()
  }

  const ticketTypeRepo: TicketTypeRepository = {
    findById: vi.fn(),
    findByEdition: vi.fn(),
    findActiveByEdition: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    incrementQuantitySold: vi.fn()
  }

  const ticketRepo: TicketRepository = {
    findById: vi.fn(),
    findByOrder: vi.fn().mockResolvedValue([makeTicket()]),
    findByEdition: vi.fn(),
    findByTicketNumber: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    checkIn: vi.fn(),
    countByEdition: vi.fn()
  }

  return { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo }
}

describe('createRefundOrderUseCase', () => {
  it('should refund a paid order', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(orderRepo.updateStatus).toHaveBeenCalledWith('order-1', 'refunded')
  })

  it('should cancel all valid tickets', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(ticketRepo.findByOrder).mockResolvedValue([
      makeTicket({ id: 'ticket-1', status: 'valid' }),
      makeTicket({ id: 'ticket-2', status: 'valid' })
    ])

    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(ticketRepo.updateStatus).toHaveBeenCalledWith('ticket-1', 'cancelled')
    expect(ticketRepo.updateStatus).toHaveBeenCalledWith('ticket-2', 'cancelled')
  })

  it('should cancel used tickets too', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(ticketRepo.findByOrder).mockResolvedValue([
      makeTicket({ id: 'ticket-1', status: 'used' })
    ])

    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(ticketRepo.updateStatus).toHaveBeenCalledWith('ticket-1', 'cancelled')
  })

  it('should skip already cancelled tickets', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(ticketRepo.findByOrder).mockResolvedValue([
      makeTicket({ id: 'ticket-1', status: 'cancelled' })
    ])

    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(ticketRepo.updateStatus).not.toHaveBeenCalled()
  })

  it('should restore ticket type quantities', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(ticketTypeRepo.incrementQuantitySold).toHaveBeenCalledWith('tt-1', -2)
  })

  it('should throw if order not found', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(orderRepo.findById).mockResolvedValue(null)

    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await expect(useCase('order-999')).rejects.toThrow('Order not found')
  })

  it('should throw if order is not paid', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(orderRepo.findById).mockResolvedValue(makeOrder({ status: 'pending' }))

    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await expect(useCase('order-1')).rejects.toThrow('Cannot refund order with status "pending"')
  })

  it('should throw if order is already refunded', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(orderRepo.findById).mockResolvedValue(makeOrder({ status: 'refunded' }))

    const useCase = createRefundOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await expect(useCase('order-1')).rejects.toThrow('Cannot refund order with status "refunded"')
  })
})
