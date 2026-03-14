import type { AuditAction } from '$lib/features/core/domain/audit-log'
import { createAuditLogRepository } from '$lib/features/core/infra/audit-log-repository'
import { canAccessSettings } from '$lib/server/permissions'
import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ locals, params, url }) => {
  const userRole = locals.user?.role as string | undefined
  if (!canAccessSettings(userRole)) {
    throw error(403, 'Forbidden')
  }

  const organization = await locals.pb
    .collection('organizations')
    .getFirstListItem(`slug="${params.orgSlug}"`)

  const action = url.searchParams.get('action') || undefined
  const userId = url.searchParams.get('userId') || undefined

  const repo = createAuditLogRepository(locals.pb)
  const csv = await repo.exportCsv(organization.id, {
    action: action as AuditAction | undefined,
    userId
  })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-log-${params.orgSlug}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}
