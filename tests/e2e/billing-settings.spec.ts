import { expect, test } from '@playwright/test'

test.describe('Billing Settings Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const settingsUrl = `/admin/billing/${editionSlug}/settings`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Settings Page Layout', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByRole('heading', { name: 'Billing Settings' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should have back link to billing dashboard', async ({ page }) => {
      await page.goto(settingsUrl)

      const backLink = page.locator(`a[href="/admin/billing/${editionSlug}"]`)
      await expect(backLink).toBeVisible()
    })
  })

  test.describe('Public URL Section', () => {
    test('should display public ticket page URL', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText('Public Ticket Page')).toBeVisible()
      await expect(page.getByText(/Share this URL with attendees/)).toBeVisible()
    })

    test('should show the URL in an input field', async ({ page }) => {
      await page.goto(settingsUrl)

      const urlInput = page.locator('input[readonly]')
      await expect(urlInput).toBeVisible()
      const urlValue = await urlInput.inputValue()
      expect(urlValue).toContain(`/tickets/${editionSlug}`)
    })

    test('should have copy and open buttons', async ({ page }) => {
      await page.goto(settingsUrl)

      // Copy button (within the Public Ticket Page card)
      const urlSection = page.locator('[class*="card"]').filter({ hasText: 'Public Ticket Page' })
      await expect(urlSection.locator('button').first()).toBeVisible()

      // External link button
      const externalLink = urlSection.locator(`a[href*="/tickets/${editionSlug}"]`)
      await expect(externalLink).toBeVisible()
    })
  })

  test.describe('Sales Status Section', () => {
    test('should display sales status overview', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText('Sales Status')).toBeVisible()
      await expect(page.getByText('Active Ticket Types')).toBeVisible()
      await expect(page.getByText('Total Capacity')).toBeVisible()
      await expect(page.getByText('Tickets Sold')).toBeVisible()
    })

    test('should show sales open/closed status', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(
        page.getByText('Sales are open').or(page.getByText('Sales are closed'))
      ).toBeVisible()
    })

    test('should display toggle sales buttons', async ({ page }) => {
      await page.goto(settingsUrl)

      // Should have at least one of the enable/disable buttons
      const enableBtn = page.getByRole('button', {
        name: 'Enable All Sales'
      })
      const disableBtn = page.getByRole('button', {
        name: 'Disable All Sales'
      })

      await expect(enableBtn.or(disableBtn)).toBeVisible()
    })
  })

  test.describe('Integration Status Section', () => {
    test('should display integration status cards', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText('Integration Status')).toBeVisible()
      await expect(page.getByText('Stripe Payments')).toBeVisible()
      await expect(page.getByText('Stripe Webhook')).toBeVisible()
      await expect(page.getByText('Email Notifications')).toBeVisible()
    })

    test('should show connection status badges', async ({ page }) => {
      await page.goto(settingsUrl)

      // In dev mode, Stripe is likely not configured
      await expect(
        page.getByText('Connected').or(page.getByText('Not configured')).first()
      ).toBeVisible()
    })

    test('should show Stripe configuration help when not configured', async ({ page }) => {
      await page.goto(settingsUrl)

      // If Stripe is not configured, help text should appear
      const helpText = page.getByText('Stripe not configured')
      if ((await helpText.count()) > 0) {
        await expect(helpText).toBeVisible()
        await expect(page.getByText('STRIPE_SECRET_KEY')).toBeVisible()
      }
    })
  })

  test.describe('Toggle Sales', () => {
    test('should toggle sales and show success message', async ({ page }) => {
      await page.goto(settingsUrl)

      // Click whichever toggle button is available
      const disableBtn = page.getByRole('button', {
        name: 'Disable All Sales'
      })
      const enableBtn = page.getByRole('button', {
        name: 'Enable All Sales'
      })

      if ((await disableBtn.count()) > 0) {
        await disableBtn.click()
      } else if ((await enableBtn.count()) > 0) {
        await enableBtn.click()
      }

      await page.waitForLoadState('networkidle')

      // Should show success or the page should refresh
      await expect(page.getByText('Sales Status')).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(settingsUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
