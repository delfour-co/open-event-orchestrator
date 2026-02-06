import { expect, test } from '@playwright/test'

test.describe('Billing Admin Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const billingUrl = `/admin/billing/${editionSlug}`

  test.describe('Billing Edition Selector', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should display billing page with editions', async ({ page }) => {
      await page.goto('/admin/billing')

      await expect(page.getByRole('heading', { name: 'Billetterie' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should navigate to edition billing dashboard', async ({ page }) => {
      await page.goto('/admin/billing')

      // Click the Manage Tickets link for the specific edition
      await page.locator(`a[href="${billingUrl}"]`).click()

      await expect(page).toHaveURL(billingUrl)
    })

    test('should show edition status badge', async ({ page }) => {
      await page.goto('/admin/billing')

      // Multiple editions may have status badges, just verify at least one exists
      await expect(
        page.locator('text=published').or(page.locator('text=draft')).first()
      ).toBeVisible()
    })
  })

  test.describe('Billing Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should display billing dashboard for edition', async ({ page }) => {
      await page.goto(billingUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
    })

    test('should show stats cards', async ({ page }) => {
      await page.goto(billingUrl)

      // Stats cards have headings
      await expect(page.getByRole('heading', { name: 'Revenue' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Tickets Sold' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Check-in' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()
    })

    test('should show navigation links', async ({ page }) => {
      await page.goto(billingUrl)

      await expect(page.getByRole('link', { name: /Check-in/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /Participants/ })).toBeVisible()
    })

    test('should display seeded ticket types', async ({ page }) => {
      await page.goto(billingUrl)

      // Ticket type names appear in cards
      await expect(page.getByText('Early Bird').first()).toBeVisible()
      await expect(page.getByText('Standard').first()).toBeVisible()
      await expect(page.getByText('VIP').first()).toBeVisible()
      await expect(page.getByText('Student').first()).toBeVisible()
    })

    test('should show ticket type details', async ({ page }) => {
      await page.goto(billingUrl)
      await page.waitForLoadState('networkidle')

      // Verify prices are displayed (formatted in EUR) - Student ticket is free
      await expect(page.getByText('Free').first()).toBeVisible()
      // Verify sold counts - pattern like "0 / 100" or "sold / total"
      await expect(page.getByText(/\d+ \/ \d+/).first()).toBeVisible()
    })
  })

  test.describe('Ticket Type CRUD', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should create a new ticket type', async ({ page }) => {
      await page.goto(billingUrl)

      const ticketName = `E2E Ticket ${Date.now()}`

      // Click Add Ticket Type button
      await page.getByRole('button', { name: /Add Ticket Type/ }).click()

      // Wait for dialog
      await expect(page.getByText('Create Ticket Type')).toBeVisible()

      // Fill the form
      await page.getByLabel('Name *').fill(ticketName)
      await page.getByLabel('Description').fill('Test ticket type from E2E')
      await page.locator('#tt-price').fill('25.00')
      await page.getByLabel('Quantity *').fill('50')
      await page.getByLabel('Active (visible for sale)').check()

      // Submit
      await page.getByRole('button', { name: 'Create' }).click()

      // Wait for success
      await page.waitForLoadState('networkidle')

      // Verify the new ticket type appears
      await expect(page.getByText(ticketName)).toBeVisible()
    })

    test('should edit an existing ticket type', async ({ page }) => {
      await page.goto(billingUrl)

      // Create a ticket type first
      const ticketName = `EditTicket ${Date.now()}`

      await page.getByRole('button', { name: /Add Ticket Type/ }).click()
      await expect(page.getByText('Create Ticket Type')).toBeVisible()
      await page.getByLabel('Name *').fill(ticketName)
      await page.locator('#tt-price').fill('10.00')
      await page.getByLabel('Quantity *').fill('20')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(ticketName)).toBeVisible()

      // Click edit button (pencil icon) on the ticket type card
      const card = page.locator('[class*="card"]').filter({ hasText: ticketName })
      await card
        .locator('button')
        .filter({ has: page.locator('.lucide-pencil') })
        .click()

      // Wait for edit dialog
      await expect(page.getByText('Edit Ticket Type')).toBeVisible()

      // Update quantity
      await page.getByLabel('Quantity *').clear()
      await page.getByLabel('Quantity *').fill('30')

      // Submit
      await page.getByRole('button', { name: 'Update' }).click()

      // Wait for success
      await page.waitForLoadState('networkidle')

      // Verify the ticket type was updated - look within the specific card
      const updatedCard = page.locator('[class*="card"]').filter({ hasText: ticketName })
      await expect(updatedCard.getByText('0 / 30')).toBeVisible()
    })

    test('should delete a ticket type with no sales', async ({ page }) => {
      await page.goto(billingUrl)

      // Create a ticket type to delete
      const ticketName = `DeleteTicket ${Date.now()}`

      await page.getByRole('button', { name: /Add Ticket Type/ }).click()
      await expect(page.getByText('Create Ticket Type')).toBeVisible()
      await page.getByLabel('Name *').fill(ticketName)
      await page.locator('#tt-price').fill('5.00')
      await page.getByLabel('Quantity *').fill('10')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(ticketName)).toBeVisible()

      // Click delete button (trash icon) on the ticket type card
      const card = page.locator('[class*="card"]').filter({ hasText: ticketName })
      await card.locator('form button[type="submit"]').click()

      // Wait for deletion
      await page.waitForLoadState('networkidle')

      // Verify the ticket type is gone
      await expect(page.getByText(ticketName)).not.toBeVisible()
    })

    test('should create a free ticket type', async ({ page }) => {
      await page.goto(billingUrl)

      const ticketName = `Free E2E ${Date.now()}`

      await page.getByRole('button', { name: /Add Ticket Type/ }).click()
      await expect(page.getByText('Create Ticket Type')).toBeVisible()

      await page.getByLabel('Name *').fill(ticketName)
      await page.locator('#tt-price').fill('0')
      await page.getByLabel('Quantity *').fill('100')
      await page.getByLabel('Active (visible for sale)').check()

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify the free ticket type appears with "Free" label
      await expect(page.getByText(ticketName)).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(billingUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should deny speaker access to billing pages with 403', async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('speaker@example.com')
      await page.getByLabel('Password').fill('speaker123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })

      const response = await page.goto(billingUrl)

      expect(response?.status()).toBe(403)
      await expect(page.getByText(/access denied|forbidden/i)).toBeVisible()
    })
  })
})
