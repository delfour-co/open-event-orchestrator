import { expect, test } from '@playwright/test'

test.describe('Billing Check-in Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const checkinUrl = `/admin/billing/${editionSlug}/checkin`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Check-in Page Layout', () => {
    test('should display check-in page with stats', async ({ page }) => {
      await page.goto(checkinUrl)

      await expect(page.getByRole('heading', { name: 'Check-in' })).toBeVisible()
      await expect(page.getByText('Checked in')).toBeVisible()
      await expect(page.getByText('Progress')).toBeVisible()
    })

    test('should display edition name', async ({ page }) => {
      await page.goto(checkinUrl)

      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should show mode toggle buttons', async ({ page }) => {
      await page.goto(checkinUrl)

      await expect(page.getByRole('button', { name: /Manual Entry/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Scan QR/ })).toBeVisible()
    })

    test('should show manual entry form by default', async ({ page }) => {
      await page.goto(checkinUrl)

      await expect(page.getByPlaceholder('Enter ticket number or scan QR...')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Check In' })).toBeVisible()
    })

    test('should have back link to billing dashboard', async ({ page }) => {
      await page.goto(checkinUrl)

      const backLink = page.locator(`a[href="/admin/billing/${editionSlug}"]`)
      await expect(backLink).toBeVisible()
    })
  })

  test.describe('Manual Check-in', () => {
    test('should disable check-in button when input is empty', async ({ page }) => {
      await page.goto(checkinUrl)

      const button = page.getByRole('button', { name: 'Check In' })
      await expect(button).toBeDisabled()
    })

    test('should enable check-in button when input has text', async ({ page }) => {
      await page.goto(checkinUrl)

      await page.getByPlaceholder('Enter ticket number or scan QR...').fill('TKT-TEST')
      const button = page.getByRole('button', { name: 'Check In' })
      await expect(button).toBeEnabled()
    })

    test('should show error for invalid ticket number', async ({ page }) => {
      await page.goto(checkinUrl)

      await page.getByPlaceholder('Enter ticket number or scan QR...').fill('INVALID-TICKET-999')
      await page.getByRole('button', { name: 'Check In' }).click()

      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Check-in Failed')).toBeVisible()
      await expect(page.getByText('Ticket not found')).toBeVisible()
    })

    test('should show check-in stats with progress bar', async ({ page }) => {
      await page.goto(checkinUrl)

      // The progress bar should be visible
      const progressBar = page.locator('.rounded-full.bg-green-500')
      await expect(progressBar).toBeVisible()
    })
  })

  test.describe('Scanner Mode', () => {
    test('should toggle to scanner mode', async ({ page }) => {
      await page.goto(checkinUrl)

      await page.getByRole('button', { name: /Scan QR/ }).click()

      await expect(page.getByText('Point camera at the QR code on the ticket')).toBeVisible()
    })

    test('should toggle back to manual mode', async ({ page }) => {
      await page.goto(checkinUrl)

      await page.getByRole('button', { name: /Scan QR/ }).click()
      await page.getByRole('button', { name: /Manual Entry/ }).click()

      await expect(page.getByPlaceholder('Enter ticket number or scan QR...')).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(checkinUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
