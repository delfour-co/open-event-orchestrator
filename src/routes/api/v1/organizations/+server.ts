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

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:organizations')) {
    throw error(403, { message: 'Permission denied: read:organizations required' })
  }

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 20))

  const scopeFilter = locals.apiKeyScope?.organizationId
    ? `id = "${locals.apiKeyScope.organizationId}"`
    : ''

  const result = await locals.pb.collection('organizations').getList(page, perPage, {
    filter: scopeFilter,
    sort: 'name'
  })

  const organizations = result.items.map((record) => {
    const logoUrl = record.logo ? locals.pb.files.getURL(record, record.logo as string) : undefined
    return mapToApiOrganization(record, logoUrl)
  })

  return json({
    data: organizations,
    meta: {
      page,
      perPage,
      total: result.totalItems,
      totalPages: result.totalPages
    }
  })
}
