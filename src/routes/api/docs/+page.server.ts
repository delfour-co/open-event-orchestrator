import { buildOpenAPISpec } from '$lib/features/api/openapi'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const spec = buildOpenAPISpec()

  // Group endpoints by tag
  const endpointsByTag: Record<
    string,
    Array<{
      method: string
      path: string
      summary: string
      description?: string
      parameters?: unknown[]
      responses?: unknown
    }>
  > = {}

  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods as Record<string, unknown>)) {
      if (typeof operation !== 'object' || operation === null) continue
      const op = operation as {
        tags?: string[]
        summary?: string
        description?: string
        parameters?: unknown[]
        responses?: unknown
      }
      const tag = op.tags?.[0] || 'Other'
      if (!endpointsByTag[tag]) {
        endpointsByTag[tag] = []
      }
      endpointsByTag[tag].push({
        method: method.toUpperCase(),
        path,
        summary: op.summary || '',
        description: op.description,
        parameters: op.parameters,
        responses: op.responses
      })
    }
  }

  return {
    info: spec.info,
    servers: spec.servers,
    endpointsByTag,
    securitySchemes: spec.components?.securitySchemes
  }
}
