import { hasPermission } from '$lib/features/api/domain'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface ApiOrganization {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  logo?: string
  createdAt: string
  updatedAt: string
}

const mapToApiOrganization = (
  record: Record<string, unknown>,
  logoUrl?: string
): ApiOrganization => ({
  id: record.id as string,
  name: record.name as string,
  slug: record.slug as string,
  description: (record.description as string) || undefined,
  website: (record.website as string) || undefined,
  logo: logoUrl,
  createdAt: record.created as string,
  updatedAt: record.updated as string
})

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:organizations')) {
    throw error(403, { message: 'Permission denied: read:organizations required' })
  }

  const { id } = params

  if (locals.apiKeyScope?.organizationId && locals.apiKeyScope.organizationId !== id) {
    throw error(403, { message: 'API key does not have access to this organization' })
  }

  try {
    const record = await locals.pb.collection('organizations').getOne(id)

    const logoUrl = record.logo ? locals.pb.files.getURL(record, record.logo as string) : undefined

    return json({
      data: mapToApiOrganization(record, logoUrl)
    })
  } catch {
    throw error(404, { message: 'Organization not found' })
  }
}
