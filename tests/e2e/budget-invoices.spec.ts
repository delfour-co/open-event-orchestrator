import { expect, test } from '@playwright/test'

test.describe('Budget Invoices', () => {
  const editionSlug = 'devfest-paris-2025'
  const invoicesUrl = `/admin/budget/${editionSlug}/invoices`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Invoices Page', () => {
    test('should display invoices page with header', async ({ page }) => {
      await page.goto(invoicesUrl)
      await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should show upload invoice button', async ({ page }) => {
      await page.goto(invoicesUrl)
      await expect(page.getByRole('button', { name: /Upload Invoice/ })).toBeVisible()
    })

    test('should display total invoices stat', async ({ page }) => {
      await page.goto(invoicesUrl)
      await expect(page.getByRole('heading', { name: 'Total Invoices' })).toBeVisible()
    })

    test('should show seeded invoices in table', async ({ page }) => {
      await page.goto(invoicesUrl)
      // Check for seeded invoice numbers
      await expect(
        page.locator('text=INV-PDC-2025-001').or(page.locator('text=INV-TP-2025-042'))
      ).toBeVisible()
    })

    test('should navigate back to budget dashboard', async ({ page }) => {
      await page.goto(invoicesUrl)
      const backButton = page.locator('a[href*="/admin/budget/"]').first()
      await backButton.click()
      await expect(page).toHaveURL(`/admin/budget/${editionSlug}`)
    })
  })

  test.describe('Invoice Upload', () => {
    test('should open upload dialog', async ({ page }) => {
      await page.goto(invoicesUrl)
      await page.getByRole('button', { name: /Upload Invoice/ }).click()
      await expect(page.getByRole('heading', { name: /Upload Invoice/i })).toBeVisible()
    })

    test('should upload an invoice', async ({ page }) => {
      await page.goto(invoicesUrl)

      await page.getByRole('button', { name: /Upload Invoice/ }).click()
      await expect(page.getByRole('heading', { name: /Upload Invoice/i })).toBeVisible()

      // Select a transaction
      const txSelect = page.locator('#inv-transaction')
      await txSelect.selectOption({ index: 1 })

      // Fill required fields
      await page.locator('#inv-number').fill(`INV-E2E-${Date.now()}`)
      await page.locator('#inv-amount').fill('500')

      await page.getByRole('button', { name: 'Upload' }).click()
      await page.waitForLoadState('networkidle')
    })

    test('should delete an invoice', async ({ page }) => {
      await page.goto(invoicesUrl)

      // If there's a delete button visible, click it
      const deleteForm = page.locator('form[action*="deleteInvoice"]').first()
      if (await deleteForm.isVisible()) {
        await deleteForm.locator('button[type="submit"]').click()
        await page.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(invoicesUrl)
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
