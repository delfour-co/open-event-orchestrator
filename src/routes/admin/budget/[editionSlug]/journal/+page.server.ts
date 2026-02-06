import type { AuditLogFilters } from '$lib/features/budget/domain/audit-log'
import { createAuditLogRepository } from '$lib/features/budget/infra/audit-log-repository'
import { error } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import type { PageServerLoad } from './$types'

function parseFiltersFromUrl(url: URL): {
  filters: AuditLogFilters
  rawFilters: {
    action: string
    entityType: string
    startDate: string
    endDate: string
    search: string
  }
  page: number
} {
  const action = url.searchParams.get('action') || undefined
  const entityType = url.searchParams.get('entityType') || undefined
  const startDateStr = url.searchParams.get('startDate')
  const endDateStr = url.searchParams.get('endDate')
  const search = url.searchParams.get('search') || undefined
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))

  const filters: AuditLogFilters = {}
  if (action) filters.action = action as AuditLogFilters['action']
  if (entityType) filters.entityType = entityType as AuditLogFilters['entityType']
  if (startDateStr) filters.startDate = new Date(startDateStr)
  if (endDateStr) filters.endDate = new Date(endDateStr)
  if (search) filters.search = search

  return {
    filters,
    rawFilters: {
      action: action || '',
      entityType: entityType || '',
      startDate: startDateStr || '',
      endDate: endDateStr || '',
      search: search || ''
    },
    page
  }
}

async function fetchUserEmails(pb: PocketBase, userIds: string[]): Promise<Map<string, string>> {
  const userEmails = new Map<string, string>()
  for (const userId of userIds) {
    try {
      const user = await pb.collection('users').getOne(userId)
      userEmails.set(userId, (user.email as string) || 'Unknown')
    } catch {
      userEmails.set(userId, 'Unknown')
    }
  }
  return userEmails
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string
  const perPage = 25

  const { filters, rawFilters, page } = parseFiltersFromUrl(url)

  const auditRepo = createAuditLogRepository(locals.pb)
  const logsResult = await auditRepo.findByEdition(editionId, filters, page, perPage)

  const userIds = [...new Set(logsResult.items.map((l) => l.userId).filter(Boolean))] as string[]
  const userEmails = await fetchUserEmails(locals.pb, userIds)

  const logs = logsResult.items.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    entityReference: log.entityReference,
    oldValue: log.oldValue,
    newValue: log.newValue,
    metadata: log.metadata,
    created: log.created.toISOString(),
    userEmail: log.userId ? userEmails.get(log.userId) || 'Unknown' : 'System'
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    logs,
    pagination: {
      page: logsResult.page,
      perPage: logsResult.perPage,
      totalItems: logsResult.totalItems,
      totalPages: logsResult.totalPages
    },
    filters: rawFilters
  }
}
