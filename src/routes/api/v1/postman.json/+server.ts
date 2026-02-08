import { buildOpenAPISpec } from '$lib/features/api/openapi'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface PostmanItem {
  name: string
  request: {
    method: string
    header: Array<{ key: string; value: string; type: string }>
    url: {
      raw: string
      host: string[]
      path: string[]
      query?: Array<{ key: string; value: string; description?: string }>
    }
    description?: string
  }
  response: unknown[]
}

interface PostmanFolder {
  name: string
  item: PostmanItem[]
}

export const GET: RequestHandler = async ({ url }) => {
  const baseUrl = `${url.protocol}//${url.host}`
  const spec = buildOpenAPISpec(baseUrl)

  // Build Postman collection
  const collection = {
    info: {
      _postman_id: crypto.randomUUID(),
      name: 'Open Event Orchestrator API',
      description: spec.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{api_key}}',
          type: 'string'
        }
      ]
    },
    variable: [
      {
        key: 'base_url',
        value: `${baseUrl}/api/v1`,
        type: 'string'
      },
      {
        key: 'api_key',
        value: 'oeo_live_your_api_key_here',
        type: 'string'
      }
    ],
    item: [] as PostmanFolder[]
  }

  // Group endpoints by tag
  const foldersByTag: Record<string, PostmanItem[]> = {}

  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods as Record<string, unknown>)) {
      if (typeof operation !== 'object' || operation === null) continue

      const op = operation as {
        tags?: string[]
        summary?: string
        description?: string
        parameters?: Array<{
          name: string
          in: string
          description?: string
          required?: boolean
          schema?: { type?: string; default?: unknown }
        }>
      }

      const tag = op.tags?.[0] || 'Other'

      if (!foldersByTag[tag]) {
        foldersByTag[tag] = []
      }

      // Build URL path segments
      const pathSegments = path.split('/').filter(Boolean)

      // Build query parameters
      const queryParams = (op.parameters || [])
        .filter((p) => p.in === 'query')
        .map((p) => ({
          key: p.name,
          value: String(p.schema?.default || ''),
          description: p.description || ''
        }))

      // Replace path parameters with Postman variables
      const postmanPath = pathSegments.map((segment) => {
        if (segment.startsWith('{') && segment.endsWith('}')) {
          const paramName = segment.slice(1, -1)
          return `:${paramName}`
        }
        return segment
      })

      const item: PostmanItem = {
        name: op.summary || `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: [
            {
              key: 'Accept',
              value: 'application/json',
              type: 'text'
            }
          ],
          url: {
            raw: `{{base_url}}${path}`,
            host: ['{{base_url}}'],
            path: postmanPath,
            ...(queryParams.length > 0 && { query: queryParams })
          },
          description: op.description
        },
        response: []
      }

      foldersByTag[tag].push(item)
    }
  }

  // Convert to folders
  for (const [tag, items] of Object.entries(foldersByTag)) {
    collection.item.push({
      name: tag,
      item: items
    })
  }

  return json(collection, {
    headers: {
      'Content-Disposition': 'attachment; filename="oeo-api-collection.json"'
    }
  })
}
