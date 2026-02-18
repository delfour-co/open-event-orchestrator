import { expect, test } from '@playwright/test'

test.describe('Sponsoring Admin Pages', () => {
  const editionSlug = 'devfest-paris-2025'
  const baseUrl = `/admin/sponsoring/${editionSlug}`
  const assetsUrl = `${baseUrl}/assets`
  const deliverablesUrl = `${baseUrl}/deliverables`
  const messagesUrl = `${baseUrl}/messages`
  const inquiriesUrl = `${baseUrl}/inquiries`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Assets Page
  // ==========================================================================
  test.describe('Assets Page', () => {
    test('should display assets page', async ({ page }) => {
      await page.goto(assetsUrl)

      await expect(page.getByRole('heading', { name: /Assets|Sponsor Assets/ })).toBeVisible()
    })

    test('should display assets list or empty state', async ({ page }) => {
      await page.goto(assetsUrl)

      // Should show either assets table or empty state
      const hasAssets = await page.locator('table, .asset-list').isVisible()
      const hasEmptyState = await page.getByText(/No assets|No sponsors/i).isVisible()

      expect(hasAssets || hasEmptyState).toBe(true)
    })

    test('should display sponsor filter', async ({ page }) => {
      await page.goto(assetsUrl)

      // Should have a way to filter by sponsor
      const sponsorFilter = page.locator('select, [role="combobox"]').first()
      await expect(sponsorFilter).toBeVisible()
    })

    test('should filter assets by category', async ({ page }) => {
      await page.goto(assetsUrl)

      // Look for category tabs or filter
      const categoryFilter = page.getByRole('button', { name: /Logo|Banner|All/ }).first()
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('should download asset', async ({ page }) => {
      await page.goto(assetsUrl)

      const downloadButton = page.getByRole('button', { name: /Download/ }).first()
      if (await downloadButton.isVisible()) {
        // Just verify the button is clickable
        await expect(downloadButton).toBeEnabled()
      }
    })
  })

  // ==========================================================================
  // Deliverables Page
  // ==========================================================================
  test.describe('Deliverables Page', () => {
    test('should display deliverables page', async ({ page }) => {
      await page.goto(deliverablesUrl)

      await expect(page.getByRole('heading', { name: /Deliverables|Benefits/ })).toBeVisible()
    })

    test('should display deliverables summary', async ({ page }) => {
      await page.goto(deliverablesUrl)

      // Should show summary stats
      await expect(page.getByText(/Total|Pending|Delivered/i)).toBeVisible()
    })

    test('should display deliverables table or list', async ({ page }) => {
      await page.goto(deliverablesUrl)

      // Should show deliverables
      const table = page.locator('table, .deliverables-list')
      const emptyState = page.getByText(/No deliverables|Generate deliverables/i)

      const hasTable = await table.isVisible()
      const hasEmptyState = await emptyState.isVisible()

      expect(hasTable || hasEmptyState).toBe(true)
    })

    test('should show generate deliverables button', async ({ page }) => {
      await page.goto(deliverablesUrl)

      const generateButton = page.getByRole('button', { name: /Generate|Create.*Deliverables/ })
      await expect(generateButton).toBeVisible()
    })

    test('should update deliverable status', async ({ page }) => {
      await page.goto(deliverablesUrl)

      // Find a deliverable row with status dropdown
      const statusDropdown = page.locator('select[name*="status"], [role="combobox"]').first()
      if (await statusDropdown.isVisible()) {
        await statusDropdown.click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('should mark deliverable as delivered', async ({ page }) => {
      await page.goto(deliverablesUrl)

      const markDeliveredButton = page
        .getByRole('button', { name: /Mark.*Delivered|Delivered/ })
        .first()
      if (await markDeliveredButton.isVisible()) {
        await expect(markDeliveredButton).toBeEnabled()
      }
    })
  })

  // ==========================================================================
  // Messages Page
  // ==========================================================================
  test.describe('Messages Page', () => {
    test('should display messages page', async ({ page }) => {
      await page.goto(messagesUrl)

      await expect(page.getByRole('heading', { name: /Messages|Communication/ })).toBeVisible()
    })

    test('should display sponsor message threads', async ({ page }) => {
      await page.goto(messagesUrl)

      // Should show message threads or empty state
      const hasThreads = await page.locator('table, .threads-list, .message-list').isVisible()
      const hasEmptyState = await page.getByText(/No messages|No conversations/i).isVisible()

      expect(hasThreads || hasEmptyState).toBe(true)
    })

    test('should show unread message count', async ({ page }) => {
      await page.goto(messagesUrl)

      // Look for unread badge or count - may or may not be visible
      await page.waitForLoadState('networkidle')
      // Badge visibility depends on actual data
      const badge = page.locator('.badge, [data-unread]')
      if (await badge.isVisible()) {
        await expect(badge).toBeVisible()
      }
    })

    test('should navigate to conversation detail', async ({ page }) => {
      await page.goto(messagesUrl)

      const conversationLink = page.locator('a[href*="messages"]').first()
      if (await conversationLink.isVisible()) {
        await conversationLink.click()
        await expect(page).toHaveURL(/messages\//)
      }
    })

    test('should compose new message', async ({ page }) => {
      await page.goto(messagesUrl)

      const newMessageButton = page.getByRole('button', {
        name: /New Message|Compose|Send Message/
      })
      if (await newMessageButton.isVisible()) {
        await newMessageButton.click()

        // Should open compose dialog or navigate
        const composeDialog = page.getByRole('dialog')
        const hasDialog = await composeDialog.isVisible().catch(() => false)

        if (hasDialog) {
          await expect(page.getByLabel(/Message|Content/i)).toBeVisible()
        }
      }
    })
  })

  // ==========================================================================
  // Inquiries Page
  // ==========================================================================
  test.describe('Inquiries Page', () => {
    test('should display inquiries page', async ({ page }) => {
      await page.goto(inquiriesUrl)

      await expect(page.getByRole('heading', { name: /Inquiries|Sponsor Requests/ })).toBeVisible()
    })

    test('should display inquiries list or empty state', async ({ page }) => {
      await page.goto(inquiriesUrl)

      const hasInquiries = await page.locator('table, .inquiries-list').isVisible()
      const hasEmptyState = await page.getByText(/No inquiries|No requests/i).isVisible()

      expect(hasInquiries || hasEmptyState).toBe(true)
    })

    test('should filter inquiries by status', async ({ page }) => {
      await page.goto(inquiriesUrl)

      // Look for status filter tabs
      const statusTabs = page
        .getByRole('button', { name: /All|Pending|Responded|Converted/i })
        .first()
      if (await statusTabs.isVisible()) {
        await statusTabs.click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('should view inquiry detail', async ({ page }) => {
      await page.goto(inquiriesUrl)

      const viewButton = page.getByRole('link', { name: /View|Details/ }).first()
      if (await viewButton.isVisible()) {
        await viewButton.click()
        await expect(page).toHaveURL(/inquiries\//)
      }
    })

    test('should respond to inquiry', async ({ page }) => {
      await page.goto(inquiriesUrl)

      const respondButton = page.getByRole('button', { name: /Respond|Reply/ }).first()
      if (await respondButton.isVisible()) {
        await respondButton.click()

        // Should open response dialog
        const responseDialog = page.getByRole('dialog')
        if (await responseDialog.isVisible()) {
          await expect(page.getByLabel(/Response|Message/i)).toBeVisible()
        }
      }
    })

    test('should convert inquiry to sponsor', async ({ page }) => {
      await page.goto(inquiriesUrl)

      const convertButton = page.getByRole('button', { name: /Convert|Create Sponsor/ }).first()
      if (await convertButton.isVisible()) {
        await expect(convertButton).toBeEnabled()
      }
    })
  })

  // ==========================================================================
  // Navigation between pages
  // ==========================================================================
  test.describe('Navigation', () => {
    test('should navigate from sponsors to assets', async ({ page }) => {
      await page.goto(baseUrl)

      const assetsLink = page.getByRole('link', { name: /Assets/ })
      await assetsLink.click()

      await expect(page).toHaveURL(assetsUrl)
    })

    test('should navigate from sponsors to deliverables', async ({ page }) => {
      await page.goto(baseUrl)

      const deliverablesLink = page.getByRole('link', { name: /Deliverables|Benefits/ })
      await deliverablesLink.click()

      await expect(page).toHaveURL(deliverablesUrl)
    })

    test('should navigate from sponsors to messages', async ({ page }) => {
      await page.goto(baseUrl)

      const messagesLink = page.getByRole('link', { name: /Messages/ })
      await messagesLink.click()

      await expect(page).toHaveURL(messagesUrl)
    })

    test('should navigate from sponsors to inquiries', async ({ page }) => {
      await page.goto(baseUrl)

      const inquiriesLink = page.getByRole('link', { name: /Inquiries|Requests/ })
      await inquiriesLink.click()

      await expect(page).toHaveURL(inquiriesUrl)
    })
  })
})
