import { expect, test } from '@playwright/test'

test.describe('Sponsor Portal', () => {
  const editionSlug = 'devfest-paris-2025'

  // Helper to get a valid portal token from admin
  async function getPortalToken(page: import('@playwright/test').Page): Promise<string> {
    // Login as admin
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    // Go to sponsoring dashboard
    await page.goto(`/admin/sponsoring/${editionSlug}`)

    // Click on a sponsor to open detail
    await page.getByText('TechCorp').click()
    await page.waitForTimeout(500)

    // Generate portal link
    await page.getByRole('button', { name: /Generate Portal Link/ }).click()
    await page.waitForLoadState('networkidle')

    // Get the token from the input
    const input = page.locator('input[readonly]')
    const url = await input.inputValue()
    const token = url.split('token=')[1]

    return token
  }

  // ==========================================================================
  // Portal Access
  // ==========================================================================
  test.describe('Portal Access', () => {
    test('should deny access without token', async ({ page }) => {
      const response = await page.goto(`/sponsor/${editionSlug}/portal`)

      // Should return error status
      expect(response?.status()).toBe(400)
    })

    test('should deny access with invalid token', async ({ page }) => {
      const response = await page.goto(`/sponsor/${editionSlug}/portal?token=invalid-token-12345`)

      // Should return forbidden status
      expect(response?.status()).toBe(403)
    })

    test('should allow access with valid token', async ({ page }) => {
      const token = await getPortalToken(page)

      // Clear auth and access portal with token
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      // Should show portal page
      await expect(page.getByRole('heading', { name: /Sponsor Portal/i })).toBeVisible()
    })
  })

  // ==========================================================================
  // Portal Display
  // ==========================================================================
  test.describe('Portal Display', () => {
    test('should show sponsor information', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      // Company profile section
      await expect(page.getByRole('heading', { name: /Company Profile/i })).toBeVisible()
    })

    test('should show sponsorship status', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      // Status should be visible
      await expect(
        page.getByText(/confirmed|prospect|contacted|negotiating/i).first()
      ).toBeVisible()
    })

    test('should show package information if assigned', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      // Package section
      await expect(page.getByRole('heading', { name: /Your Package/i })).toBeVisible()
    })

    test('should show benefits list', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      // Benefits section
      await expect(page.getByRole('heading', { name: /Your Benefits/i })).toBeVisible()
    })
  })

  // ==========================================================================
  // Profile Update
  // ==========================================================================
  test.describe('Profile Update', () => {
    test('should update company profile', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      // Update a field
      const descriptionField = page.locator('#description')
      await descriptionField.clear()
      await descriptionField.fill('Updated via E2E test')

      await page.getByRole('button', { name: /Save Changes/i }).click()
      await page.waitForLoadState('networkidle')

      // Success message
      await expect(page.getByText(/updated successfully/i)).toBeVisible()
    })

    test('should update contact information', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      // Update contact fields
      const contactNameField = page.locator('#contactName')
      await contactNameField.clear()
      await contactNameField.fill('E2E Test Contact')

      await page.getByRole('button', { name: /Save Changes/i }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(/updated successfully/i)).toBeVisible()
    })
  })

  // ==========================================================================
  // Logo Upload
  // ==========================================================================
  test.describe('Logo Upload', () => {
    test('should show logo upload section', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      await expect(page.getByRole('heading', { name: /Company Logo/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Upload.*Logo/i })).toBeVisible()
    })

    // Note: Actual file upload testing requires more setup
    // This test verifies the UI elements are present
  })

  // ==========================================================================
  // Help Section
  // ==========================================================================
  test.describe('Help Section', () => {
    test('should show help and support section', async ({ page }) => {
      const token = await getPortalToken(page)
      await page.context().clearCookies()
      await page.goto(`/sponsor/${editionSlug}/portal?token=${token}`)

      await expect(page.getByRole('heading', { name: /Need Help/i })).toBeVisible()
    })
  })
})
