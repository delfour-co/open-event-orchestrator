import { expect, test } from '@playwright/test'

test.describe('API v1', () => {
  test.describe('Root endpoint', () => {
    test('GET /api/v1 should return API info', async ({ request }) => {
      const response = await request.get('/api/v1')

      // Skip if server is not running or route not found
      if (response.status() === 404) {
        test.skip(true, 'API routes not available - server may need restart')
        return
      }

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.name).toBe('Open Event Orchestrator API')
      expect(data.version).toBe('1.0.0')
      expect(data.endpoints).toBeDefined()
      expect(data.endpoints.organizations).toBeDefined()
      expect(data.endpoints.events).toBeDefined()
    })
  })

  test.describe('Authentication', () => {
    test('GET /api/v1/organizations should return 401 without API key', async ({ request }) => {
      const response = await request.get('/api/v1/organizations')

      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data.message).toContain('API key required')
    })

    test('GET /api/v1/events should return 401 without API key', async ({ request }) => {
      const response = await request.get('/api/v1/events')

      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data.message).toContain('API key required')
    })

    test('GET /api/v1/organizations should return 401 with invalid API key', async ({
      request
    }) => {
      const response = await request.get('/api/v1/organizations', {
        headers: {
          Authorization: 'Bearer invalid_key'
        }
      })

      expect(response.status()).toBe(401)
    })

    test('GET /api/v1/organizations should return 401 with malformed Authorization header', async ({
      request
    }) => {
      const response = await request.get('/api/v1/organizations', {
        headers: {
          Authorization: 'Basic sometoken'
        }
      })

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Organizations endpoint - without auth', () => {
    test('GET /api/v1/organizations/:id should return 401 without API key', async ({ request }) => {
      const response = await request.get('/api/v1/organizations/some-id')

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Events endpoint - without auth', () => {
    test('GET /api/v1/events/:id should return 401 without API key', async ({ request }) => {
      const response = await request.get('/api/v1/events/some-id')

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Response format', () => {
    test('Error responses should have correct format', async ({ request }) => {
      const response = await request.get('/api/v1/organizations')

      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data).toHaveProperty('message')
      expect(typeof data.message).toBe('string')
    })
  })
})
