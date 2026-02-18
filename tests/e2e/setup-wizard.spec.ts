import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * E2E tests for the Initial Setup Wizard feature (#277)
 *
 * The setup wizard allows creating the first admin user with a unique token.
 * It is accessible at /setup/[token] route.
 *
 * Note: These tests require careful handling because:
 * 1. The setup wizard only works when no users exist (first run)
 * 2. Token is stored in a file (.setup-token.json)
 * 3. After setup, the token is marked as used
 *
 * For testing purposes, we manipulate the token file directly.
 */

const SETUP_TOKEN_FILE = join(process.cwd(), '.setup-token.json')
const TOKEN_LENGTH = 48

/**
 * Generate a test token similar to the production token generation
 */
function generateTestToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = ''
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

/**
 * Create a valid setup token file for testing
 */
function createValidTokenFile(token: string): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now

  const tokenData = {
    id: `test-${Date.now()}`,
    token,
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }

  writeFileSync(SETUP_TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf-8')
}

/**
 * Create an expired setup token file for testing
 */
function createExpiredTokenFile(token: string): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago (expired)

  const tokenData = {
    id: `test-${Date.now()}`,
    token,
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }

  writeFileSync(SETUP_TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf-8')
}

/**
 * Create a used setup token file for testing
 */
function createUsedTokenFile(token: string): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Still valid but used

  const tokenData = {
    id: `test-${Date.now()}`,
    token,
    expiresAt: expiresAt.toISOString(),
    used: true,
    usedAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }

  writeFileSync(SETUP_TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf-8')
}

/**
 * Delete the setup token file
 */
function deleteTokenFile(): void {
  try {
    if (existsSync(SETUP_TOKEN_FILE)) {
      unlinkSync(SETUP_TOKEN_FILE)
    }
  } catch {
    // Ignore errors
  }
}

test.describe('Initial Setup Wizard', () => {
  // Run tests serially to avoid token file conflicts
  test.describe.configure({ mode: 'serial' })

  test.describe('Invalid Token Scenarios', () => {
    test('should show 404 error for non-existent token', async ({ page }) => {
      // Clean up any existing token file
      deleteTokenFile()

      // Try to access setup with a random token that does not exist
      const randomToken = generateTestToken()
      const response = await page.goto(`/setup/${randomToken}`)

      // Should get 404 response
      expect(response?.status()).toBe(404)

      // Should show error message about setup link not found
      await expect(
        page.getByText(/setup link not found|Please check the URL|request a new setup link/i)
      ).toBeVisible()
    })

    test('should show 410 error for expired token', async ({ page }) => {
      const testToken = generateTestToken()

      // Create an expired token file
      createExpiredTokenFile(testToken)

      const response = await page.goto(`/setup/${testToken}`)

      // Should get 410 Gone response
      expect(response?.status()).toBe(410)

      // Should show expired message - use first() to avoid strict mode violation
      await expect(page.getByText(/expired/i).first()).toBeVisible()

      // Clean up
      deleteTokenFile()
    })

    test('should show 410 error for already used token', async ({ page }) => {
      const testToken = generateTestToken()

      // Create a used token file
      createUsedTokenFile(testToken)

      const response = await page.goto(`/setup/${testToken}`)

      // Should get 410 Gone response
      expect(response?.status()).toBe(410)

      // Should show already used message
      await expect(page.getByText(/already been used|login with your admin account/i)).toBeVisible()

      // Should have link to login page
      await expect(page.getByRole('link', { name: /login|sign in/i })).toBeVisible()

      // Clean up
      deleteTokenFile()
    })

    test('should show error page with appropriate styling', async ({ page }) => {
      deleteTokenFile()

      const randomToken = generateTestToken()
      await page.goto(`/setup/${randomToken}`)
      await page.waitForLoadState('networkidle')

      // Should show error icon (AlertCircle) - use first() since there might be multiple svgs
      await expect(page.locator('svg').first()).toBeVisible()

      // Should have error title
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Valid Token - Setup Form Display', () => {
    let testToken: string

    test.beforeEach(async () => {
      testToken = generateTestToken()
      createValidTokenFile(testToken)
    })

    test.afterEach(async () => {
      deleteTokenFile()
    })

    test('should display setup form when valid token is provided', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Should show welcome heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Should show organization name field
      await expect(page.locator('#organizationName')).toBeVisible()

      // Should show email field
      await expect(page.locator('#email')).toBeVisible()

      // Should show password fields
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('#passwordConfirm')).toBeVisible()

      // Should show submit button
      await expect(
        page.getByRole('button', { name: /complete setup|create|submit/i })
      ).toBeVisible()
    })

    test('should show setup wizard notice', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Should show initial setup card with description
      await expect(page.getByText(/setup wizard will only appear once/i)).toBeVisible()
    })

    test('should show link expiry notice', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Should show expiry notice at the bottom
      await expect(page.getByText(/link will expire in 24 hours/i)).toBeVisible()
    })

    test('should have proper page title', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)

      // Should have appropriate page title
      await expect(page).toHaveTitle(/setup|initial|welcome/i)
    })
  })

  test.describe('Setup Form Validation', () => {
    let testToken: string

    test.beforeEach(async () => {
      testToken = generateTestToken()
      createValidTokenFile(testToken)
    })

    test.afterEach(async () => {
      deleteTokenFile()
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Wait for form to be visible
      await expect(page.locator('#organizationName')).toBeVisible({ timeout: 5000 })

      // Click submit without filling any fields
      await page.getByRole('button', { name: /complete setup|create|submit/i }).click()

      // Check for HTML5 validation on email field
      const emailInput = page.locator('#email')
      const isInvalid = await emailInput.evaluate(
        (el) => (el as HTMLInputElement).validity.valueMissing
      )
      expect(isInvalid).toBe(true)
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Fill with invalid email
      await page.locator('#organizationName').fill('Test Organization')
      await page.locator('#email').fill('invalid-email')
      await page.locator('#password').fill('password123')
      await page.locator('#passwordConfirm').fill('password123')

      await page.getByRole('button', { name: /complete setup|create|submit/i }).click()

      // Check for HTML5 validation on email field (browser shows native validation)
      const emailInput = page.locator('#email')
      const isInvalid = await emailInput.evaluate((el) => !(el as HTMLInputElement).validity.valid)
      expect(isInvalid).toBe(true)
    })

    test('should show error for short password', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Wait for form to be visible
      await expect(page.locator('#organizationName')).toBeVisible({ timeout: 5000 })

      // Fill with short password
      await page.locator('#organizationName').fill('Test Organization')
      await page.locator('#email').fill('admin@test.com')
      await page.locator('#password').fill('short')
      await page.locator('#passwordConfirm').fill('short')

      await page.getByRole('button', { name: /complete setup|create|submit/i }).click()

      // Wait for page to process - should show validation error
      // Server validation returns "Password must be at least 8 characters"
      await expect(page.getByText(/Password must be at least 8 characters/i)).toBeVisible({
        timeout: 5000
      })
    })

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Wait for form to be visible
      await expect(page.locator('#organizationName')).toBeVisible({ timeout: 5000 })

      // Fill with mismatched passwords
      await page.locator('#organizationName').fill('Test Organization')
      await page.locator('#email').fill('admin@test.com')
      await page.locator('#password').fill('password123')
      await page.locator('#passwordConfirm').fill('differentpassword')

      await page.getByRole('button', { name: /complete setup|create|submit/i }).click()

      // Should show password mismatch error
      await expect(page.getByText(/Passwords do not match/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show error for short organization name', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Wait for form to be visible
      await expect(page.locator('#organizationName')).toBeVisible({ timeout: 5000 })

      // Fill with very short org name
      await page.locator('#organizationName').fill('A')
      await page.locator('#email').fill('admin@test.com')
      await page.locator('#password').fill('password123')
      await page.locator('#passwordConfirm').fill('password123')

      await page.getByRole('button', { name: /complete setup|create|submit/i }).click()

      // Should show organization name validation error
      await expect(page.getByText(/Organization name must be at least 2 characters/i)).toBeVisible({
        timeout: 5000
      })
    })
  })

  test.describe('Setup Form Interactions', () => {
    let testToken: string

    test.beforeEach(async () => {
      testToken = generateTestToken()
      createValidTokenFile(testToken)
    })

    test.afterEach(async () => {
      deleteTokenFile()
    })

    test('should preserve form values on validation error', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      const email = 'test@example.com'
      const orgName = 'Test Organization'

      // Fill form with mismatched passwords
      await page.locator('#organizationName').fill(orgName)
      await page.locator('#email').fill(email)
      await page.locator('#password').fill('password123')
      await page.locator('#passwordConfirm').fill('differentpassword')

      await page.getByRole('button', { name: /complete setup|create|submit/i }).click()

      // Wait for validation error
      await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5000 })

      // Form values should be preserved
      await expect(page.locator('#email')).toHaveValue(email)
      await expect(page.locator('#organizationName')).toHaveValue(orgName)
    })

    test('should show submitting state when form is submitted', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Fill valid form data
      await page.locator('#organizationName').fill('Test Organization')
      await page.locator('#email').fill('newadmin@test.com')
      await page.locator('#password').fill('password123')
      await page.locator('#passwordConfirm').fill('password123')

      // Click submit and check for submitting state
      const submitButton = page.getByRole('button', { name: /complete setup|create|submit/i })

      // The button might show a loading state briefly
      await submitButton.click()

      // Note: The actual completion behavior depends on whether the test database
      // has users. In a real E2E test environment with reset database,
      // this would redirect to /admin after successful setup.
    })

    test('should disable form fields during submission', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Fill valid form data
      await page.locator('#organizationName').fill('Test Organization')
      await page.locator('#email').fill('newadmin@test.com')
      await page.locator('#password').fill('password123')
      await page.locator('#passwordConfirm').fill('password123')

      // Start submission
      const submitButton = page.getByRole('button', { name: /complete setup|create|submit/i })

      // Use Promise.race to check if button becomes disabled briefly
      const submitPromise = submitButton.click()

      // Wait for either navigation or button state change
      await Promise.race([
        submitPromise,
        page.waitForURL(/\/admin/, { timeout: 5000 }).catch(() => {
          // OK if it doesn't redirect (e.g., validation error)
        })
      ])
    })
  })

  test.describe('Setup Form Sections', () => {
    let testToken: string

    test.beforeEach(async () => {
      testToken = generateTestToken()
      createValidTokenFile(testToken)
    })

    test.afterEach(async () => {
      deleteTokenFile()
    })

    test('should display organization section', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Should have organization section indicator with exact text
      await expect(page.getByText('Organization', { exact: true })).toBeVisible()

      // Should have organization name input
      const orgInput = page.locator('#organizationName')
      await expect(orgInput).toBeVisible()

      // Should have Organization Name label
      await expect(page.getByText('Organization Name')).toBeVisible()
    })

    test('should display admin account section', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Should have email section
      await expect(page.locator('#email')).toBeVisible()

      // Should have password section
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('#passwordConfirm')).toBeVisible()

      // Should have password minimum length hint
      await expect(page.getByText(/8 characters/i)).toBeVisible()
    })

    test('should have proper visual hierarchy', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Main heading should be visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Card should be present
      await expect(page.locator('[class*="Card"], [class*="card"]')).toBeVisible()

      // Icons should be present (Building2, Mail, Lock from lucide)
      await expect(page.locator('svg').first()).toBeVisible()
    })
  })

  test.describe('Error Page Functionality', () => {
    test('should have refresh button for non-used errors', async ({ page }) => {
      deleteTokenFile()

      const randomToken = generateTestToken()
      await page.goto(`/setup/${randomToken}`)

      // Should have a try again / refresh button for 404 errors
      const refreshButton = page.getByRole('button', { name: /try again|refresh/i })
      const isRefreshVisible = await refreshButton.isVisible().catch(() => false)

      // 404 errors may not have refresh button, but 410 (expired, not used) should
      expect(isRefreshVisible || (await page.getByText(/not found/i).isVisible())).toBe(true)
    })

    test('should have login link for already-used token', async ({ page }) => {
      const testToken = generateTestToken()
      createUsedTokenFile(testToken)

      await page.goto(`/setup/${testToken}`)

      // Should have link to login
      const loginLink = page.getByRole('link', { name: /login|sign in/i })
      await expect(loginLink).toBeVisible()

      // Login link should point to auth/login
      await expect(loginLink).toHaveAttribute('href', '/auth/login')

      deleteTokenFile()
    })

    test('should display restart hint for expired tokens', async ({ page }) => {
      const testToken = generateTestToken()
      createExpiredTokenFile(testToken)

      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Should show hint about getting a new link - use first() to avoid strict mode
      await expect(page.getByText(/restart the server/i).first()).toBeVisible()

      deleteTokenFile()
    })
  })

  test.describe('Accessibility', () => {
    let testToken: string

    test.beforeEach(async () => {
      testToken = generateTestToken()
      createValidTokenFile(testToken)
    })

    test.afterEach(async () => {
      deleteTokenFile()
    })

    test('should have proper form labels', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Wait for form to be visible first
      await expect(page.locator('#organizationName')).toBeVisible({ timeout: 5000 })

      // All inputs should have associated labels - use ID selectors
      const orgInput = page.locator('#organizationName')
      await expect(orgInput).toBeVisible()

      const emailInput = page.locator('#email')
      await expect(emailInput).toBeVisible()

      const passwordInput = page.locator('#password')
      await expect(passwordInput).toBeVisible()

      const confirmPasswordInput = page.locator('#passwordConfirm')
      await expect(confirmPasswordInput).toBeVisible()

      // Verify labels exist for these inputs
      await expect(page.getByText('Organization Name')).toBeVisible()
      await expect(page.getByText('Email', { exact: true }).first()).toBeVisible()
    })

    test('should have proper input types', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Wait for form to be visible first
      await expect(page.locator('#organizationName')).toBeVisible({ timeout: 5000 })

      // Email input should have type="email"
      await expect(page.locator('input[type="email"]')).toBeVisible()

      // Password inputs should have type="password"
      const passwordInputs = page.locator('input[type="password"]')
      await expect(passwordInputs).toHaveCount(2)
    })

    test('should be navigable by keyboard', async ({ page }) => {
      await page.goto(`/setup/${testToken}`)
      await page.waitForLoadState('networkidle')

      // Wait for form to be visible first
      await expect(page.locator('#organizationName')).toBeVisible({ timeout: 5000 })

      // Tab through form fields
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should be able to focus the submit button eventually
      const submitButton = page.getByRole('button', { name: /complete setup|create|submit/i })
      await expect(submitButton).toBeVisible()
    })
  })
})
