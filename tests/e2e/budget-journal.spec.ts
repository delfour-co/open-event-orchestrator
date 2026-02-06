import { expect, test } from '@playwright/test'

test.describe('Budget Audit Journal', () => {
  const editionSlug = 'devfest-paris-2025'
  const journalUrl = `/admin/budget/${editionSlug}/journal`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Journal Page', () => {
    test('should display journal page with header', async ({ page }) => {
      await page.goto(journalUrl)
      await expect(page.getByRole('heading', { name: 'Audit Journal' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should display seeded audit log entries', async ({ page }) => {
      await page.goto(journalUrl)
      // Should have entries from seed
      await expect(page.locator('table tbody tr').first()).toBeVisible()
      // Check for action badges (at least one should exist)
      const actionBadges = page.locator('table tbody span.rounded-full')
      await expect(actionBadges.first()).toBeVisible()
    })

    test('should show export buttons', async ({ page }) => {
      await page.goto(journalUrl)
      await expect(page.getByRole('link', { name: /Export CSV/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /Export PDF/ })).toBeVisible()
    })

    test('should display filters section', async ({ page }) => {
      await page.goto(journalUrl)
      await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible()
      await expect(page.locator('#action')).toBeVisible()
      await expect(page.locator('#entityType')).toBeVisible()
      await expect(page.locator('#startDate')).toBeVisible()
      await expect(page.locator('#endDate')).toBeVisible()
      await expect(page.locator('#search')).toBeVisible()
    })

    test('should have navigation tabs', async ({ page }) => {
      await page.goto(journalUrl)
      // Check the budget sub-navigation tabs
      const nav = page.locator('nav.flex.gap-1')
      await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Quotes' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Invoices' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Reimbursements' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Journal' })).toBeVisible()
    })
  })

  test.describe('Filtering', () => {
    test('should filter by action type', async ({ page }) => {
      await page.goto(journalUrl)

      // Select "Create" action
      await page.locator('#action').selectOption('create')
      await page.getByRole('button', { name: 'Apply Filters' }).click()

      // URL should contain the filter
      await expect(page).toHaveURL(/action=create/)

      // All visible entries should have "Created" badge
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          await expect(
            rows.nth(i).locator('span.rounded-full', { hasText: 'Created' })
          ).toBeVisible()
        }
      }
    })

    test('should filter by entity type', async ({ page }) => {
      await page.goto(journalUrl)

      // Select "Transaction" entity type
      await page.locator('#entityType').selectOption('transaction')
      await page.getByRole('button', { name: 'Apply Filters' }).click()

      // URL should contain the filter
      await expect(page).toHaveURL(/entityType=transaction/)

      // All visible entries should be transactions
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          await expect(rows.nth(i).locator('td', { hasText: 'Transaction' })).toBeVisible()
        }
      }
    })

    test('should filter by reference search', async ({ page }) => {
      await page.goto(journalUrl)

      // Search for a reference
      await page.locator('#search').fill('QT-')
      await page.getByRole('button', { name: 'Apply Filters' }).click()

      // URL should contain the search
      await expect(page).toHaveURL(/search=QT-/)
    })

    test('should clear filters', async ({ page }) => {
      await page.goto(`${journalUrl}?action=create&entityType=transaction`)

      // Clear button should be visible when filters are active
      const clearButton = page.getByRole('button', { name: /Clear/ })
      await expect(clearButton).toBeVisible()

      await clearButton.click()

      // Should return to base URL (no query params)
      await page.waitForURL((url) => !url.search.includes('action='))
    })

    test('should combine multiple filters', async ({ page }) => {
      await page.goto(journalUrl)

      await page.locator('#action').selectOption('create')
      await page.locator('#entityType').selectOption('quote')
      await page.getByRole('button', { name: 'Apply Filters' }).click()

      await expect(page).toHaveURL(/action=create/)
      await expect(page).toHaveURL(/entityType=quote/)
    })
  })

  test.describe('Detail Dialog', () => {
    test('should open detail dialog when clicking eye icon', async ({ page }) => {
      await page.goto(journalUrl)

      // Click the first detail button (eye icon)
      const detailButton = page.locator('table tbody tr').first().getByRole('button')
      await detailButton.click()

      // Dialog should appear
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('heading', { name: 'Audit Log Details' })).toBeVisible()
      await expect(dialog.getByText('Date/Time')).toBeVisible()
    })

    test('should close detail dialog', async ({ page }) => {
      await page.goto(journalUrl)

      // Open dialog
      const detailButton = page.locator('table tbody tr').first().getByRole('button')
      await detailButton.click()

      const dialogHeading = page.getByRole('heading', { name: 'Audit Log Details' })
      await expect(dialogHeading).toBeVisible()

      // Close dialog - use keyboard escape or click outside
      await page.keyboard.press('Escape')
      await expect(dialogHeading).not.toBeVisible()
    })

    test('should display old and new values in detail', async ({ page }) => {
      await page.goto(journalUrl)

      // Find an entry with values (status change or update)
      await page.locator('#action').selectOption('status_change')
      await page.getByRole('button', { name: 'Apply Filters' }).click()

      const rows = page.locator('table tbody tr')
      if ((await rows.count()) > 0) {
        await rows.first().getByRole('button').click()
        const dialog = page.getByRole('dialog')
        // Should show at least one of old/new value sections
        const hasOldValue = await dialog
          .getByText('Old Value')
          .isVisible()
          .catch(() => false)
        const hasNewValue = await dialog
          .getByText('New Value')
          .isVisible()
          .catch(() => false)
        expect(hasOldValue || hasNewValue).toBe(true)
      }
    })
  })

  test.describe('Export', () => {
    test('should have working CSV export link', async ({ page }) => {
      await page.goto(journalUrl)

      const csvLink = page.getByRole('link', { name: /Export CSV/ })
      const href = await csvLink.getAttribute('href')
      expect(href).toContain('/journal/export')
      expect(href).toContain('format=csv')
    })

    test('should have working PDF export link', async ({ page }) => {
      await page.goto(journalUrl)

      const pdfLink = page.getByRole('link', { name: /Export PDF/ })
      const href = await pdfLink.getAttribute('href')
      expect(href).toContain('/journal/export')
      expect(href).toContain('format=pdf')
    })

    test('should include filters in export URL', async ({ page }) => {
      await page.goto(`${journalUrl}?action=create`)

      const csvLink = page.getByRole('link', { name: /Export CSV/ })
      const href = await csvLink.getAttribute('href')
      expect(href).toContain('action=create')
    })
  })

  test.describe('Table Display', () => {
    test('should display all required columns', async ({ page }) => {
      await page.goto(journalUrl)

      // Check column headers
      await expect(page.locator('th', { hasText: 'Date/Time' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'User' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Action' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Entity' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Reference' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Amount' })).toBeVisible()
      await expect(page.locator('th', { hasText: 'Details' })).toBeVisible()
    })

    test('should display action badges with colors', async ({ page }) => {
      await page.goto(journalUrl)

      // Check that action badges exist with appropriate styling
      const badges = page.locator('table tbody span.rounded-full')
      await expect(badges.first()).toBeVisible()
    })

    test('should format dates correctly', async ({ page }) => {
      await page.goto(journalUrl)

      // First row should have a formatted date
      const firstRow = page.locator('table tbody tr').first()
      const dateCell = firstRow.locator('td').first()
      const dateText = await dateCell.textContent()

      // Date should contain month name (e.g., "Feb", "Jan")
      expect(dateText).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to dashboard from journal', async ({ page }) => {
      await page.goto(journalUrl)

      // Use the sub-navigation tab, not the sidebar
      const nav = page.locator('nav.flex.gap-1')
      await nav.getByRole('link', { name: 'Dashboard' }).click()
      await expect(page).toHaveURL(`/admin/budget/${editionSlug}`)
    })

    test('should navigate back using back button', async ({ page }) => {
      await page.goto(journalUrl)

      // Click back button (arrow left)
      await page.locator(`a[href="/admin/budget/${editionSlug}"]`).first().click()
      await expect(page).toHaveURL(`/admin/budget/${editionSlug}`)
    })
  })

  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(journalUrl)
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state message when no results', async ({ page }) => {
      // Use a filter that won't match anything
      await page.goto(`${journalUrl}?search=NONEXISTENT_REFERENCE_12345`)

      await expect(page.getByText('No audit logs found')).toBeVisible()
      await expect(page.getByText('Try adjusting your filters')).toBeVisible()
    })
  })
})
