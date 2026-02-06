import type PocketBase from 'pocketbase'
import type {
  AuditLogFilters,
  CreateAuditLog,
  FinancialAuditLog,
  PaginatedAuditLogs
} from '../domain'

const COLLECTION = 'financial_audit_log'

const buildFilterQuery = (editionId: string, filters?: AuditLogFilters): string => {
  const conditions: string[] = [`editionId = "${editionId}"`]

  if (filters?.action) {
    conditions.push(`action = "${filters.action}"`)
  }

  if (filters?.entityType) {
    conditions.push(`entityType = "${filters.entityType}"`)
  }

  if (filters?.userId) {
    conditions.push(`userId = "${filters.userId}"`)
  }

  if (filters?.startDate) {
    conditions.push(`created >= "${filters.startDate.toISOString()}"`)
  }

  if (filters?.endDate) {
    conditions.push(`created <= "${filters.endDate.toISOString()}"`)
  }

  if (filters?.search) {
    conditions.push(`entityReference ~ "${filters.search}"`)
  }

  return conditions.join(' && ')
}

export const createAuditLogRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<FinancialAuditLog | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToAuditLog(record)
    } catch {
      return null
    }
  },

  async findByEdition(
    editionId: string,
    filters?: AuditLogFilters,
    page = 1,
    perPage = 50
  ): Promise<PaginatedAuditLogs> {
    const filterQuery = buildFilterQuery(editionId, filters)
    const result = await pb.collection(COLLECTION).getList(page, perPage, {
      filter: filterQuery,
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

  async findByEntity(entityType: string, entityId: string): Promise<FinancialAuditLog[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `entityType = "${entityType}" && entityId = "${entityId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToAuditLog)
  },

  async findAllByEdition(
    editionId: string,
    filters?: AuditLogFilters
  ): Promise<FinancialAuditLog[]> {
    const filterQuery = buildFilterQuery(editionId, filters)
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterQuery,
      sort: '-created'
    })
    return records.map(mapRecordToAuditLog)
  },

  async create(data: CreateAuditLog): Promise<FinancialAuditLog> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityReference: data.entityReference || null,
      oldValue: data.oldValue || null,
      newValue: data.newValue || null,
      metadata: data.metadata || null
    })
    return mapRecordToAuditLog(record)
  },

  async countByEdition(editionId: string): Promise<number> {
    const result = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `editionId = "${editionId}"`,
      fields: 'id'
    })
    return result.totalItems
  }
})

const mapRecordToAuditLog = (record: Record<string, unknown>): FinancialAuditLog => ({
  id: record.id as string,
  editionId: record.editionId as string,
  userId: (record.userId as string) || undefined,
  action: record.action as FinancialAuditLog['action'],
  entityType: record.entityType as FinancialAuditLog['entityType'],
  entityId: record.entityId as string,
  entityReference: (record.entityReference as string) || undefined,
  oldValue: (record.oldValue as Record<string, unknown>) || undefined,
  newValue: (record.newValue as Record<string, unknown>) || undefined,
  metadata: (record.metadata as Record<string, unknown>) || undefined,
  created: new Date(record.created as string)
})

export type AuditLogRepository = ReturnType<typeof createAuditLogRepository>
