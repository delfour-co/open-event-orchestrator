import type { PBAuditLogRecord } from '$lib/server/pb-types'
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

function mapRecordToAuditLog(record: PBAuditLogRecord): AuditLog {
  return {
    id: record.id,
    organizationId: record.organizationId,
    userId: record.userId || undefined,
    userName: record.userName || undefined,
    action: record.action as AuditLog['action'],
    entityType: (record.entityType as AuditLog['entityType']) || undefined,
    entityId: record.entityId || undefined,
    entityName: record.entityName || undefined,
    details: record.details || undefined,
    ipAddress: record.ipAddress || undefined,
    userAgent: record.userAgent || undefined,
    created: new Date(record.created)
  }
}

function toPbDate(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '')
}

function buildFilterParts(organizationId: string, filters?: AuditLogFilters): string[] {
  const filterParts: string[] = [`organizationId="${organizationId}"`]

  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() - AUDIT_RETENTION_DAYS)
  filterParts.push(`created >= "${toPbDate(retentionDate)}"`)

  if (filters?.action) {
    filterParts.push(`action="${filters.action}"`)
  }
  if (filters?.userId) {
    filterParts.push(`userId="${filters.userId}"`)
  }
  if (filters?.startDate) {
    filterParts.push(`created >= "${toPbDate(filters.startDate)}"`)
  }
  if (filters?.endDate) {
    filterParts.push(`created <= "${toPbDate(filters.endDate)}"`)
  }

  return filterParts
}

export function createAuditLogRepository(pb: PocketBase): AuditLogRepository {
  return {
    async create(data) {
      const record = await pb.collection('audit_logs').create<PBAuditLogRecord>(data)
      return mapRecordToAuditLog(record)
    },

    async findByOrganization(organizationId, filters, page = 1, perPage = 25) {
      const filterParts = buildFilterParts(organizationId, filters)

      const result = await pb.collection('audit_logs').getList<PBAuditLogRecord>(page, perPage, {
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

      const records = await pb.collection('audit_logs').getFullList<PBAuditLogRecord>({
        filter: filterParts.join(' && '),
        sort: '-created'
      })

      const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity Name', 'IP Address']
      const rows = records.map((r) => [
        new Date(r.created).toISOString(),
        r.userName || '',
        r.action,
        r.entityType || '',
        r.entityName || '',
        r.ipAddress || ''
      ])

      return [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    }
  }
}
