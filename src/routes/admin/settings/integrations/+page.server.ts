import { getAllIntegrationStatuses } from '$lib/server/integration-service'
import { canAccessSettings } from '$lib/server/permissions'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const integrations = await getAllIntegrationStatuses(locals.pb)

  return {
    integrations
  }
}
