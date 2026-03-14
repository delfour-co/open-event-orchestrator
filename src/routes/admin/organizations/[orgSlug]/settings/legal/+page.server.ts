import { writeAuditLog } from '$lib/server/audit-log-service'
import { canAccessSettings } from '$lib/server/permissions'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  updateLegal: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify organization settings' })
    }

    const formData = await request.formData()
    const legalName = formData.get('legalName') as string
    const legalForm = formData.get('legalForm') as string
    const rcsNumber = formData.get('rcsNumber') as string
    const shareCapital = formData.get('shareCapital') as string
    const siret = formData.get('siret') as string
    const vatNumber = formData.get('vatNumber') as string
    const address = formData.get('address') as string
    const city = formData.get('city') as string
    const postalCode = formData.get('postalCode') as string
    const country = formData.get('country') as string

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      await locals.pb.collection('organizations').update(organization.id, {
        legalName: legalName || null,
        legalForm: legalForm || null,
        rcsNumber: rcsNumber || null,
        shareCapital: shareCapital || null,
        siret: siret || null,
        vatNumber: vatNumber || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null
      })

      writeAuditLog(locals.pb, {
        organizationId: organization.id,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'org_update',
        entityType: 'organization',
        entityId: organization.id,
        entityName: organization.name as string,
        details: { field: 'legal' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Legal information updated successfully' }
    } catch (e) {
      console.error('Failed to update legal information:', e)
      return fail(500, { error: 'Failed to update legal information' })
    }
  }
}
