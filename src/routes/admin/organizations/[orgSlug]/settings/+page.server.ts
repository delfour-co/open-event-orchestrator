import { writeAuditLog } from '$lib/server/audit-log-service'
import { canAccessSettings } from '$lib/server/permissions'
import { fail, isRedirect, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  updateOrganization: async ({ request, locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify organization settings' })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const website = formData.get('website') as string
    const contactEmail = formData.get('contactEmail') as string
    const vatRateRaw = formData.get('vatRate') as string
    const vatRate = vatRateRaw !== null && vatRateRaw !== '' ? Number(vatRateRaw) : undefined

    if (!name || !slug) {
      return fail(400, { error: 'Name and slug are required' })
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return fail(400, { error: 'Slug must only contain lowercase letters, numbers, and hyphens' })
    }

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      // Check if slug is being changed and if new slug already exists
      if (slug !== params.orgSlug) {
        try {
          await locals.pb.collection('organizations').getFirstListItem(`slug="${slug}"`)
          return fail(400, { error: 'An organization with this slug already exists' })
        } catch {
          // Slug is available
        }
      }

      await locals.pb.collection('organizations').update(organization.id, {
        name,
        slug,
        description: description || null,
        website: website || null,
        contactEmail: contactEmail || null,
        vatRate: vatRate !== undefined ? vatRate : null
      })

      writeAuditLog(locals.pb, {
        organizationId: organization.id,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'org_update',
        entityType: 'organization',
        entityId: organization.id,
        entityName: name,
        details: { field: 'general' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      // If slug changed, redirect to new URL
      if (slug !== params.orgSlug) {
        throw redirect(303, `/admin/organizations/${slug}/settings`)
      }

      return { success: true, message: 'Organization updated successfully' }
    } catch (e) {
      if (isRedirect(e)) throw e
      console.error('Failed to update organization:', e)
      return fail(500, { error: 'Failed to update organization' })
    }
  },

  deleteOrganization: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to delete organizations' })
    }

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      const events = await locals.pb.collection('events').getFullList({
        filter: `organizationId="${organization.id}"`
      })

      if (events.length > 0) {
        return fail(400, {
          error: `Cannot delete organization with ${events.length} event(s). Delete events first.`
        })
      }

      const members = await locals.pb.collection('organization_members').getFullList({
        filter: `organizationId="${organization.id}"`
      })

      for (const member of members) {
        await locals.pb.collection('organization_members').delete(member.id)
      }

      await locals.pb.collection('organizations').delete(organization.id)

      writeAuditLog(locals.pb, {
        organizationId: organization.id,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'org_delete',
        entityType: 'organization',
        entityId: organization.id,
        entityName: organization.name as string,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      throw redirect(303, '/admin/organizations')
    } catch (e) {
      if (isRedirect(e)) throw e
      console.error('Failed to delete organization:', e)
      return fail(500, { error: 'Failed to delete organization' })
    }
  }
}
