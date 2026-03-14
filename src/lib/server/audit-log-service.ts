import type { AuditAction, AuditEntityType } from '$lib/features/core/domain/audit-log'
import { createAuditLogRepository } from '$lib/features/core/infra/audit-log-repository'
import type PocketBase from 'pocketbase'

export interface AuditLogParams {
  organizationId: string
  userId?: string
  userName?: string
  action: AuditAction
  entityType?: AuditEntityType
  entityId?: string
  entityName?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function writeAuditLog(pb: PocketBase, params: AuditLogParams): Promise<void> {
  try {
    const repo = createAuditLogRepository(pb)
    await repo.create(params)
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err)
  }
}
