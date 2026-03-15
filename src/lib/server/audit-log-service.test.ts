import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/features/core/infra/audit-log-repository', () => ({
  createAuditLogRepository: vi.fn()
}))

import { createAuditLogRepository } from '$lib/features/core/infra/audit-log-repository'
import { writeAuditLog } from './audit-log-service'

describe('audit-log-service', () => {
  let mockPb: PocketBase
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockPb = {
      collection: vi.fn()
    } as unknown as PocketBase

    mockCreate = vi.fn().mockResolvedValue({
      id: 'log1',
      organizationId: 'org1',
      action: 'org.created',
      created: new Date().toISOString()
    })

    vi.mocked(createAuditLogRepository).mockReturnValue({
      create: mockCreate,
      findByOrganization: vi.fn(),
      exportCsv: vi.fn()
    })
  })

  describe('writeAuditLog', () => {
    it('should call repo.create with the provided params', async () => {
      const params = {
        organizationId: 'org1',
        userId: 'user1',
        userName: 'John Doe',
        action: 'org.created' as const,
        entityType: 'organization' as const,
        entityId: 'org1',
        entityName: 'My Org',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0'
      }

      await writeAuditLog(mockPb, params)

      expect(createAuditLogRepository).toHaveBeenCalledWith(mockPb)
      expect(mockCreate).toHaveBeenCalledWith(params)
    })

    it('should not throw when repo.create fails', async () => {
      mockCreate.mockRejectedValue(new Error('DB error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(
        writeAuditLog(mockPb, {
          organizationId: 'org1',
          action: 'org.created' as const
        })
      ).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AuditLog] Failed to write audit log:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle params with optional fields omitted', async () => {
      const params = {
        organizationId: 'org1',
        action: 'org.updated' as const
      }

      await writeAuditLog(mockPb, params)

      expect(mockCreate).toHaveBeenCalledWith(params)
    })
  })
})
