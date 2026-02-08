import { describe, expect, it } from 'vitest'
import { buildOpenAPISpec } from './spec'

describe('OpenAPI Specification', () => {
  const baseUrl = 'https://api.example.com'

  describe('buildOpenAPISpec', () => {
    it('should return a valid OpenAPI 3.1.0 spec', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.openapi).toBe('3.1.0')
    })

    it('should include correct info section', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.info.title).toBe('Open Event Orchestrator API')
      expect(spec.info.version).toBe('1.0.0')
      expect(spec.info.description).toContain('Public REST API')
      expect(spec.info.description).toContain('Authentication')
      expect(spec.info.description).toContain('Rate Limiting')
      expect(spec.info.description).toContain('Permissions')
      expect(spec.info.description).toContain('Webhooks')
      expect(spec.info.license?.name).toBe('MIT')
    })

    it('should include the provided base URL in servers', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.servers).toHaveLength(1)
      expect(spec.servers[0].url).toBe(baseUrl)
      expect(spec.servers[0].description).toBe('Production server')
    })

    it('should define all required tags', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const tagNames = spec.tags.map((t) => t.name)

      expect(tagNames).toContain('General')
      expect(tagNames).toContain('Organizations')
      expect(tagNames).toContain('Events')
      expect(tagNames).toContain('Editions')
      expect(tagNames).toContain('Speakers')
      expect(tagNames).toContain('Sessions')
      expect(tagNames).toContain('Schedule')
      expect(tagNames).toContain('Ticket Types')
      expect(tagNames).toContain('Sponsors')
    })

    it('should include BearerAuth security scheme', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.components.securitySchemes).toHaveProperty('BearerAuth')
      const bearerAuth = spec.components.securitySchemes.BearerAuth as Record<string, unknown>
      expect(bearerAuth.type).toBe('http')
      expect(bearerAuth.scheme).toBe('bearer')
    })

    it('should apply security globally', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.security).toEqual([{ BearerAuth: [] }])
    })
  })

  describe('schemas', () => {
    it('should include common schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('Error')
      expect(schemas).toHaveProperty('PaginationMeta')
    })

    it('should include organization schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('Organization')
      expect(schemas).toHaveProperty('OrganizationList')
    })

    it('should include event schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('Event')
      expect(schemas).toHaveProperty('EventList')
    })

    it('should include edition schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('Edition')
      expect(schemas).toHaveProperty('EditionList')
    })

    it('should include speaker schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('Speaker')
      expect(schemas).toHaveProperty('SpeakerList')
    })

    it('should include session schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('Session')
      expect(schemas).toHaveProperty('SessionList')
    })

    it('should include schedule schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('Schedule')
      expect(schemas).toHaveProperty('Room')
      expect(schemas).toHaveProperty('Track')
      expect(schemas).toHaveProperty('ScheduleSession')
    })

    it('should include ticket type schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('TicketType')
      expect(schemas).toHaveProperty('TicketTypeList')
    })

    it('should include sponsor schemas', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const schemas = spec.components.schemas

      expect(schemas).toHaveProperty('EditionSponsor')
      expect(schemas).toHaveProperty('EditionSponsorList')
    })

    it('should define Error schema correctly', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const errorSchema = spec.components.schemas.Error as Record<string, unknown>

      expect(errorSchema.type).toBe('object')
      expect(errorSchema.required).toContain('error')
    })

    it('should define PaginationMeta schema correctly', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const metaSchema = spec.components.schemas.PaginationMeta as Record<string, unknown>

      expect(metaSchema.type).toBe('object')
      expect(metaSchema.required).toContain('page')
      expect(metaSchema.required).toContain('perPage')
      expect(metaSchema.required).toContain('total')
      expect(metaSchema.required).toContain('totalPages')
    })
  })

  describe('paths', () => {
    it('should include root endpoint', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.paths).toHaveProperty('/api/v1')
    })

    it('should include organizations endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.paths).toHaveProperty('/api/v1/organizations')
      expect(spec.paths).toHaveProperty('/api/v1/organizations/{id}')
    })

    it('should include events endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.paths).toHaveProperty('/api/v1/events')
      expect(spec.paths).toHaveProperty('/api/v1/events/{id}')
    })

    it('should include editions endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.paths).toHaveProperty('/api/v1/editions')
      expect(spec.paths).toHaveProperty('/api/v1/editions/{id}')
    })

    it('should include edition nested resources', () => {
      const spec = buildOpenAPISpec(baseUrl)

      expect(spec.paths).toHaveProperty('/api/v1/editions/{id}/speakers')
      expect(spec.paths).toHaveProperty('/api/v1/editions/{id}/sessions')
      expect(spec.paths).toHaveProperty('/api/v1/editions/{id}/schedule')
      expect(spec.paths).toHaveProperty('/api/v1/editions/{id}/ticket-types')
      expect(spec.paths).toHaveProperty('/api/v1/editions/{id}/sponsors')
    })

    it('should define GET operations for list endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgsPath = spec.paths['/api/v1/organizations'] as Record<string, unknown>

      expect(orgsPath).toHaveProperty('get')
      const getOp = orgsPath.get as Record<string, unknown>
      expect(getOp.tags).toContain('Organizations')
      expect(getOp.summary).toBeDefined()
      expect(getOp.responses).toBeDefined()
    })

    it('should define GET operations for single resource endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgPath = spec.paths['/api/v1/organizations/{id}'] as Record<string, unknown>

      expect(orgPath).toHaveProperty('get')
      const getOp = orgPath.get as Record<string, unknown>
      expect(getOp.parameters).toBeDefined()
    })

    it('should include pagination parameters for list endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgsPath = spec.paths['/api/v1/organizations'] as Record<string, unknown>
      const getOp = orgsPath.get as { parameters?: Array<{ name: string }> }

      const paramNames = getOp.parameters?.map((p) => p.name) || []
      expect(paramNames).toContain('page')
      expect(paramNames).toContain('per_page')
    })

    it('should define 200 response for successful requests', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgsPath = spec.paths['/api/v1/organizations'] as Record<string, unknown>
      const getOp = orgsPath.get as { responses: Record<string, unknown> }

      expect(getOp.responses).toHaveProperty('200')
    })

    it('should define 401 response for unauthorized requests', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgsPath = spec.paths['/api/v1/organizations'] as Record<string, unknown>
      const getOp = orgsPath.get as { responses: Record<string, unknown> }

      expect(getOp.responses).toHaveProperty('401')
    })

    it('should define 404 response for single resource endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgPath = spec.paths['/api/v1/organizations/{id}'] as Record<string, unknown>
      const getOp = orgPath.get as { responses: Record<string, unknown> }

      expect(getOp.responses).toHaveProperty('404')
    })
  })

  describe('path parameters', () => {
    it('should define id parameter for single resource endpoints', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgPath = spec.paths['/api/v1/organizations/{id}'] as Record<string, unknown>
      const getOp = orgPath.get as {
        parameters?: Array<{ name: string; in: string; required: boolean }>
      }

      const idParam = getOp.parameters?.find((p) => p.name === 'id')
      expect(idParam).toBeDefined()
      expect(idParam?.in).toBe('path')
      expect(idParam?.required).toBe(true)
    })

    it('should define id parameter for nested resources', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const speakersPath = spec.paths['/api/v1/editions/{id}/speakers'] as Record<string, unknown>
      const getOp = speakersPath.get as { parameters?: Array<{ name: string; in: string }> }

      const idParam = getOp.parameters?.find((p) => p.name === 'id')
      expect(idParam).toBeDefined()
      expect(idParam?.in).toBe('path')
    })
  })

  describe('query parameters', () => {
    it('should define filter parameters for events endpoint', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const eventsPath = spec.paths['/api/v1/events'] as Record<string, unknown>
      const getOp = eventsPath.get as { parameters?: Array<{ name: string }> }

      const paramNames = getOp.parameters?.map((p) => p.name) || []
      expect(paramNames).toContain('organization_id')
    })

    it('should define filter parameters for editions endpoint', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const editionsPath = spec.paths['/api/v1/editions'] as Record<string, unknown>
      const getOp = editionsPath.get as { parameters?: Array<{ name: string }> }

      const paramNames = getOp.parameters?.map((p) => p.name) || []
      expect(paramNames).toContain('event_id')
      expect(paramNames).toContain('status')
    })

    it('should define filter parameters for sessions endpoint', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const sessionsPath = spec.paths['/api/v1/editions/{id}/sessions'] as Record<string, unknown>
      const getOp = sessionsPath.get as { parameters?: Array<{ name: string }> }

      const paramNames = getOp.parameters?.map((p) => p.name) || []
      expect(paramNames).toContain('type')
      expect(paramNames).toContain('track_id')
    })

    it('should define filter parameters for sponsors endpoint', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const sponsorsPath = spec.paths['/api/v1/editions/{id}/sponsors'] as Record<string, unknown>
      const getOp = sponsorsPath.get as { parameters?: Array<{ name: string }> }

      const paramNames = getOp.parameters?.map((p) => p.name) || []
      expect(paramNames).toContain('confirmed')
    })
  })

  describe('response schemas', () => {
    it('should reference correct schema for organization list', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgsPath = spec.paths['/api/v1/organizations'] as Record<string, unknown>
      const getOp = orgsPath.get as {
        responses: { '200': { content: { 'application/json': { schema: { $ref: string } } } } }
      }

      expect(getOp.responses['200'].content['application/json'].schema.$ref).toBe(
        '#/components/schemas/OrganizationList'
      )
    })

    it('should reference correct schema for single organization', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgPath = spec.paths['/api/v1/organizations/{id}'] as Record<string, unknown>
      const getOp = orgPath.get as {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: string } } }
              }
            }
          }
        }
      }

      expect(getOp.responses['200'].content['application/json'].schema.properties.data.$ref).toBe(
        '#/components/schemas/Organization'
      )
    })

    it('should reference Error schema for error responses', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const orgsPath = spec.paths['/api/v1/organizations'] as Record<string, unknown>
      const getOp = orgsPath.get as {
        responses: { '401': { content: { 'application/json': { schema: { $ref: string } } } } }
      }

      expect(getOp.responses['401'].content['application/json'].schema.$ref).toBe(
        '#/components/schemas/Error'
      )
    })
  })

  describe('root endpoint', () => {
    it('should return API information', () => {
      const spec = buildOpenAPISpec(baseUrl)
      const rootPath = spec.paths['/api/v1'] as Record<string, unknown>
      const getOp = rootPath.get as Record<string, unknown>

      expect(getOp.tags).toContain('General')
      expect(getOp.summary).toContain('API Information')
    })
  })
})
