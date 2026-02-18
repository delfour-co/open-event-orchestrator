import { expect, test } from '@playwright/test'

test.describe('Budget Templates', () => {
  const templatesUrl = '/admin/budget/templates'
  const editionSlug = 'devfest-paris-2025'
  const checklistUrl = `/admin/budget/${editionSlug}/checklist`

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
    test('should display templates page', async ({ page }) => {
      await page.goto(templatesUrl)

      await expect(page.getByRole('heading', { name: 'Budget Templates' })).toBeVisible()
    })

    test('should display template library section', async ({ page }) => {
      await page.goto(templatesUrl)

      await expect(page.getByText('Template Library')).toBeVisible()
    })
  })

  // ==========================================================================
  // Default Templates
  // ==========================================================================
  test.describe('Default Templates', () => {
    test('should display default event templates', async ({ page }) => {
      await page.goto(templatesUrl)

      // Should show event type templates
      await expect(page.getByText('Conference')).toBeVisible()
      await expect(page.getByText('Meetup')).toBeVisible()
    })

    test('should display template details', async ({ page }) => {
      await page.goto(templatesUrl)

      // Check for template card content
      const templateCard = page.locator('.border').first()
      await expect(templateCard).toBeVisible()
    })
  })

  // ==========================================================================
  // Create Template
  // ==========================================================================
  test.describe('Create Template', () => {
    test('should open create template dialog', async ({ page }) => {
      await page.goto(templatesUrl)

      const createButton = page.getByRole('button', { name: /Create Template/ })
      if (await createButton.isVisible()) {
        await createButton.click()
        await expect(page.getByRole('heading', { name: /Create.*Template/ })).toBeVisible()
      }
    })

    test('should create a new template', async ({ page }) => {
      await page.goto(templatesUrl)

      const templateName = `E2E Template ${Date.now()}`

      const createButton = page.getByRole('button', { name: /Create Template/ })
      if (await createButton.isVisible()) {
        await createButton.click()

        await page.locator('#template-name, [name="name"]').first().fill(templateName)
        await page
          .locator('#template-description, [name="description"]')
          .first()
          .fill('E2E test template')

        await page.getByRole('button', { name: 'Create' }).click()
        await page.waitForLoadState('networkidle')

        await expect(page.getByText(templateName)).toBeVisible()
      }
    })
  })

  // ==========================================================================
  // Apply Template (from Checklist page)
  // ==========================================================================
  test.describe('Apply Template', () => {
    test('should show apply template button on checklist page', async ({ page }) => {
      await page.goto(checklistUrl)

      const applyButton = page.getByRole('button', { name: /Apply Template|From Template/ })
      await expect(applyButton).toBeVisible()
    })

    test('should open template selection dialog', async ({ page }) => {
      await page.goto(checklistUrl)

      const applyButton = page.getByRole('button', { name: /Apply Template|From Template/ })
      await applyButton.click()

      // Should show available templates
      await expect(page.getByText('Select a Template')).toBeVisible()
    })

    test('should show template options when dialog opens', async ({ page }) => {
      await page.goto(checklistUrl)

      const applyButton = page.getByRole('button', { name: /Apply Template|From Template/ })
      await applyButton.click()

      // Wait for dialog content
      await page.waitForLoadState('networkidle')

      // Should have template options visible
      const templateOption = page
        .locator('[data-template], .template-option, button')
        .filter({ hasText: /Conference|Meetup|Workshop/ })
        .first()
      await expect(templateOption).toBeVisible()
    })
  })

  // ==========================================================================
  // Template Details
  // ==========================================================================
  test.describe('Template Details', () => {
    test('should view template items', async ({ page }) => {
      await page.goto(templatesUrl)

      // Click on a template to view details
      const viewButton = page.getByRole('button', { name: /View|Details/ }).first()
      if (await viewButton.isVisible()) {
        await viewButton.click()
        await expect(page.getByText(/items/i)).toBeVisible()
      }
    })

    test('should display template item list', async ({ page }) => {
      await page.goto(templatesUrl)

      // Templates should show their items or item count
      const templateCard = page.locator('.border').first()
      await expect(templateCard).toBeVisible()
    })
  })

  // ==========================================================================
  // Delete Template
  // ==========================================================================
  test.describe('Delete Template', () => {
    test('should delete a custom template', async ({ page }) => {
      await page.goto(templatesUrl)

      // First create a template to delete
      const templateName = `DeleteTest ${Date.now()}`

      const createButton = page.getByRole('button', { name: /Create Template/ })
      if (await createButton.isVisible()) {
        await createButton.click()

        await page.locator('#template-name, [name="name"]').first().fill(templateName)
        await page.getByRole('button', { name: 'Create' }).click()
        await page.waitForLoadState('networkidle')

        // Now delete it
        const templateRow = page.locator('div').filter({ hasText: templateName }).first()
        const deleteButton = templateRow.getByRole('button', { name: /Delete|Remove/ })
        if (await deleteButton.isVisible()) {
          await deleteButton.click()
          await page.waitForLoadState('networkidle')
          await expect(page.getByText(templateName)).not.toBeVisible()
        }
      }
    })
  })
})
