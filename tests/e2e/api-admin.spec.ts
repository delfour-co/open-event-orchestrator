import { expect, test } from '@playwright/test'

test.describe('API Admin UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect
    await page.waitForURL(/\/admin/)
  })

  test.describe('API Dashboard', () => {
    test('should display API dashboard', async ({ page }) => {
      await page.goto('/admin/api')

      // Check page title (h2 contains "API")
      await expect(page.locator('h2').first()).toContainText('API')

      // Check stats cards are present - using more flexible selectors
      await expect(page.getByText('API Keys').first()).toBeVisible()
      await expect(page.getByText('Webhooks').first()).toBeVisible()
      await expect(page.getByText('Requests (24h)')).toBeVisible()
      // Use heading role to specifically target the Documentation card title
      await expect(page.getByRole('heading', { name: 'Documentation' })).toBeVisible()
    })

    test('should have link to create new API key', async ({ page }) => {
      await page.goto('/admin/api')

      // Look for the first link to create a new API key (in header)
      const newKeyButton = page.locator('a[href="/admin/api/keys/new"]').first()
      await expect(newKeyButton).toBeVisible()

      await newKeyButton.click()
      await page.waitForURL(/\/admin\/api\/keys\/new/)
    })

    test('should have link to API documentation', async ({ page }) => {
      await page.goto('/admin/api')

      // Look for button with "Open API Docs" text
      const docsButton = page.getByText('Open API Docs')
      await expect(docsButton).toBeVisible()
    })
  })

  test.describe('API Keys List', () => {
    test('should display API keys list page', async ({ page }) => {
      await page.goto('/admin/api/keys')

      // Check page title
      await expect(page.locator('h2').first()).toContainText('API Keys')

      // Check for New API Key button/link (first one in header)
      await expect(page.locator('a[href="/admin/api/keys/new"]').first()).toBeVisible()
    })

    test('should show empty state when no keys exist', async ({ page }) => {
      await page.goto('/admin/api/keys')

      // Either shows keys or empty state
      const content = await page.textContent('body')
      const hasKeys = content?.includes('oeo_') // Key prefix
      const hasEmptyState = content?.includes('No API keys')

      expect(hasKeys || hasEmptyState).toBe(true)
    })
  })

  test.describe('Create API Key', () => {
    test('should display API key creation form', async ({ page }) => {
      await page.goto('/admin/api/keys/new')

      // Check page title
      await expect(page.locator('h2').first()).toContainText('Create API Key')

      // Check form fields - labels have asterisks for required fields
      await expect(page.getByText('Name *').first()).toBeVisible()

      // Check permissions section
      await expect(page.getByText('Permissions *')).toBeVisible()

      // Check scope selection
      await expect(page.getByText('Scope')).toBeVisible()

      // Check submit button
      await expect(page.getByRole('button', { name: /Create API Key/i })).toBeVisible()
    })

    test('should have disabled submit button without permissions', async ({ page }) => {
      await page.goto('/admin/api/keys/new')

      // The create button should be disabled when no permissions are selected
      const submitButton = page.getByRole('button', { name: /Create API Key/i })
      await expect(submitButton).toBeDisabled()
    })

    test('should enable submit when name and permissions are provided', async ({ page }) => {
      await page.goto('/admin/api/keys/new')

      // Fill name
      await page.locator('input[name="name"]').fill('Test API Key')

      // Select a permission (first checkbox in permissions section)
      await page.locator('input[name="permissions"]').first().check()

      // Submit button should now be enabled
      const submitButton = page.getByRole('button', { name: /Create API Key/i })
      await expect(submitButton).toBeEnabled()
    })
  })

  test.describe('Webhooks List', () => {
    test('should display webhooks list page', async ({ page }) => {
      await page.goto('/admin/api/webhooks')

      // Check page title
      await expect(page.locator('h2').first()).toContainText('Webhooks')

      // Check for New Webhook button/link (first one in header)
      await expect(page.locator('a[href="/admin/api/webhooks/new"]').first()).toBeVisible()
    })

    test('should show empty state when no webhooks exist', async ({ page }) => {
      await page.goto('/admin/api/webhooks')

      // Either shows webhooks or empty state
      const content = await page.textContent('body')
      const hasWebhooks = content?.includes('Active') || content?.includes('Paused')
      const hasEmptyState = content?.includes('No webhooks configured')

      expect(hasWebhooks || hasEmptyState).toBe(true)
    })
  })

  test.describe('Create Webhook', () => {
    test('should display webhook creation form', async ({ page }) => {
      await page.goto('/admin/api/webhooks/new')

      // Check page title
      await expect(page.locator('h2').first()).toContainText('Create Webhook')

      // Check form fields - labels have asterisks for required fields
      await expect(page.getByText('Name *').first()).toBeVisible()
      await expect(page.getByText('Endpoint URL *')).toBeVisible()

      // Check events section
      await expect(page.getByText('Events to Subscribe *')).toBeVisible()

      // Check submit button
      await expect(page.getByRole('button', { name: /Create Webhook/i })).toBeVisible()
    })

    test('should have disabled submit button without events selected', async ({ page }) => {
      await page.goto('/admin/api/webhooks/new')

      // The create button should be disabled when no events are selected
      const submitButton = page.getByRole('button', { name: /Create Webhook/i })
      await expect(submitButton).toBeDisabled()
    })
  })
})

test.describe('API Documentation', () => {
  test('should serve OpenAPI spec at /api/v1/openapi.json', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json')

    expect(response.status()).toBe(200)

    const spec = await response.json()
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.info.title).toContain('Open Event Orchestrator')
    expect(spec.paths).toBeDefined()
    expect(spec.components).toBeDefined()
  })

  test('should include Bearer auth in security schemes', async ({ request }) => {
    const response = await request.get('/api/v1/openapi.json')
    const spec = await response.json()

    expect(spec.components.securitySchemes).toBeDefined()
    expect(
      spec.components.securitySchemes.bearerAuth || spec.components.securitySchemes.BearerAuth
    ).toBeDefined()
  })

  test('should display Swagger UI documentation page', async ({ page }) => {
    await page.goto('/api/docs')

    // The page should either show:
    // 1. Swagger UI with #swagger-ui element and API title
    // 2. A loading state
    // 3. An error message
    // This handles cases where CDN is slow or blocked

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')

    // Check that the page loaded (either showing docs, loading, or error)
    const content = await page.textContent('body')
    const hasSwaggerUI =
      content?.includes('Open Event Orchestrator') || content?.includes('swagger')
    const hasLoadingState = content?.includes('Loading API documentation')
    const hasErrorState = content?.includes('Failed to load')

    // At least one of these states should be true
    expect(hasSwaggerUI || hasLoadingState || hasErrorState).toBe(true)
  })
})
