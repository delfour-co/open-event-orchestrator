import { describe, expect, it, vi } from 'vitest'
import type {
  OrderItemRepository,
  OrderRepository,
  TicketRepository,
  TicketTypeRepository
} from '../infra'
import { createCompleteOrderUseCase } from './complete-order'

const now = new Date()

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  editionId: 'ed-1',
  orderNumber: 'ORD-TEST-123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  status: 'pending' as const,
  totalAmount: 10000,
  currency: 'EUR' as const,
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
    updateStatus: vi.fn().mockResolvedValue(makeOrder({ status: 'paid' })),
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
    findByOrder: vi.fn(),
    findByEdition: vi.fn(),
    findByTicketNumber: vi.fn(),
    create: vi.fn().mockImplementation(async (data) => ({
      id: `ticket-${Math.random().toString(36).slice(2)}`,
      ...data,
      status: 'valid',
      createdAt: now,
      updatedAt: now
    })),
    updateStatus: vi.fn(),
    checkIn: vi.fn(),
    countByEdition: vi.fn()
  }

  return { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo }
}

describe('createCompleteOrderUseCase', () => {
  it('should mark order as paid', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(orderRepo.updateStatus).toHaveBeenCalledWith('order-1', 'paid')
  })

  it('should generate tickets for each order item quantity', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    const result = await useCase('order-1')

    // 2 tickets for quantity=2
    expect(ticketRepo.create).toHaveBeenCalledTimes(2)
    expect(result.ticketIds).toHaveLength(2)
  })

  it('should increment quantity sold on ticket type', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(ticketTypeRepo.incrementQuantitySold).toHaveBeenCalledWith('tt-1', 2)
  })

  it('should generate QR codes when generator is provided', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const mockQrGenerator = vi.fn().mockResolvedValue('data:image/png;base64,qrcode')

    const useCase = createCompleteOrderUseCase(
      orderRepo,
      orderItemRepo,
      ticketTypeRepo,
      ticketRepo,
      mockQrGenerator
    )

    await useCase('order-1')

    expect(mockQrGenerator).toHaveBeenCalledTimes(2)
    expect(ticketRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        qrCode: 'data:image/png;base64,qrcode'
      })
    )
  })

  it('should create tickets without QR codes when no generator', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(ticketRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        qrCode: undefined
      })
    )
  })

  it('should set correct attendee info on tickets', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await useCase('order-1')

    expect(ticketRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        editionId: 'ed-1',
        attendeeEmail: 'john@example.com',
        attendeeFirstName: 'John',
        attendeeLastName: 'Doe'
      })
    )
  })

  it('should handle multiple order items', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(orderItemRepo.findByOrder).mockResolvedValue([
      makeOrderItem({ ticketTypeId: 'tt-1', quantity: 1 }),
      makeOrderItem({ id: 'oi-2', ticketTypeId: 'tt-2', quantity: 3 })
    ])

    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    const result = await useCase('order-1')

    expect(ticketRepo.create).toHaveBeenCalledTimes(4) // 1 + 3
    expect(result.ticketIds).toHaveLength(4)
    expect(ticketTypeRepo.incrementQuantitySold).toHaveBeenCalledWith('tt-1', 1)
    expect(ticketTypeRepo.incrementQuantitySold).toHaveBeenCalledWith('tt-2', 3)
  })

  it('should throw if order not found', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(orderRepo.findById).mockResolvedValue(null)

    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await expect(useCase('order-999')).rejects.toThrow('Order not found')
  })

  it('should throw if order is not pending', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo } = createMockRepos()
    vi.mocked(orderRepo.findById).mockResolvedValue(makeOrder({ status: 'paid' }))

    const useCase = createCompleteOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo, ticketRepo)

    await expect(useCase('order-1')).rejects.toThrow('Cannot complete order with status "paid"')
  })
})
