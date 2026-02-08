import { type ApiKeyPermission, apiKeyPermissions } from '$lib/features/api/domain/api-key'
import { createApiKeyRepository } from '$lib/features/api/infra'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const [organizations, events, editions] = await Promise.all([
    locals.pb.collection('organizations').getFullList({ sort: 'name' }),
    locals.pb.collection('events').getFullList({ sort: 'name' }),
    locals.pb.collection('editions').getFullList({ sort: '-year' })
  ])

  return {
    permissions: apiKeyPermissions,
    organizations: organizations.map((org) => ({ id: org.id as string, name: org.name as string })),
    events: events.map((event) => ({ id: event.id as string, name: event.name as string })),
    editions: editions.map((edition) => ({
      id: edition.id as string,
      name: edition.name as string,
      year: edition.year as number
    }))
  }
}

function validatePermissions(permissions: string[]): ApiKeyPermission[] | null {
  const valid = permissions.filter((p) =>
    apiKeyPermissions.includes(p as ApiKeyPermission)
  ) as ApiKeyPermission[]
  return valid.length === permissions.length ? valid : null
}

function calculateExpiryDate(expiresIn: string): Date | undefined {
  if (!expiresIn || expiresIn === 'never') return undefined
  const days = Number.parseInt(expiresIn, 10)
  if (Number.isNaN(days) || days <= 0) return undefined
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function buildScope(
  scopeType: string,
  organizationId: string,
  eventId: string,
  editionId: string
): { error?: string; organizationId?: string; eventId?: string; editionId?: string } {
  if (scopeType === 'organization') {
    return organizationId
      ? { organizationId }
      : { error: 'Organization is required for organization scope' }
  }
  if (scopeType === 'event') {
    return eventId ? { eventId } : { error: 'Event is required for event scope' }
  }
  if (scopeType === 'edition') {
    return editionId ? { editionId } : { error: 'Edition is required for edition scope' }
  }
  return {}
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const permissions = formData.getAll('permissions') as string[]
    const rateLimit = formData.get('rateLimit') as string
    const expiresIn = formData.get('expiresIn') as string

    if (!name?.trim()) return fail(400, { error: 'Name is required' })
    if (permissions.length === 0) return fail(400, { error: 'At least one permission is required' })

    const validPermissions = validatePermissions(permissions)
    if (!validPermissions) return fail(400, { error: 'Invalid permissions selected' })

    const scope = buildScope(
      formData.get('scopeType') as string,
      formData.get('organizationId') as string,
      formData.get('eventId') as string,
      formData.get('editionId') as string
    )
    if (scope.error) return fail(400, { error: scope.error })

    try {
      const repo = createApiKeyRepository(locals.pb)
      const { plainTextKey } = await repo.create(
        {
          name: name.trim(),
          organizationId: scope.organizationId,
          eventId: scope.eventId,
          editionId: scope.editionId,
          permissions: validPermissions,
          rateLimit: Number.parseInt(rateLimit, 10) || 60,
          expiresAt: calculateExpiryDate(expiresIn)
        },
        locals.user?.id as string
      )
      return { success: true, apiKey: plainTextKey }
    } catch (err) {
      console.error('Failed to create API key:', err)
      return fail(500, { error: 'Failed to create API key' })
    }
  }
}
