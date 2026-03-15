import type { AuditAction } from '$lib/features/core/domain/audit-log'
import { createAuditLogRepository } from '$lib/features/core/infra/audit-log-repository'
import type { PBOrganizationMemberRecord, PBOrganizationRecord } from '$lib/server/pb-types'
import { canAccessSettings } from '$lib/server/permissions'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const userRole = locals.user?.role as string | undefined
  if (!canAccessSettings(userRole)) {
    throw error(403, 'You do not have permission to view the audit log')
  }

  try {
    const organization = await locals.pb
      .collection('organizations')
      .getFirstListItem<PBOrganizationRecord>(`slug="${params.orgSlug}"`)

    const page = Number(url.searchParams.get('page')) || 1
    const action = url.searchParams.get('action') || undefined
    const userId = url.searchParams.get('userId') || undefined

    const repo = createAuditLogRepository(locals.pb)
    const auditLogs = await repo.findByOrganization(
      organization.id,
      { action: action as AuditAction | undefined, userId },
      page,
      25
    )

    let members: Array<{ id: string; name: string }> = []
    try {
      const memberRecords = await locals.pb
        .collection('organization_members')
        .getFullList<PBOrganizationMemberRecord>({
          filter: `organizationId="${organization.id}"`,
          expand: 'userId'
        })
      members = memberRecords
        .map((m) => ({
          id: m.userId,
          name: m.expand?.userId ? m.expand.userId.name : 'Unknown'
        }))
        .filter((m, i, arr) => arr.findIndex((a) => a.id === m.id) === i)
    } catch {
      /* ignore */
    }

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      auditLogs,
      members,
      filters: { action, userId }
    }
  } catch (err) {
    console.error('[AuditLog] Load error:', err)
    throw redirect(303, '/admin/organizations')
  }
}
