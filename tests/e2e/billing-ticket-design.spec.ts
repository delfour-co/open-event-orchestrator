import { expect, test } from '@playwright/test'

test.describe('Ticket Design Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const designUrl = `/admin/billing/${editionSlug}/design`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Design Page Layout', () => {
    test('should display ticket design page', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByRole('heading', { name: 'Ticket Design' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should have back link to billing dashboard', async ({ page }) => {
      await page.goto(designUrl)

      const backLink = page.locator(`a[href="/admin/billing/${editionSlug}"]`)
      await expect(backLink).toBeVisible()
    })

    test('should display preview section', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByText('Preview')).toBeVisible()
      await expect(
        page.getByText('This is how your tickets will appear in emails and PDFs')
      ).toBeVisible()
    })
  })

  test.describe('Color Settings', () => {
    test('should display color customization options', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByText('Colors')).toBeVisible()
      await expect(page.getByLabel('Primary Color')).toBeVisible()
      await expect(page.getByLabel('Background Color')).toBeVisible()
      await expect(page.getByLabel('Text Color')).toBeVisible()
      await expect(page.getByLabel('Accent Color')).toBeVisible()
    })

    test('should have color picker inputs', async ({ page }) => {
      await page.goto(designUrl)

      const colorPickers = page.locator('input[type="color"]')
      await expect(colorPickers).toHaveCount(4)
    })

    test('should update preview when colors change', async ({ page }) => {
      await page.goto(designUrl)

      const primaryColorInput = page.getByLabel('Primary Color')
      await primaryColorInput.fill('#FF5733')

      // Preview should reflect the new color
      const preview = page.locator('[class*="shadow-lg"]').first()
      await expect(preview).toBeVisible()
    })
  })

  test.describe('Display Options', () => {
    test('should display toggle options', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByText('Display Options')).toBeVisible()
      await expect(page.getByText('Show event date')).toBeVisible()
      await expect(page.getByText('Show venue')).toBeVisible()
      await expect(page.getByText('Show QR code')).toBeVisible()
    })

    test('should have checkboxes for display options', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByLabel('Show event date')).toBeVisible()
      await expect(page.getByLabel('Show venue')).toBeVisible()
      await expect(page.getByLabel('Show QR code')).toBeVisible()
    })

    test('should have custom footer text field', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByLabel('Custom Footer Text')).toBeVisible()
    })
  })

  test.describe('Logo Upload', () => {
    test('should display logo upload section', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByText('Event Logo')).toBeVisible()
      await expect(page.getByText('Upload a logo to display on your tickets')).toBeVisible()
    })

    test('should have file input for logo', async ({ page }) => {
      await page.goto(designUrl)

      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeVisible()
    })

    test('should have URL input for logo', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByLabel('Or use a URL')).toBeVisible()
    })
  })

  test.describe('Save and Reset', () => {
    test('should have save button', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByRole('button', { name: 'Save Design' })).toBeVisible()
    })

    test('should have reset to defaults button', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByRole('button', { name: 'Reset to Defaults' })).toBeVisible()
    })

    test('should save design successfully', async ({ page }) => {
      await page.goto(designUrl)

      // Update a color
      const primaryColorInput = page.getByLabel('Primary Color')
      await primaryColorInput.fill('#FF5733')

      // Save
      await page.getByRole('button', { name: 'Save Design' }).click()
      await page.waitForLoadState('networkidle')

      // Should show success message
      await expect(page.getByText('Ticket design saved successfully')).toBeVisible()
    })

    test('should reset to defaults', async ({ page }) => {
      await page.goto(designUrl)

      // Change colors first
      const primaryColorInput = page.getByLabel('Primary Color')
      await primaryColorInput.fill('#FF5733')

      // Click reset
      await page.getByRole('button', { name: 'Reset to Defaults' }).click()

      // Primary color should be reset
      await expect(primaryColorInput).toHaveValue('#3B82F6')
    })
  })

  test.describe('Tips Section', () => {
    test('should display helpful tips', async ({ page }) => {
      await page.goto(designUrl)

      await expect(page.getByText('Tips')).toBeVisible()
      await expect(page.getByText(/Colors:/)).toBeVisible()
      await expect(page.getByText(/Logo:/)).toBeVisible()
      await expect(page.getByText(/QR Code:/)).toBeVisible()
    })
  })

  test.describe('Navigation from Billing Page', () => {
    test('should navigate to design page from billing dashboard', async ({ page }) => {
      await page.goto(`/admin/billing/${editionSlug}`)

      const designLink = page.locator(`a[href="/admin/billing/${editionSlug}/design"]`)
      await expect(designLink).toBeVisible()
      await designLink.click()

      await expect(page).toHaveURL(designUrl)
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(designUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
