/**
 * OpenAPI specification builder for the Public API
 */

import { apiKeyPermissions } from '../domain/api-key'
import { WEBHOOK_EVENTS, getWebhookEventLabel } from '../domain/webhook'

export type OpenAPISpec = {
  openapi: string
  info: {
    title: string
    description: string
    version: string
    contact?: {
      name?: string
      url?: string
      email?: string
    }
    license?: {
      name: string
      url?: string
    }
  }
  servers: Array<{
    url: string
    description?: string
  }>
  tags: Array<{
    name: string
    description: string
  }>
  paths: Record<string, unknown>
  components: {
    securitySchemes: Record<string, unknown>
    schemas: Record<string, unknown>
  }
  security: Array<Record<string, string[]>>
}

const commonSchemas = {
  Error: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Error code' },
          message: { type: 'string', description: 'Human-readable error message' }
        },
        required: ['message']
      }
    },
    required: ['error']
  },
  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', description: 'Current page number' },
      perPage: { type: 'integer', description: 'Items per page' },
      total: { type: 'integer', description: 'Total number of items' },
      totalPages: { type: 'integer', description: 'Total number of pages' }
    },
    required: ['page', 'perPage', 'total', 'totalPages']
  }
}

const organizationSchemas = {
  Organization: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      name: { type: 'string', description: 'Organization name' },
      description: { type: 'string', nullable: true, description: 'Organization description' },
      website: { type: 'string', nullable: true, description: 'Organization website URL' },
      logoUrl: { type: 'string', nullable: true, description: 'Logo URL' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    },
    required: ['id', 'name', 'createdAt', 'updatedAt']
  },
  OrganizationList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Organization' }
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    },
    required: ['data', 'meta']
  }
}

const eventSchemas = {
  Event: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      name: { type: 'string', description: 'Event name' },
      slug: { type: 'string', description: 'URL-friendly identifier' },
      description: { type: 'string', nullable: true, description: 'Event description' },
      website: { type: 'string', nullable: true, description: 'Event website URL' },
      organizationId: { type: 'string', description: 'Parent organization ID' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    },
    required: ['id', 'name', 'slug', 'organizationId', 'createdAt', 'updatedAt']
  },
  EventList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Event' }
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    },
    required: ['data', 'meta']
  }
}

const editionSchemas = {
  Edition: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      name: { type: 'string', description: 'Edition name' },
      slug: { type: 'string', description: 'URL-friendly identifier' },
      year: { type: 'integer', description: 'Edition year' },
      startDate: { type: 'string', format: 'date', description: 'Start date' },
      endDate: { type: 'string', format: 'date', description: 'End date' },
      venue: { type: 'string', nullable: true, description: 'Venue name' },
      city: { type: 'string', nullable: true, description: 'City' },
      country: { type: 'string', nullable: true, description: 'Country' },
      status: {
        type: 'string',
        enum: ['draft', 'published', 'archived'],
        description: 'Edition status'
      },
      eventId: { type: 'string', description: 'Parent event ID' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    },
    required: [
      'id',
      'name',
      'slug',
      'year',
      'startDate',
      'endDate',
      'status',
      'eventId',
      'createdAt',
      'updatedAt'
    ]
  },
  EditionList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Edition' }
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    },
    required: ['data', 'meta']
  }
}

const speakerSchemas = {
  Speaker: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      firstName: { type: 'string', description: 'First name' },
      lastName: { type: 'string', description: 'Last name' },
      email: { type: 'string', format: 'email', description: 'Email address' },
      bio: { type: 'string', nullable: true, description: 'Speaker biography' },
      company: { type: 'string', nullable: true, description: 'Company name' },
      jobTitle: { type: 'string', nullable: true, description: 'Job title' },
      photoUrl: { type: 'string', nullable: true, description: 'Photo URL' },
      twitter: { type: 'string', nullable: true, description: 'Twitter handle' },
      github: { type: 'string', nullable: true, description: 'GitHub username' },
      linkedin: { type: 'string', nullable: true, description: 'LinkedIn profile' },
      city: { type: 'string', nullable: true, description: 'City' },
      country: { type: 'string', nullable: true, description: 'Country' }
    },
    required: ['id', 'firstName', 'lastName', 'email']
  },
  SpeakerList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Speaker' }
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    },
    required: ['data', 'meta']
  }
}

const sessionSchemas = {
  Session: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      title: { type: 'string', description: 'Session title' },
      description: { type: 'string', nullable: true, description: 'Session description' },
      type: { type: 'string', description: 'Session type (talk, workshop, break, etc.)' },
      slotId: { type: 'string', nullable: true, description: 'Associated slot ID' },
      talkId: { type: 'string', nullable: true, description: 'Associated talk ID' },
      trackId: { type: 'string', nullable: true, description: 'Associated track ID' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
    },
    required: ['id', 'title', 'type', 'createdAt', 'updatedAt']
  },
  SessionList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/Session' }
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    },
    required: ['data', 'meta']
  }
}

const scheduleSchemas = {
  Room: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      capacity: { type: 'integer', nullable: true },
      floor: { type: 'string', nullable: true }
    },
    required: ['id', 'name']
  },
  Track: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      color: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true }
    },
    required: ['id', 'name']
  },
  ScheduleSession: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string', nullable: true },
      type: { type: 'string' },
      date: { type: 'string', format: 'date', nullable: true },
      startTime: { type: 'string', nullable: true },
      endTime: { type: 'string', nullable: true },
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
          color: { type: 'string', nullable: true }
        }
      },
      speakers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            company: { type: 'string', nullable: true }
          }
        }
      }
    },
    required: ['id', 'title', 'type', 'speakers']
  },
  Schedule: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          edition: { $ref: '#/components/schemas/Edition' },
          rooms: {
            type: 'array',
            items: { $ref: '#/components/schemas/Room' }
          },
          tracks: {
            type: 'array',
            items: { $ref: '#/components/schemas/Track' }
          },
          sessions: {
            type: 'array',
            items: { $ref: '#/components/schemas/ScheduleSession' }
          }
        }
      }
    },
    required: ['data']
  }
}

const ticketTypeSchemas = {
  TicketType: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      name: { type: 'string', description: 'Ticket type name' },
      description: { type: 'string', nullable: true, description: 'Description' },
      price: { type: 'number', description: 'Price in cents' },
      currency: { type: 'string', description: 'Currency code (EUR, USD, etc.)' },
      quantity: { type: 'integer', description: 'Total quantity available' },
      quantitySold: { type: 'integer', description: 'Quantity already sold' },
      quantityAvailable: { type: 'integer', description: 'Quantity still available' },
      salesStartDate: { type: 'string', format: 'date-time', nullable: true },
      salesEndDate: { type: 'string', format: 'date-time', nullable: true },
      isActive: { type: 'boolean', description: 'Whether ticket type is currently active' }
    },
    required: [
      'id',
      'name',
      'price',
      'currency',
      'quantity',
      'quantitySold',
      'quantityAvailable',
      'isActive'
    ]
  },
  TicketTypeList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/TicketType' }
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    },
    required: ['data', 'meta']
  }
}

const sponsorSchemas = {
  EditionSponsor: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Edition sponsor relation ID' },
      status: {
        type: 'string',
        enum: ['pending', 'confirmed', 'cancelled'],
        description: 'Sponsorship status'
      },
      sponsor: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          website: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          logo: { type: 'string', nullable: true }
        }
      },
      package: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          tier: { type: 'integer' }
        }
      }
    },
    required: ['id', 'status']
  },
  EditionSponsorList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/EditionSponsor' }
      },
      meta: { $ref: '#/components/schemas/PaginationMeta' }
    },
    required: ['data', 'meta']
  }
}

const paths = {
  '/api/v1': {
    get: {
      tags: ['General'],
      summary: 'API Information',
      description: 'Returns API version and status information',
      responses: {
        '200': {
          description: 'API information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  version: { type: 'string' },
                  documentation: { type: 'string' }
                }
              }
            }
          }
        }
      },
      security: []
    }
  },
  '/api/v1/organizations': {
    get: {
      tags: ['Organizations'],
      summary: 'List Organizations',
      description: 'Retrieve a paginated list of organizations',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page'
        }
      ],
      responses: {
        '200': {
          description: 'List of organizations',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/OrganizationList' } }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/organizations/{id}': {
    get: {
      tags: ['Organizations'],
      summary: 'Get Organization',
      description: 'Retrieve a single organization by ID',
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
              schema: {
                type: 'object',
                properties: { data: { $ref: '#/components/schemas/Organization' } }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Not Found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/events': {
    get: {
      tags: ['Events'],
      summary: 'List Events',
      description: 'Retrieve a paginated list of events',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page'
        },
        {
          name: 'organization_id',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by organization ID'
        }
      ],
      responses: {
        '200': {
          description: 'List of events',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EventList' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/events/{id}': {
    get: {
      tags: ['Events'],
      summary: 'Get Event',
      description: 'Retrieve a single event by ID',
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
              schema: {
                type: 'object',
                properties: { data: { $ref: '#/components/schemas/Event' } }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Not Found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/editions': {
    get: {
      tags: ['Editions'],
      summary: 'List Editions',
      description: 'Retrieve a paginated list of editions',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page'
        },
        {
          name: 'event_id',
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
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EditionList' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/editions/{id}': {
    get: {
      tags: ['Editions'],
      summary: 'Get Edition',
      description: 'Retrieve a single edition by ID',
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
              schema: {
                type: 'object',
                properties: { data: { $ref: '#/components/schemas/Edition' } }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '404': {
          description: 'Not Found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/editions/{id}/speakers': {
    get: {
      tags: ['Speakers'],
      summary: 'Get Edition Speakers',
      description: 'Retrieve speakers for a specific edition (from accepted talks)',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Edition ID'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page'
        }
      ],
      responses: {
        '200': {
          description: 'List of speakers',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SpeakerList' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/editions/{id}/sessions': {
    get: {
      tags: ['Sessions'],
      summary: 'Get Edition Sessions',
      description: 'Retrieve sessions for a specific edition',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Edition ID'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page'
        },
        {
          name: 'type',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by session type'
        },
        {
          name: 'track_id',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by track ID'
        }
      ],
      responses: {
        '200': {
          description: 'List of sessions',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionList' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/editions/{id}/schedule': {
    get: {
      tags: ['Schedule'],
      summary: 'Get Edition Schedule',
      description:
        'Retrieve the full schedule for an edition including rooms, tracks, and sessions with speakers',
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
          description: 'Full schedule',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Schedule' } } }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/editions/{id}/ticket-types': {
    get: {
      tags: ['Ticket Types'],
      summary: 'Get Edition Ticket Types',
      description: 'Retrieve available ticket types for a specific edition',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Edition ID'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page'
        },
        {
          name: 'active',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filter by active status (true for active only)'
        }
      ],
      responses: {
        '200': {
          description: 'List of ticket types',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TicketTypeList' } }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  },
  '/api/v1/editions/{id}/sponsors': {
    get: {
      tags: ['Sponsors'],
      summary: 'Get Edition Sponsors',
      description: 'Retrieve sponsors for a specific edition',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Edition ID'
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number'
        },
        {
          name: 'per_page',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Items per page'
        },
        {
          name: 'confirmed',
          in: 'query',
          schema: { type: 'boolean', default: true },
          description: 'Filter confirmed sponsors only (default: true)'
        }
      ],
      responses: {
        '200': {
          description: 'List of sponsors',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/EditionSponsorList' } }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '403': {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
      }
    }
  }
}

/**
 * Build the complete OpenAPI specification
 */
export function buildOpenAPISpec(baseUrl: string): OpenAPISpec {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Open Event Orchestrator API',
      description: `
Public REST API for Open Event Orchestrator.

## Authentication

All API endpoints require authentication using an API key. Include your API key in the \`Authorization\` header:

\`\`\`
Authorization: Bearer oeo_live_xxxxx
\`\`\`

## Rate Limiting

API requests are rate-limited per API key. The default limit is 60 requests per minute. Rate limit information is included in response headers:

- \`X-RateLimit-Limit\`: Maximum requests per minute
- \`X-RateLimit-Remaining\`: Remaining requests in current window
- \`X-RateLimit-Reset\`: Unix timestamp when the rate limit resets

## Permissions

API keys have specific permissions that determine which endpoints they can access:

${apiKeyPermissions.map((p) => `- \`${p}\``).join('\n')}

## Webhooks

Configure webhooks to receive notifications for events:

${WEBHOOK_EVENTS.map((e) => `- \`${e}\`: ${getWebhookEventLabel(e)}`).join('\n')}

## Pagination

List endpoints support pagination with \`page\` and \`per_page\` query parameters. Responses include a \`meta\` object with pagination information.
			`.trim(),
      version: '1.0.0',
      contact: {
        name: 'API Support'
      },
      license: {
        name: 'MIT'
      }
    },
    servers: [
      {
        url: baseUrl,
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'General', description: 'General API information' },
      { name: 'Organizations', description: 'Organization management' },
      { name: 'Events', description: 'Event management' },
      { name: 'Editions', description: 'Edition (conference year) management' },
      { name: 'Speakers', description: 'Speaker information' },
      { name: 'Sessions', description: 'Session management' },
      { name: 'Schedule', description: 'Schedule and timetable' },
      { name: 'Ticket Types', description: 'Ticket type information' },
      { name: 'Sponsors', description: 'Sponsor information' }
    ],
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'API key authentication. Obtain an API key from the admin panel.'
        }
      },
      schemas: {
        ...commonSchemas,
        ...organizationSchemas,
        ...eventSchemas,
        ...editionSchemas,
        ...speakerSchemas,
        ...sessionSchemas,
        ...scheduleSchemas,
        ...ticketTypeSchemas,
        ...sponsorSchemas
      }
    },
    security: [{ BearerAuth: [] }]
  }
}
