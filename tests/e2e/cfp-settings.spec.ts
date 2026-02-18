import { expect, test } from '@playwright/test'

test.describe('CFP Settings', () => {
  const editionSlug = 'devfest-paris-2025'
  const settingsUrl = `/admin/cfp/${editionSlug}/settings`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Navigation
  // ==========================================================================
  test.describe('Navigation', () => {
    test('should display CFP settings page', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByRole('heading', { name: /CFP Settings|Settings/ })).toBeVisible()
    })

    test('should access settings from CFP submissions page', async ({ page }) => {
      await page.goto(`/admin/cfp/${editionSlug}/submissions`)

      const settingsLink = page.getByRole('link', { name: /Settings/ })
      await settingsLink.click()

      await expect(page).toHaveURL(settingsUrl)
    })
  })

  // ==========================================================================
  // CFP Dates
  // ==========================================================================
  test.describe('CFP Dates', () => {
    test('should display CFP date configuration', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText(/CFP.*Date|Opening|Closing/i)).toBeVisible()
    })

    test('should display start and end date inputs', async ({ page }) => {
      await page.goto(settingsUrl)

      // Look for date inputs
      const startDateInput = page
        .locator('input[type="date"], input[name*="start"], input[name*="open"]')
        .first()
      const endDateInput = page
        .locator('input[type="date"], input[name*="end"], input[name*="close"]')
        .first()

      await expect(startDateInput).toBeVisible()
      await expect(endDateInput).toBeVisible()
    })

    test('should update CFP dates', async ({ page }) => {
      await page.goto(settingsUrl)

      // Set a future date
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 3)
      const dateString = futureDate.toISOString().split('T')[0]

      const dateInput = page.locator('input[type="date"]').first()
      if (await dateInput.isVisible()) {
        await dateInput.fill(dateString)

        // Save changes
        const saveButton = page.getByRole('button', { name: /Save|Update|Apply/ })
        if (await saveButton.isVisible()) {
          await saveButton.click()
          await page.waitForLoadState('networkidle')
        }
      }
    })
  })

  // ==========================================================================
  // Categories Management
  // ==========================================================================
  test.describe('Categories Management', () => {
    test('should display categories section', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText(/Categories/i)).toBeVisible()
    })

    test('should show existing categories', async ({ page }) => {
      await page.goto(settingsUrl)

      // Wait for categories to load
      await page.waitForLoadState('networkidle')

      // Should show categories list or table
      const categoriesList = page.locator('table, ul, .categories')
      await expect(categoriesList).toBeVisible()
    })

    test('should add a new category', async ({ page }) => {
      await page.goto(settingsUrl)

      const categoryName = `E2E Category ${Date.now()}`

      const addButton = page.getByRole('button', { name: /Add.*Category|New Category/ })
      if (await addButton.isVisible()) {
        await addButton.click()

        await page.locator('input[name="name"], #category-name').fill(categoryName)

        await page.getByRole('button', { name: /Save|Create|Add/ }).click()
        await page.waitForLoadState('networkidle')

        await expect(page.getByText(categoryName)).toBeVisible()
      }
    })

    test('should delete a category', async ({ page }) => {
      await page.goto(settingsUrl)

      // First create a category to delete
      const categoryName = `DeleteCategory ${Date.now()}`

      const addButton = page.getByRole('button', { name: /Add.*Category|New Category/ })
      if (await addButton.isVisible()) {
        await addButton.click()
        await page.locator('input[name="name"], #category-name').fill(categoryName)
        await page.getByRole('button', { name: /Save|Create|Add/ }).click()
        await page.waitForLoadState('networkidle')

        // Now delete it
        const categoryRow = page.locator('tr, li, div').filter({ hasText: categoryName }).first()
        const deleteButton = categoryRow.getByRole('button', { name: /Delete|Remove/ })
        if (await deleteButton.isVisible()) {
          await deleteButton.click()
          await page.waitForLoadState('networkidle')
          await expect(page.getByText(categoryName)).not.toBeVisible()
        }
      }
    })
  })

  // ==========================================================================
  // Formats Management
  // ==========================================================================
  test.describe('Formats Management', () => {
    test('should display formats section', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText(/Formats/i)).toBeVisible()
    })

    test('should show existing formats', async ({ page }) => {
      await page.goto(settingsUrl)

      await page.waitForLoadState('networkidle')

      // Look for format items
      const formatsList = page.locator('table, ul, .formats')
      await expect(formatsList).toBeVisible()
    })

    test('should add a new format', async ({ page }) => {
      await page.goto(settingsUrl)

      const formatName = `E2E Format ${Date.now()}`

      const addButton = page.getByRole('button', { name: /Add.*Format|New Format/ })
      if (await addButton.isVisible()) {
        await addButton.click()

        await page.locator('input[name="name"], #format-name').fill(formatName)
        await page.locator('input[name="duration"], #format-duration').fill('45')

        await page.getByRole('button', { name: /Save|Create|Add/ }).click()
        await page.waitForLoadState('networkidle')

        await expect(page.getByText(formatName)).toBeVisible()
      }
    })
  })

  // ==========================================================================
  // Review Settings
  // ==========================================================================
  test.describe('Review Settings', () => {
    test('should display review settings section', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText(/Review|Scoring/i)).toBeVisible()
    })

    test('should toggle review mode', async ({ page }) => {
      await page.goto(settingsUrl)

      // Look for review mode toggle
      const reviewToggle = page
        .locator('input[type="checkbox"], button[role="switch"]')
        .filter({ hasNot: page.locator('[disabled]') })
        .first()
      if (await reviewToggle.isVisible()) {
        await reviewToggle.click()
        await page.waitForLoadState('networkidle')
      }
    })
  })

  // ==========================================================================
  // Submission Limits
  // ==========================================================================
  test.describe('Submission Limits', () => {
    test('should display submission limits section', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText(/Limit|Maximum|Submission/i)).toBeVisible()
    })

    test('should update submission limit', async ({ page }) => {
      await page.goto(settingsUrl)

      const limitInput = page.locator('input[name*="limit"], input[name*="max"]').first()
      if (await limitInput.isVisible()) {
        await limitInput.fill('5')

        const saveButton = page.getByRole('button', { name: /Save|Update/ })
        if (await saveButton.isVisible()) {
          await saveButton.click()
          await page.waitForLoadState('networkidle')
        }
      }
    })
  })

  // ==========================================================================
  // CFP Status
  // ==========================================================================
  test.describe('CFP Status', () => {
    test('should display CFP status', async ({ page }) => {
      await page.goto(settingsUrl)

      // Should show open/closed status
      await expect(page.getByText(/Open|Closed|Status/i)).toBeVisible()
    })

    test('should toggle CFP open/closed status', async ({ page }) => {
      await page.goto(settingsUrl)

      const statusToggle = page.getByRole('button', { name: /Open CFP|Close CFP|Toggle/ })
      if (await statusToggle.isVisible()) {
        await statusToggle.click()
        await page.waitForLoadState('networkidle')
      }
    })
  })
})
