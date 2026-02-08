import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Open Event Orchestrator API',
    version: '1.0.0',
    description: `
The Open Event Orchestrator Public API provides programmatic access to event data.

## Authentication

All API requests require authentication using an API key. Include your API key in the \`Authorization\` header:

\`\`\`
Authorization: Bearer oeo_your_api_key_here
\`\`\`

API keys can be created and managed in the [Admin Dashboard](/admin/api/keys).

## Rate Limiting

API requests are rate-limited based on your API key configuration. The default limit is 60 requests per minute.
Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Maximum requests per minute
- \`X-RateLimit-Remaining\`: Remaining requests in current window
- \`X-RateLimit-Reset\`: Unix timestamp when the rate limit resets

## Pagination

List endpoints support pagination using \`page\` and \`per_page\` query parameters:
- \`page\`: Page number (default: 1)
- \`per_page\`: Items per page (default: 20, max: 100)

Paginated responses include metadata:
\`\`\`json
{
  "data": [...],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
\`\`\`
    `.trim(),
    contact: {
      name: 'Open Event Orchestrator',
      url: 'https://github.com/your-org/open-event-orchestrator'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1'
    }
  ],
  tags: [
    { name: 'Organizations', description: 'Organization management' },
    { name: 'Events', description: 'Event management' },
    { name: 'Editions', description: 'Edition management' },
    { name: 'Speakers', description: 'Speaker information' },
    { name: 'Sessions', description: 'Session and schedule data' },
    { name: 'Tickets', description: 'Ticket types and orders' },
    { name: 'Sponsors', description: 'Sponsor information' }
  ],
  paths: {
    '/': {
      get: {
        summary: 'API Information',
        description: 'Returns basic information about the API',
        operationId: 'getApiInfo',
        responses: {
          '200': {
            description: 'API information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Open Event Orchestrator API' },
                    version: { type: 'string', example: '1.0.0' },
                    documentation: { type: 'string', example: '/api/docs' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'List organizations',
        description: 'Returns a paginated list of organizations',
        operationId: 'listOrganizations',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/perPage' }
        ],
        responses: {
          '200': {
            description: 'List of organizations',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrganizationListResponse'
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/organizations/{id}': {
      get: {
        tags: ['Organizations'],
        summary: 'Get organization by ID',
        description: 'Returns a single organization',
        operationId: 'getOrganization',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Organization ID'
          }
        ],
        responses: {
          '200': {
            description: 'Organization details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Organization' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'List events',
        description: 'Returns a paginated list of events',
        operationId: 'listEvents',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/perPage' }
        ],
        responses: {
          '200': {
            description: 'List of events',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EventListResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event by ID',
        description: 'Returns a single event',
        operationId: 'getEvent',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Event ID'
          }
        ],
        responses: {
          '200': {
            description: 'Event details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/editions': {
      get: {
        tags: ['Editions'],
        summary: 'List editions',
        description: 'Returns a paginated list of editions',
        operationId: 'listEditions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/perPage' },
          {
            name: 'eventId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by event ID'
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['draft', 'published', 'archived'] },
            description: 'Filter by status'
          }
        ],
        responses: {
          '200': {
            description: 'List of editions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EditionListResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/editions/{id}': {
      get: {
        tags: ['Editions'],
        summary: 'Get edition by ID',
        description: 'Returns a single edition with full details',
        operationId: 'getEdition',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Edition ID'
          }
        ],
        responses: {
          '200': {
            description: 'Edition details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Edition' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/editions/{id}/schedule': {
      get: {
        tags: ['Sessions'],
        summary: 'Get edition schedule',
        description: 'Returns the full schedule for an edition',
        operationId: 'getEditionSchedule',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Edition ID'
          }
        ],
        responses: {
          '200': {
            description: 'Edition schedule',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Schedule' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/editions/{id}/speakers': {
      get: {
        tags: ['Speakers'],
        summary: 'Get edition speakers',
        description: 'Returns all speakers for an edition',
        operationId: 'getEditionSpeakers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Edition ID'
          },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/perPage' }
        ],
        responses: {
          '200': {
            description: 'List of speakers',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SpeakerListResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/editions/{id}/sessions': {
      get: {
        tags: ['Sessions'],
        summary: 'Get edition sessions',
        description: 'Returns all sessions for an edition',
        operationId: 'getEditionSessions',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Edition ID'
          },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/perPage' },
          {
            name: 'trackId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by track ID'
          },
          {
            name: 'date',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Filter by date (YYYY-MM-DD)'
          }
        ],
        responses: {
          '200': {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessionListResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/editions/{id}/ticket-types': {
      get: {
        tags: ['Tickets'],
        summary: 'Get edition ticket types',
        description: 'Returns available ticket types for an edition',
        operationId: 'getEditionTicketTypes',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Edition ID'
          }
        ],
        responses: {
          '200': {
            description: 'List of ticket types',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketTypeListResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/editions/{id}/sponsors': {
      get: {
        tags: ['Sponsors'],
        summary: 'Get edition sponsors',
        description: 'Returns all sponsors for an edition',
        operationId: 'getEditionSponsors',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Edition ID'
          }
        ],
        responses: {
          '200': {
            description: 'List of sponsors',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SponsorListResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/speakers': {
      get: {
        tags: ['Speakers'],
        summary: 'List speakers',
        description: 'Returns a paginated list of speakers',
        operationId: 'listSpeakers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/perPage' }
        ],
        responses: {
          '200': {
            description: 'List of speakers',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SpeakerListResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/speakers/{id}': {
      get: {
        tags: ['Speakers'],
        summary: 'Get speaker by ID',
        description: 'Returns a single speaker',
        operationId: 'getSpeaker',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Speaker ID'
          }
        ],
        responses: {
          '200': {
            description: 'Speaker details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Speaker' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/orders': {
      post: {
        tags: ['Tickets'],
        summary: 'Create order',
        description: 'Creates a new ticket order',
        operationId: 'createOrder',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key authentication. Format: Bearer oeo_xxx'
      }
    },
    parameters: {
      page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number'
      },
      perPage: {
        name: 'per_page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Items per page'
      }
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: { code: 'UNAUTHORIZED', message: 'API key required' } }
          }
        }
      },
      Forbidden: {
        description: 'Permission denied',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: { code: 'FORBIDDEN', message: 'Permission denied' } }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: { code: 'NOT_FOUND', message: 'Resource not found' } }
          }
        }
      },
      BadRequest: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: { code: 'BAD_REQUEST', message: 'Invalid request body' } }
          }
        }
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' }
            },
            required: ['code', 'message']
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          perPage: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' }
        }
      },
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          website: { type: 'string', nullable: true },
          logo: { type: 'string', nullable: true }
        }
      },
      OrganizationListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Organization' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' }
        }
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          organizationId: { type: 'string' }
        }
      },
      EventListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Event' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' }
        }
      },
      Edition: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          year: { type: 'integer' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          venue: { type: 'string', nullable: true },
          city: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          eventId: { type: 'string' }
        }
      },
      EditionListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Edition' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' }
        }
      },
      Speaker: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          company: { type: 'string', nullable: true },
          jobTitle: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          photo: { type: 'string', nullable: true },
          twitter: { type: 'string', nullable: true },
          linkedin: { type: 'string', nullable: true },
          github: { type: 'string', nullable: true }
        }
      },
      SpeakerListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Speaker' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' }
        }
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          type: { type: 'string', enum: ['talk', 'workshop', 'keynote', 'break', 'other'] },
          date: { type: 'string', format: 'date' },
          startTime: { type: 'string', format: 'time' },
          endTime: { type: 'string', format: 'time' },
          room: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          },
          track: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              color: { type: 'string' }
            }
          },
          speakers: {
            type: 'array',
            items: { $ref: '#/components/schemas/Speaker' }
          }
        }
      },
      SessionListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Session' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' }
        }
      },
      Schedule: {
        type: 'object',
        properties: {
          edition: { $ref: '#/components/schemas/Edition' },
          rooms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                capacity: { type: 'integer', nullable: true }
              }
            }
          },
          tracks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                color: { type: 'string' }
              }
            }
          },
          sessions: { type: 'array', items: { $ref: '#/components/schemas/Session' } }
        }
      },
      TicketType: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          price: { type: 'integer', description: 'Price in cents' },
          currency: { type: 'string', enum: ['EUR', 'USD', 'GBP'] },
          quantity: { type: 'integer' },
          quantityAvailable: { type: 'integer' },
          salesStartDate: { type: 'string', format: 'date-time', nullable: true },
          salesEndDate: { type: 'string', format: 'date-time', nullable: true },
          isActive: { type: 'boolean' }
        }
      },
      TicketTypeListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/TicketType' } }
        }
      },
      Sponsor: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          logo: { type: 'string', nullable: true },
          website: { type: 'string', nullable: true },
          tier: { type: 'string' }
        }
      },
      SponsorListResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Sponsor' } }
        }
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['editionId', 'items', 'customerEmail', 'customerName'],
        properties: {
          editionId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['ticketTypeId', 'quantity'],
              properties: {
                ticketTypeId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 }
              }
            }
          },
          customerEmail: { type: 'string', format: 'email' },
          customerName: { type: 'string' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          editionId: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'paid', 'cancelled', 'refunded'] },
          totalAmount: { type: 'integer', description: 'Total in cents' },
          currency: { type: 'string' },
          customerEmail: { type: 'string' },
          customerName: { type: 'string' },
          checkoutUrl: {
            type: 'string',
            nullable: true,
            description: 'Stripe checkout URL for payment'
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}

export const GET: RequestHandler = async () => {
  return json(openApiSpec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
