import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const apiKeys = await locals.pb.collection('api_keys').getFullList({
    sort: '-created',
    expand: 'organizationId,eventId,editionId,createdBy'
  })

  return {
    apiKeys: apiKeys.map((key) => ({
      id: key.id as string,
      name: key.name as string,
      keyPrefix: key.keyPrefix as string,
      permissions: key.permissions as string[],
      rateLimit: (key.rateLimit as number) || 60,
      isActive: key.isActive as boolean,
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt as string) : null,
      expiresAt: key.expiresAt ? new Date(key.expiresAt as string) : null,
      createdAt: new Date(key.created as string),
      organization: key.expand?.organizationId
        ? {
            id: (key.expand.organizationId as Record<string, unknown>).id as string,
            name: (key.expand.organizationId as Record<string, unknown>).name as string
          }
        : null,
      event: key.expand?.eventId
        ? {
            id: (key.expand.eventId as Record<string, unknown>).id as string,
            name: (key.expand.eventId as Record<string, unknown>).name as string
          }
        : null,
      edition: key.expand?.editionId
        ? {
            id: (key.expand.editionId as Record<string, unknown>).id as string,
            name: (key.expand.editionId as Record<string, unknown>).name as string
          }
        : null,
      createdBy: key.expand?.createdBy
        ? {
            id: (key.expand.createdBy as Record<string, unknown>).id as string,
            name: (key.expand.createdBy as Record<string, unknown>).name as string
          }
        : null
    }))
  }
}

export const actions: Actions = {
  revokeKey: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'API key ID is required', action: 'revokeKey' })
    }

    try {
      await locals.pb.collection('api_keys').update(id, {
        isActive: false
      })

      return { success: true, action: 'revokeKey' }
    } catch (err) {
      console.error('Failed to revoke API key:', err)
      return fail(500, { error: 'Failed to revoke API key', action: 'revokeKey' })
    }
  },

  deleteKey: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'API key ID is required', action: 'deleteKey' })
    }

    try {
      await locals.pb.collection('api_keys').delete(id)
      return { success: true, action: 'deleteKey' }
    } catch (err) {
      console.error('Failed to delete API key:', err)
      return fail(500, { error: 'Failed to delete API key', action: 'deleteKey' })
    }
  },

  reactivateKey: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'API key ID is required', action: 'reactivateKey' })
    }

    try {
      await locals.pb.collection('api_keys').update(id, {
        isActive: true
      })

      return { success: true, action: 'reactivateKey' }
    } catch (err) {
      console.error('Failed to reactivate API key:', err)
      return fail(500, { error: 'Failed to reactivate API key', action: 'reactivateKey' })
    }
  }
}
