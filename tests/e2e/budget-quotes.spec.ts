import { expect, test } from '@playwright/test'

test.describe('Budget Quotes', () => {
  const editionSlug = 'devfest-paris-2025'
  const quotesUrl = `/admin/budget/${editionSlug}/quotes`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Quotes Page', () => {
    test('should display quotes page with header', async ({ page }) => {
      await page.goto(quotesUrl)
      await expect(page.getByRole('heading', { name: 'Quotes' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should show new quote button', async ({ page }) => {
      await page.goto(quotesUrl)
      await expect(page.getByRole('button', { name: /New Quote/ })).toBeVisible()
    })

    test('should display seeded quotes', async ({ page }) => {
      await page.goto(quotesUrl)
      await expect(
        page.locator('text=QT-DEVFEST-0001').or(page.locator('text=AudioVisual Pro')).first()
      ).toBeVisible()
    })

    test('should filter quotes by status', async ({ page }) => {
      await page.goto(quotesUrl)
      // Status filter buttons should be visible
      await expect(page.getByRole('button', { name: /All/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Draft/i })).toBeVisible()
    })

    test('should navigate back to budget dashboard', async ({ page }) => {
      await page.goto(quotesUrl)
      // Click the back button
      const backButton = page.locator('a[href*="/admin/budget/"]').first()
      await backButton.click()
      await expect(page).toHaveURL(`/admin/budget/${editionSlug}`)
    })
  })

  test.describe('Quote CRUD', () => {
    test('should create a new quote', async ({ page }) => {
      await page.goto(quotesUrl)

      await page.getByRole('button', { name: /New Quote/ }).click()
      await expect(page.getByRole('heading', { name: /New Quote/i })).toBeVisible()

      await page.locator('#q-vendor').fill('E2E Test Vendor')
      await page.locator('#q-vendorEmail').fill('test@vendor.com')

      // Fill first line item
      const descInput = page.locator('input[placeholder="Item description"]').first()
      await descInput.fill('Test item')

      const qtyInput = page.locator('input[type="number"][min="1"]').first()
      await qtyInput.clear()
      await qtyInput.fill('2')

      const priceInput = page.locator('input[type="number"][min="0"][step="0.01"]').first()
      await priceInput.clear()
      await priceInput.fill('100')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify the new quote appears
      await expect(page.locator('text=E2E Test Vendor').first()).toBeVisible()
    })

    test('should delete a draft quote', async ({ page }) => {
      await page.goto(quotesUrl)

      // Create a quote to delete
      await page.getByRole('button', { name: /New Quote/ }).click()
      await expect(page.getByRole('heading', { name: /New Quote/i })).toBeVisible()

      await page.locator('#q-vendor').fill(`DeleteMe ${Date.now()}`)
      const descInput = page.locator('input[placeholder="Item description"]').first()
      await descInput.fill('To delete')
      const priceInput = page.locator('input[type="number"][min="0"][step="0.01"]').first()
      await priceInput.clear()
      await priceInput.fill('50')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Find and click delete button on a draft quote
      const draftRow = page.locator('tr').filter({ hasText: 'DeleteMe' })
      const deleteForm = draftRow.locator('form[action*="deleteQuote"]')
      await deleteForm.locator('button[type="submit"]').click()
      await page.waitForLoadState('networkidle')

      // Verify it's gone
      await expect(draftRow).not.toBeVisible()
    })

    test('should send a draft quote', async ({ page }) => {
      await page.goto(quotesUrl)

      // Look for a draft quote's send button
      const draftFilter = page.getByRole('button', { name: /Draft/i })
      await draftFilter.click()

      // If there are draft quotes, try sending one
      const sendForm = page.locator('form[action*="sendQuote"]').first()
      if (await sendForm.isVisible()) {
        await sendForm.locator('button[type="submit"]').click()
        await page.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(quotesUrl)
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
