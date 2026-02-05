import {
  createExportContactsUseCase,
  createImportContactsUseCase,
  parseCsvToRows
} from '$lib/features/crm/usecases'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const membership = await locals.pb.collection('organization_members').getList(1, 1, {
    filter: `userId = "${locals.user?.id}"`
  })
  if (membership.items.length === 0) throw error(404, 'No organization found')
  const organizationId = membership.items[0].organizationId as string

  return { organizationId }
}

export const actions: Actions = {
  importContacts: async ({ request, locals }) => {
    const formData = await request.formData()
    const csvText = formData.get('csvText') as string
    const strategy = (formData.get('strategy') as string) || 'merge'

    if (!csvText || csvText.trim().length === 0) {
      return fail(400, { error: 'CSV data is required', action: 'importContacts' })
    }

    const membership = await locals.pb.collection('organization_members').getList(1, 1, {
      filter: `userId = "${locals.user?.id}"`
    })
    if (membership.items.length === 0) {
      return fail(404, { error: 'No organization found', action: 'importContacts' })
    }
    const organizationId = membership.items[0].organizationId as string

    try {
      const rows = parseCsvToRows(csvText)
      if (rows.length === 0) {
        return fail(400, {
          error:
            'No valid rows found in CSV. Ensure there is a header row and at least one data row.',
          action: 'importContacts'
        })
      }

      const importContacts = createImportContactsUseCase(locals.pb)
      const result = await importContacts(
        organizationId,
        rows,
        strategy as 'skip' | 'merge' | 'overwrite'
      )

      return {
        success: true,
        action: 'importContacts',
        importResult: {
          total: result.total,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors.map((e) => ({
            row: e.row,
            email: e.email,
            error: e.error
          }))
        }
      }
    } catch (err) {
      console.error('Failed to import contacts:', err)
      return fail(500, { error: 'Failed to import contacts', action: 'importContacts' })
    }
  },

  exportContacts: async ({ request, locals }) => {
    const formData = await request.formData()
    const fieldsRaw = formData.get('fields') as string

    const membership = await locals.pb.collection('organization_members').getList(1, 1, {
      filter: `userId = "${locals.user?.id}"`
    })
    if (membership.items.length === 0) {
      return fail(404, { error: 'No organization found', action: 'exportContacts' })
    }
    const organizationId = membership.items[0].organizationId as string

    try {
      const fields = fieldsRaw ? fieldsRaw.split(',').filter(Boolean) : undefined

      const exportContacts = createExportContactsUseCase(locals.pb)
      const csv = await exportContacts(organizationId, { fields })

      return {
        success: true,
        action: 'exportContacts',
        csvData: csv
      }
    } catch (err) {
      console.error('Failed to export contacts:', err)
      return fail(500, { error: 'Failed to export contacts', action: 'exportContacts' })
    }
  }
}
