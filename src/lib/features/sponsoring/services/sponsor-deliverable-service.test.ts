import type { EmailService } from '$lib/features/cfp/services/email-service'
import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SponsorDeliverable, SponsorDeliverableExpanded } from '../domain'
import type { EditionSponsorRepository, SponsorDeliverableRepository } from '../infra'
import { createSponsorDeliverableService } from './sponsor-deliverable-service'

// Mock the repositories
vi.mock('../infra', () => ({
  createSponsorDeliverableRepository: vi.fn(),
  createEditionSponsorRepository: vi.fn()
}))

import { createEditionSponsorRepository, createSponsorDeliverableRepository } from '../infra'

describe('SponsorDeliverableService', () => {
  let mockPb: PocketBase
  let mockDeliverableRepo: Record<string, ReturnType<typeof vi.fn>>
  let mockEditionSponsorRepo: Record<string, ReturnType<typeof vi.fn>>
  let mockEmailService: EmailService
  let service: ReturnType<typeof createSponsorDeliverableService>

  const mockDeliverable: SponsorDeliverable = {
    id: 'del-1',
    editionSponsorId: 'es-1',
    benefitName: 'Logo on website',
    description: 'Your logo displayed on event website',
    status: 'pending',
    dueDate: new Date('2024-06-01'),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockExpandedDeliverable: SponsorDeliverableExpanded = {
    ...mockDeliverable,
    editionSponsor: {
      id: 'es-1',
      editionId: 'edition-1',
      sponsorId: 'sponsor-1',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
      sponsor: {
        id: 'sponsor-1',
        organizationId: 'org-1',
        name: 'Acme Corp',
        contactName: 'John Doe',
        contactEmail: 'john@acme.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  }

  const mockEditionSponsor = {
    id: 'es-1',
    editionId: 'edition-1',
    sponsorId: 'sponsor-1',
    status: 'confirmed',
    package: {
      id: 'pkg-1',
      name: 'Gold',
      benefits: [
        { name: 'Logo on website', included: true },
        { name: 'Social media post', included: true },
        { name: 'Booth space', included: false }
      ]
    }
  }

  beforeEach(() => {
    mockPb = {} as PocketBase

    mockDeliverableRepo = {
      findById: vi.fn(),
      findByIdWithExpand: vi.fn(),
      findByEditionSponsor: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn()
    }

    mockEditionSponsorRepo = {
      findByIdWithExpand: vi.fn(),
      findConfirmed: vi.fn()
    }

    mockEmailService = {
      send: vi.fn().mockResolvedValue({ success: true })
    } as unknown as EmailService

    vi.mocked(createSponsorDeliverableRepository).mockReturnValue(
      mockDeliverableRepo as unknown as SponsorDeliverableRepository
    )
    vi.mocked(createEditionSponsorRepository).mockReturnValue(
      mockEditionSponsorRepo as unknown as EditionSponsorRepository
    )

    service = createSponsorDeliverableService(mockPb, mockEmailService)
  })

  describe('generateDeliverablesForSponsor', () => {
    it('should generate deliverables from package benefits', async () => {
      mockEditionSponsorRepo.findByIdWithExpand.mockResolvedValue(mockEditionSponsor)
      mockDeliverableRepo.findByEditionSponsor.mockResolvedValue([])
      mockDeliverableRepo.createMany.mockResolvedValue([mockDeliverable, mockDeliverable])

      const result = await service.generateDeliverablesForSponsor('es-1')

      expect(result.created).toBe(2) // Only included benefits
      expect(mockDeliverableRepo.createMany).toHaveBeenCalled()
    })

    it('should skip already existing deliverables', async () => {
      mockEditionSponsorRepo.findByIdWithExpand.mockResolvedValue(mockEditionSponsor)
      mockDeliverableRepo.findByEditionSponsor.mockResolvedValue([
        { benefitName: 'Logo on website' } // Already exists
      ])
      mockDeliverableRepo.createMany.mockResolvedValue([mockDeliverable])

      const result = await service.generateDeliverablesForSponsor('es-1')

      // Should skip 'Logo on website' and only create 'Social media post'
      expect(result.skipped).toBe(1)
    })

    it('should return empty result when no package', async () => {
      mockEditionSponsorRepo.findByIdWithExpand.mockResolvedValue({
        ...mockEditionSponsor,
        package: undefined
      })

      const result = await service.generateDeliverablesForSponsor('es-1')

      expect(result.created).toBe(0)
      expect(result.deliverables).toEqual([])
    })
  })

  describe('generateDeliverablesForEdition', () => {
    it('should generate deliverables for all confirmed sponsors', async () => {
      mockEditionSponsorRepo.findConfirmed.mockResolvedValue([{ id: 'es-1' }, { id: 'es-2' }])
      mockEditionSponsorRepo.findByIdWithExpand.mockResolvedValue(mockEditionSponsor)
      mockDeliverableRepo.findByEditionSponsor.mockResolvedValue([])
      mockDeliverableRepo.createMany.mockResolvedValue([mockDeliverable, mockDeliverable])

      const result = await service.generateDeliverablesForEdition('edition-1')

      expect(result.sponsorsProcessed).toBe(2)
      expect(result.deliverablesCreated).toBe(4) // 2 per sponsor
    })
  })

  describe('updateDeliverableStatus', () => {
    it('should update status and send notification when delivered', async () => {
      mockDeliverableRepo.updateStatus.mockResolvedValue({
        ...mockDeliverable,
        status: 'delivered'
      })
      mockDeliverableRepo.findByIdWithExpand.mockResolvedValue(mockExpandedDeliverable)

      const result = await service.updateDeliverableStatus(
        'del-1',
        'delivered',
        'Tech Conference 2024'
      )

      expect(result.status).toBe('delivered')
      expect(mockEmailService.send).toHaveBeenCalled()
    })

    it('should not send notification for non-delivered status', async () => {
      mockDeliverableRepo.updateStatus.mockResolvedValue({
        ...mockDeliverable,
        status: 'in_progress'
      })

      await service.updateDeliverableStatus('del-1', 'in_progress', 'Tech Conference 2024')

      expect(mockEmailService.send).not.toHaveBeenCalled()
    })
  })

  describe('markAsDelivered', () => {
    it('should mark deliverable as delivered with notes', async () => {
      const deliveredAt = new Date()
      mockDeliverableRepo.update.mockResolvedValue({
        ...mockDeliverable,
        status: 'delivered',
        deliveredAt,
        notes: 'Delivered via email'
      })
      mockDeliverableRepo.findByIdWithExpand.mockResolvedValue(mockExpandedDeliverable)

      const result = await service.markAsDelivered(
        'del-1',
        'Tech Conference 2024',
        'Delivered via email'
      )

      expect(result.status).toBe('delivered')
      expect(mockDeliverableRepo.update).toHaveBeenCalledWith(
        'del-1',
        expect.objectContaining({
          status: 'delivered',
          notes: 'Delivered via email'
        })
      )
    })
  })

  describe('getDeliverablesSummary', () => {
    it('should calculate summary correctly', async () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday

      mockDeliverableRepo.findByEditionSponsor.mockResolvedValue([
        { ...mockDeliverable, status: 'pending', dueDate: futureDate },
        { ...mockDeliverable, status: 'in_progress', dueDate: futureDate },
        { ...mockDeliverable, status: 'delivered', dueDate: futureDate },
        { ...mockDeliverable, status: 'pending', dueDate: pastDate } // Overdue
      ])

      const result = await service.getDeliverablesSummary('es-1')

      expect(result.total).toBe(4)
      expect(result.pending).toBe(2)
      expect(result.inProgress).toBe(1)
      expect(result.delivered).toBe(1)
      expect(result.overdue).toBe(1)
      expect(result.completionPercent).toBe(25) // 1/4 = 25%
    })

    it('should return 0% completion when no deliverables', async () => {
      mockDeliverableRepo.findByEditionSponsor.mockResolvedValue([])

      const result = await service.getDeliverablesSummary('es-1')

      expect(result.total).toBe(0)
      expect(result.completionPercent).toBe(0)
    })
  })

  describe('sendDeliveryNotification', () => {
    it('should send email notification', async () => {
      const result = await service.sendDeliveryNotification(
        mockExpandedDeliverable,
        'Tech Conference 2024'
      )

      expect(result.success).toBe(true)
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@acme.com',
          subject: 'Tech Conference 2024 - Benefit Delivered: Logo on website'
        })
      )
    })

    it('should return error when no email service', async () => {
      const serviceWithoutEmail = createSponsorDeliverableService(mockPb)

      const result = await serviceWithoutEmail.sendDeliveryNotification(
        mockExpandedDeliverable,
        'Tech Conference 2024'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service not configured')
    })

    it('should return error when no contact email', async () => {
      const editionSponsor = mockExpandedDeliverable.editionSponsor
      const sponsor = editionSponsor?.sponsor
      const deliverableWithoutEmail = {
        ...mockExpandedDeliverable,
        editionSponsor: editionSponsor
          ? {
              ...editionSponsor,
              sponsor: sponsor
                ? {
                    ...sponsor,
                    contactEmail: undefined
                  }
                : undefined
            }
          : undefined
      }

      const result = await service.sendDeliveryNotification(
        deliverableWithoutEmail,
        'Tech Conference 2024'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No contact email for sponsor')
    })
  })
})
