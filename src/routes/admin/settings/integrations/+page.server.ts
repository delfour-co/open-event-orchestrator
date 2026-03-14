import { getAllIntegrationStatuses } from '$lib/server/integration-service'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const integrations = await getAllIntegrationStatuses(locals.pb)

  return {
    integrations
  }
}
