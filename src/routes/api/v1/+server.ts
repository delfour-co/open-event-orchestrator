import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  return json({
    name: 'Open Event Orchestrator API',
    version: '1.0.0',
    documentation: '/api/docs',
    openapi: '/api/v1/openapi.json',
    endpoints: {
      organizations: '/api/v1/organizations',
      events: '/api/v1/events',
      editions: '/api/v1/editions',
      speakers: '/api/v1/speakers',
      orders: '/api/v1/orders'
    }
  })
}
