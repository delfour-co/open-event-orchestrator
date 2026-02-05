import { expect, test } from '@playwright/test'

test.describe('Billing Participants Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const participantsUrl = `/admin/billing/${editionSlug}/participants`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Participants Page Layout', () => {
    test('should display participants page with stats', async ({ page }) => {
      await page.goto(participantsUrl)

      await expect(page.getByRole('heading', { name: 'Participants' })).toBeVisible()
      await expect(page.getByText('Revenue')).toBeVisible()
      await expect(page.getByText('Orders')).toBeVisible()
      await expect(page.getByText('Tickets')).toBeVisible()
      await expect(page.getByText('Check-in Rate')).toBeVisible()
    })

    test('should display edition name', async ({ page }) => {
      await page.goto(participantsUrl)

      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should have back link to billing dashboard', async ({ page }) => {
      await page.goto(participantsUrl)

      const backLink = page.locator(`a[href="/admin/billing/${editionSlug}"]`)
      await expect(backLink).toBeVisible()
    })
  })

  test.describe('Tab Navigation', () => {
    test('should show Orders tab by default', async ({ page }) => {
      await page.goto(participantsUrl)

      await expect(page.getByRole('button', { name: /Orders/ })).toBeVisible()
      // Orders table should be visible with header columns
      await expect(page.getByText('Order').first()).toBeVisible()
      await expect(page.getByText('Customer').first()).toBeVisible()
    })

    test('should switch to Tickets tab', async ({ page }) => {
      await page.goto(participantsUrl)

      await page.getByRole('button', { name: /Tickets/ }).click()

      // Tickets table should show
      await expect(page.getByText('Ticket').first()).toBeVisible()
      await expect(page.getByText('Attendee').first()).toBeVisible()
      await expect(page.getByText('Type').first()).toBeVisible()
    })

    test('should switch to Participants tab', async ({ page }) => {
      await page.goto(participantsUrl)

      await page.getByRole('button', { name: /Participants/ }).click()

      // Participants table should show
      await expect(page.getByText('Name').first()).toBeVisible()
      await expect(page.getByText('Email').first()).toBeVisible()
    })
  })

  test.describe('Orders Table', () => {
    test('should display seeded orders', async ({ page }) => {
      await page.goto(participantsUrl)

      // Seeded orders should be visible with ORD- prefix
      await expect(page.locator('td').filter({ hasText: /ORD-/ }).first()).toBeVisible()
    })

    test('should show order status badges', async ({ page }) => {
      await page.goto(participantsUrl)

      // At least one paid status should be visible
      await expect(page.locator('span').filter({ hasText: 'paid' }).first()).toBeVisible()
    })

    test('should display order amounts', async ({ page }) => {
      await page.goto(participantsUrl)

      // Seeded orders have amounts formatted as currency
      await expect(page.getByText(/\d+,\d+\s*€/).first()).toBeVisible()
    })

    test('should show action buttons for paid orders', async ({ page }) => {
      await page.goto(participantsUrl)

      // Paid orders should have resend email and refund buttons
      const paidRow = page.locator('tr').filter({ hasText: 'paid' }).first()
      await expect(paidRow.locator('button[title="Resend confirmation email"]')).toBeVisible()
      await expect(paidRow.locator('button[title="Refund order"]')).toBeVisible()
    })
  })

  test.describe('Search', () => {
    test('should filter orders by search query', async ({ page }) => {
      await page.goto(participantsUrl)

      const searchInput = page.getByPlaceholder('Search...')
      await searchInput.fill('alice')

      // Should filter results
      await expect(page.getByText('Alice').first()).toBeVisible()
    })

    test('should show no results for unmatched search', async ({ page }) => {
      await page.goto(participantsUrl)

      const searchInput = page.getByPlaceholder('Search...')
      await searchInput.fill('nonexistentnameXYZ999')

      await expect(page.getByText('No orders found')).toBeVisible()
    })
  })

  test.describe('Tickets Tab', () => {
    test('should display seeded tickets', async ({ page }) => {
      await page.goto(participantsUrl)

      await page.getByRole('button', { name: /Tickets/ }).click()

      // Seeded tickets with TKT- prefix should be visible
      await expect(page.locator('td').filter({ hasText: /TKT-/ }).first()).toBeVisible()
    })

    test('should show ticket status badges', async ({ page }) => {
      await page.goto(participantsUrl)

      await page.getByRole('button', { name: /Tickets/ }).click()

      // Should show valid or used status
      await expect(
        page
          .locator('span')
          .filter({ hasText: /valid|used/ })
          .first()
      ).toBeVisible()
    })

    test('should show cancel button for valid tickets', async ({ page }) => {
      await page.goto(participantsUrl)

      await page.getByRole('button', { name: /Tickets/ }).click()

      // Valid tickets should have a cancel button
      const validRow = page.locator('tr').filter({ hasText: 'valid' }).first()
      if ((await validRow.count()) > 0) {
        await expect(validRow.getByRole('button', { name: /Cancel/ })).toBeVisible()
      }
    })
  })

  test.describe('Participants Tab', () => {
    test('should display unique participants', async ({ page }) => {
      await page.goto(participantsUrl)

      await page.getByRole('button', { name: /Participants/ }).click()

      // Should show participant names from seeded data
      await expect(page.locator('td.font-medium').first()).toBeVisible()
    })

    test('should show check-in status', async ({ page }) => {
      await page.goto(participantsUrl)

      await page.getByRole('button', { name: /Participants/ }).click()

      // Should show Yes/No for checked-in status
      await expect(page.getByText('Yes').or(page.getByText('No')).first()).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(participantsUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
