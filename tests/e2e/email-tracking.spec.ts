import { expect, test } from '@playwright/test'

test.describe('Email Tracking', () => {
  // ==========================================================================
  // Tracking Pixel Endpoint
  // ==========================================================================
  test.describe('Open Tracking (Pixel)', () => {
    test('should return a 1x1 transparent GIF for tracking pixel', async ({ page }) => {
      // Generate a test tracking ID (base64url encoded)
      const trackingData = 'camp-test:contact-test:random123'
      const trackingId = Buffer.from(trackingData).toString('base64url')

      const response = await page.request.get(`/api/tracking/open/${trackingId}`)

      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toBe('image/gif')
      expect(response.headers()['cache-control']).toContain('no-store')
      expect(response.headers().pragma).toBe('no-cache')

      // Check the response body is the 1x1 transparent GIF
      const body = await response.body()
      expect(body.length).toBe(42) // Size of the transparent GIF
    })

    test('should return GIF even with invalid tracking ID', async ({ page }) => {
      // Invalid tracking ID should still return the pixel (fail silently)
      const response = await page.request.get('/api/tracking/open/invalid-tracking-id')

      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toBe('image/gif')
    })
  })

  // ==========================================================================
  // Click Tracking Endpoint
  // ==========================================================================
  test.describe('Click Tracking', () => {
    test('should redirect to target URL', async ({ page }) => {
      const trackingData = 'camp-test:contact-test:random123'
      const trackingId = Buffer.from(trackingData).toString('base64url')
      const targetUrl = encodeURIComponent('https://example.com/landing')

      const response = await page.request.get(
        `/api/tracking/click/${trackingId}?url=${targetUrl}&linkId=link-0`,
        { maxRedirects: 0 }
      )

      expect(response.status()).toBe(302)
      expect(response.headers().location).toBe('https://example.com/landing')
    })

    test('should redirect to home if no target URL provided', async ({ page }) => {
      const trackingData = 'camp-test:contact-test:random123'
      const trackingId = Buffer.from(trackingData).toString('base64url')

      const response = await page.request.get(`/api/tracking/click/${trackingId}`, {
        maxRedirects: 0
      })

      expect(response.status()).toBe(302)
      expect(response.headers().location).toBe('/')
    })

    test('should handle URL with query parameters', async ({ page }) => {
      const trackingData = 'camp-test:contact-test:random123'
      const trackingId = Buffer.from(trackingData).toString('base64url')
      const targetUrl = encodeURIComponent('https://example.com/page?foo=bar&baz=qux')

      const response = await page.request.get(
        `/api/tracking/click/${trackingId}?url=${targetUrl}&linkId=link-1`,
        { maxRedirects: 0 }
      )

      expect(response.status()).toBe(302)
      expect(response.headers().location).toBe('https://example.com/page?foo=bar&baz=qux')
    })

    test('should work even with invalid tracking ID', async ({ page }) => {
      const targetUrl = encodeURIComponent('https://example.com/destination')

      const response = await page.request.get(
        `/api/tracking/click/invalid-id?url=${targetUrl}&linkId=link-0`,
        { maxRedirects: 0 }
      )

      // Should still redirect even if tracking fails
      expect(response.status()).toBe(302)
      expect(response.headers().location).toBe('https://example.com/destination')
    })
  })

  // ==========================================================================
  // Email Campaign with Tracking
  // ==========================================================================
  test.describe('Campaign Email Tracking Integration', () => {
    const eventSlug = 'devfest'

    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should access email campaigns page', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      await expect(page.getByRole('heading', { name: 'Email Campaigns' })).toBeVisible()
    })

    test('should show campaign creation form', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      await page.getByRole('button', { name: /New Campaign/ }).click()

      await expect(page.getByRole('heading', { name: 'New Campaign' })).toBeVisible()
    })

    test('should create a draft campaign', async ({ page }) => {
      await page.goto(`/admin/emails/${eventSlug}`)

      const campaignName = `TrackingTest${Date.now()}`

      await page.getByRole('button', { name: /New Campaign/ }).click()
      await expect(page.getByRole('heading', { name: 'New Campaign' })).toBeVisible()

      // Fill campaign form - use correct IDs from the actual page
      await page.locator('#camp-name').fill(campaignName)
      await page.locator('#camp-subject').fill('Test Subject with Tracking')
      await page
        .locator('#camp-html')
        .fill('<p>Hello!</p><a href="https://example.com">Click here</a>')
      await page.locator('#camp-text').fill('Hello! Visit https://example.com')

      // Submit
      await page.getByRole('button', { name: 'Create Campaign' }).click()
      await page.waitForLoadState('networkidle')

      // Verify success
      await expect(page.getByText('Campaign created successfully')).toBeVisible()
      await expect(page.getByText(campaignName)).toBeVisible()
    })
  })
})
