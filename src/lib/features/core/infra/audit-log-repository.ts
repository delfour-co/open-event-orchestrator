import type PocketBase from 'pocketbase'
import type { AuditLog, AuditLogFilters, PaginatedAuditLogs } from '../domain/audit-log'
import { AUDIT_RETENTION_DAYS } from '../domain/audit-log'

export interface AuditLogRepository {
  create(data: Omit<AuditLog, 'id' | 'created'>): Promise<AuditLog>
  findByOrganization(
    organizationId: string,
    filters?: AuditLogFilters,
    page?: number,
    perPage?: number
  ): Promise<PaginatedAuditLogs>
  exportCsv(organizationId: string, filters?: AuditLogFilters): Promise<string>
}

function mapRecordToAuditLog(record: Record<string, unknown>): AuditLog {
  return {
    id: record.id as string,
    organizationId: record.organizationId as string,
    userId: (record.userId as string) || undefined,
    userName: (record.userName as string) || undefined,
    action: record.action as AuditLog['action'],
    entityType: (record.entityType as AuditLog['entityType']) || undefined,
    entityId: (record.entityId as string) || undefined,
    entityName: (record.entityName as string) || undefined,
    details: (record.details as Record<string, unknown>) || undefined,
    ipAddress: (record.ipAddress as string) || undefined,
    userAgent: (record.userAgent as string) || undefined,
    created: new Date(record.created as string)
  }
}

function buildFilterParts(organizationId: string, filters?: AuditLogFilters): string[] {
  const filterParts: string[] = [`organizationId="${organizationId}"`]

  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() - AUDIT_RETENTION_DAYS)
  filterParts.push(`created >= "${retentionDate.toISOString()}"`)

  if (filters?.action) {
    filterParts.push(`action="${filters.action}"`)
  }
  if (filters?.userId) {
    filterParts.push(`userId="${filters.userId}"`)
  }
  if (filters?.startDate) {
    filterParts.push(`created >= "${filters.startDate.toISOString()}"`)
  }
  if (filters?.endDate) {
    filterParts.push(`created <= "${filters.endDate.toISOString()}"`)
  }

  return filterParts
}

export function createAuditLogRepository(pb: PocketBase): AuditLogRepository {
  return {
    async create(data) {
      const record = await pb.collection('audit_logs').create(data)
      return mapRecordToAuditLog(record)
    },

    async findByOrganization(organizationId, filters, page = 1, perPage = 25) {
      const filterParts = buildFilterParts(organizationId, filters)

      const result = await pb.collection('audit_logs').getList(page, perPage, {
        filter: filterParts.join(' && '),
        sort: '-created'
      })

      return {
        items: result.items.map(mapRecordToAuditLog),
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages
      }
    },

    async exportCsv(organizationId, filters) {
      const filterParts = buildFilterParts(organizationId, filters)

      const records = await pb.collection('audit_logs').getFullList({
        filter: filterParts.join(' && '),
        sort: '-created'
      })

      const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity Name', 'IP Address']
      const rows = records.map((r) => [
        new Date(r.created as string).toISOString(),
        (r.userName as string) || '',
        r.action as string,
        (r.entityType as string) || '',
        (r.entityName as string) || '',
        (r.ipAddress as string) || ''
      ])

      return [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    }
  }
}
