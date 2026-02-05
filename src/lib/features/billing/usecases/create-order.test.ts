import { describe, expect, it, vi } from 'vitest'
import type { OrderItemRepository, OrderRepository, TicketTypeRepository } from '../infra'
import { type CreateOrderInput, createCreateOrderUseCase } from './create-order'

const now = new Date()

const makeTicketType = (overrides: Record<string, unknown> = {}) => ({
  id: 'tt-1',
  editionId: 'ed-1',
  name: 'Standard',
  price: 5000,
  currency: 'EUR' as const,
  quantity: 100,
  quantitySold: 10,
  isActive: true,
  order: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides
})

const makeInput = (overrides: Partial<CreateOrderInput> = {}): CreateOrderInput => ({
  editionId: 'ed-1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  currency: 'EUR',
  items: [{ ticketTypeId: 'tt-1', quantity: 2 }],
  ...overrides
})

const createMockRepos = () => {
  const orderRepo: OrderRepository = {
    findById: vi.fn(),
    findByEdition: vi.fn(),
    findByEmail: vi.fn(),
    findByStripeSessionId: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'ORD-TEST' }),
    updateStatus: vi.fn(),
    updatePaymentInfo: vi.fn(),
    countByEdition: vi.fn()
  }

  const orderItemRepo: OrderItemRepository = {
    findById: vi.fn(),
    findByOrder: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'oi-1' })
  }

  const ticketTypeRepo: TicketTypeRepository = {
    findById: vi.fn().mockResolvedValue(makeTicketType()),
    findByEdition: vi.fn(),
    findActiveByEdition: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    incrementQuantitySold: vi.fn()
  }

  return { orderRepo, orderItemRepo, ticketTypeRepo }
}

describe('createCreateOrderUseCase', () => {
  it('should create an order with correct total amount', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    const result = await useCase(makeInput())

    expect(result.orderId).toBe('order-1')
    expect(result.totalAmount).toBe(10000) // 5000 * 2
    expect(result.isFree).toBe(false)
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        editionId: 'ed-1',
        email: 'john@example.com',
        totalAmount: 10000,
        currency: 'EUR',
        status: 'pending'
      })
    )
  })

  it('should create order items for each line item', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    await useCase(makeInput())

    expect(orderItemRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        ticketTypeId: 'tt-1',
        ticketTypeName: 'Standard',
        quantity: 2,
        unitPrice: 5000,
        totalPrice: 10000
      })
    )
  })

  it('should handle multiple ticket types', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    vi.mocked(ticketTypeRepo.findById)
      .mockResolvedValueOnce(makeTicketType({ id: 'tt-1', name: 'Standard', price: 5000 }))
      .mockResolvedValueOnce(makeTicketType({ id: 'tt-2', name: 'VIP', price: 15000 }))

    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    const result = await useCase(
      makeInput({
        items: [
          { ticketTypeId: 'tt-1', quantity: 1 },
          { ticketTypeId: 'tt-2', quantity: 1 }
        ]
      })
    )

    expect(result.totalAmount).toBe(20000)
    expect(orderItemRepo.create).toHaveBeenCalledTimes(2)
  })

  it('should return isFree=true for free tickets', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    vi.mocked(ticketTypeRepo.findById).mockResolvedValue(makeTicketType({ price: 0 }))

    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    const result = await useCase(makeInput())

    expect(result.totalAmount).toBe(0)
    expect(result.isFree).toBe(true)
  })

  it('should throw if ticket type not found', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    vi.mocked(ticketTypeRepo.findById).mockResolvedValue(null)

    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    await expect(useCase(makeInput())).rejects.toThrow('Ticket type tt-1 not found')
  })

  it('should throw if ticket type is inactive', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    vi.mocked(ticketTypeRepo.findById).mockResolvedValue(makeTicketType({ isActive: false }))

    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    await expect(useCase(makeInput())).rejects.toThrow('is not available')
  })

  it('should throw if not enough tickets remaining', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    vi.mocked(ticketTypeRepo.findById).mockResolvedValue(
      makeTicketType({ quantity: 10, quantitySold: 9 })
    )

    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    await expect(
      useCase(makeInput({ items: [{ ticketTypeId: 'tt-1', quantity: 5 }] }))
    ).rejects.toThrow('Not enough tickets available')
  })

  it('should allow ordering exactly the remaining quantity', async () => {
    const { orderRepo, orderItemRepo, ticketTypeRepo } = createMockRepos()
    vi.mocked(ticketTypeRepo.findById).mockResolvedValue(
      makeTicketType({ quantity: 10, quantitySold: 8 })
    )

    const useCase = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    const result = await useCase(makeInput({ items: [{ ticketTypeId: 'tt-1', quantity: 2 }] }))

    expect(result.orderId).toBe('order-1')
  })
})
