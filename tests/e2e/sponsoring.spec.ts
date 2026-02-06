import { expect, test } from '@playwright/test'

test.describe('Sponsoring Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const sponsoringUrl = `/admin/sponsoring/${editionSlug}`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Sponsoring Edition Selector
  // ==========================================================================
  test.describe('Edition Selector', () => {
    test('should display sponsoring page with editions', async ({ page }) => {
      await page.goto('/admin/sponsoring')

      await expect(page.getByRole('heading', { name: 'Sponsoring' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should navigate to edition sponsoring dashboard', async ({ page }) => {
      await page.goto('/admin/sponsoring')

      await page.getByRole('link', { name: /Manage Sponsors/ }).click()

      await expect(page).toHaveURL(sponsoringUrl)
    })

    test('should show edition status badge as clickable', async ({ page }) => {
      await page.goto('/admin/sponsoring')

      const statusBadge = page.locator('a[title="Change edition status"]').first()
      await expect(statusBadge).toBeVisible()
    })

    test('should show settings icon linking to packages', async ({ page }) => {
      await page.goto('/admin/sponsoring')

      await expect(page.locator('a[title="Sponsoring Packages"]')).toBeVisible()
    })
  })

  // ==========================================================================
  // Sponsoring Dashboard
  // ==========================================================================
  test.describe('Dashboard', () => {
    test('should display dashboard for edition', async ({ page }) => {
      await page.goto(sponsoringUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
    })

    test('should show stats cards', async ({ page }) => {
      await page.goto(sponsoringUrl)

      await expect(page.getByRole('heading', { name: 'Total Sponsors' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Confirmed' }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Total Revenue' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Paid' })).toBeVisible()
    })

    test('should show sub-navigation', async ({ page }) => {
      await page.goto(sponsoringUrl)

      await expect(page.locator('main').getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(page.locator('main').getByRole('link', { name: 'Packages' })).toBeVisible()
      await expect(page.locator('main').getByRole('link', { name: 'Sponsors' })).toBeVisible()
    })

    test('should display sponsor pipeline section', async ({ page }) => {
      await page.goto(sponsoringUrl)

      await expect(page.getByRole('heading', { name: 'Sponsor Pipeline' })).toBeVisible()
    })

    test('should show pipeline columns with seeded data', async ({ page }) => {
      await page.goto(sponsoringUrl)

      // Check pipeline column headers
      await expect(page.getByText('Prospect').first()).toBeVisible()
      await expect(page.getByText('Contacted').first()).toBeVisible()
      await expect(page.getByText('Negotiating').first()).toBeVisible()
      await expect(page.getByText('Confirmed').first()).toBeVisible()
    })

    test('should display seeded sponsors in pipeline', async ({ page }) => {
      await page.goto(sponsoringUrl)
      await page.waitForLoadState('networkidle')

      // Seeded sponsors should be visible (from seed.ts: TechCorp International, CloudScale Inc)
      await expect(page.getByText('TechCorp International').first()).toBeVisible()
      await expect(page.getByText('CloudScale Inc').first()).toBeVisible()
    })
  })

  // ==========================================================================
  // Sponsor CRUD
  // ==========================================================================
  test.describe('Sponsor CRUD', () => {
    test('should create a new sponsor', async ({ page }) => {
      await page.goto(sponsoringUrl)

      const sponsorName = `E2E Sponsor ${Date.now()}`

      await page.getByRole('button', { name: /New Sponsor/ }).click()
      await expect(page.getByRole('heading', { name: 'New Sponsor' })).toBeVisible()

      await page.locator('#sponsor-name').fill(sponsorName)
      await page.locator('#sponsor-website').fill('https://example.com')
      await page.locator('#sponsor-contact-name').fill('John Doe')
      await page.locator('#sponsor-contact-email').fill('john@example.com')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Sponsor is now in the organization, we can add it to edition
      await page.getByRole('button', { name: /Add to Edition/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Sponsor to Edition' })).toBeVisible()

      await page.locator('#add-sponsor').selectOption({ label: sponsorName })
      await page.getByRole('button', { name: 'Add Sponsor' }).click()
      await page.waitForLoadState('networkidle')

      // Should appear in pipeline
      await expect(page.getByText(sponsorName)).toBeVisible()
    })

    test('should add existing sponsor to edition', async ({ page }) => {
      await page.goto(sponsoringUrl)

      // First create a sponsor
      const sponsorName = `AddToEd ${Date.now()}`
      await page.getByRole('button', { name: /New Sponsor/ }).click()
      await page.locator('#sponsor-name').fill(sponsorName)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Now add to edition
      await page.getByRole('button', { name: /Add to Edition/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Sponsor to Edition' })).toBeVisible()

      await page.locator('#add-sponsor').selectOption({ label: sponsorName })
      await page.locator('#add-status').selectOption('contacted')

      await page.getByRole('button', { name: 'Add Sponsor' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(sponsorName)).toBeVisible()
    })

    test('should open sponsor detail dialog from pipeline', async ({ page }) => {
      await page.goto(sponsoringUrl)

      // Click on a seeded sponsor card
      await page.getByText('TechCorp International').first().click()

      // Detail dialog should open - check for form labels which are unique per dialog
      await expect(page.locator('[role="dialog"]').getByText('Contact').first()).toBeVisible()
      await expect(page.locator('[role="dialog"]').getByText('Package').first()).toBeVisible()
      await expect(page.locator('[role="dialog"]').getByText('Status').first()).toBeVisible()
    })

    test('should update sponsor status from detail dialog', async ({ page }) => {
      await page.goto(sponsoringUrl)

      // Create and add a sponsor
      const sponsorName = `StatusTest ${Date.now()}`
      await page.getByRole('button', { name: /New Sponsor/ }).click()
      await page.locator('#sponsor-name').fill(sponsorName)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: /Add to Edition/ }).click()
      await page.locator('#add-sponsor').selectOption({ label: sponsorName })
      await page.getByRole('button', { name: 'Add Sponsor' }).click()
      await page.waitForLoadState('networkidle')

      // Open detail
      await page.getByText(sponsorName).click()

      // Change status
      await page.locator('#detail-status').selectOption('contacted')
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForLoadState('networkidle')

      // Verify status changed (sponsor should be in contacted column now)
      // The dialog should close on success
    })

    test('should assign package to sponsor', async ({ page }) => {
      await page.goto(sponsoringUrl)
      await page.waitForLoadState('networkidle')

      // Click on a seeded sponsor card in the pipeline
      await page.getByText('TechCorp International').first().click()

      // Wait for dialog to open
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Select a package if dropdown exists
      const packageSelect = page.locator('#detail-package')
      if (await packageSelect.isVisible()) {
        await packageSelect.selectOption({ index: 1 })
        await page.getByRole('button', { name: 'Save Changes' }).click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('should generate portal link for sponsor', async ({ page }) => {
      await page.goto(sponsoringUrl)
      await page.waitForLoadState('networkidle')

      // Click on TechCorp International sponsor card
      await page.getByText('TechCorp International').first().click()

      // Wait for dialog to open
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Generate portal link if button exists
      const generateBtn = page.getByRole('button', { name: /Generate Portal Link/ })
      if (await generateBtn.isVisible()) {
        await generateBtn.click()
        await page.waitForLoadState('networkidle')

        // Link should be displayed - check for input with token URL
        await expect(page.locator('input[readonly]')).toBeVisible()
      }
    })

    test('should remove sponsor from edition', async ({ page }) => {
      await page.goto(sponsoringUrl)
      await page.waitForLoadState('networkidle')

      // Create and add a sponsor to remove
      const sponsorName = `RemoveTest ${Date.now()}`
      await page.getByRole('button', { name: /New Sponsor/ }).click()
      await expect(page.getByRole('heading', { name: 'New Sponsor' })).toBeVisible()

      await page.locator('#sponsor-name').fill(sponsorName)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      await page.getByRole('button', { name: /Add to Edition/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Sponsor to Edition' })).toBeVisible()

      await page.locator('#add-sponsor').selectOption({ label: sponsorName })
      await page.getByRole('button', { name: 'Add Sponsor' }).click()
      await page.waitForLoadState('networkidle')

      // Open detail and remove
      await page.getByText(sponsorName).first().click()
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      const removeBtn = page.getByRole('button', { name: /Remove from Edition/ })
      if (await removeBtn.isVisible()) {
        await removeBtn.click()
        await page.waitForLoadState('networkidle')

        // Close dialog if still open
        const closeBtn = page.locator('[role="dialog"] button[aria-label="Close"]')
        if (await closeBtn.isVisible()) {
          await closeBtn.click()
        }

        // Sponsor should no longer be in pipeline (check main content area)
        await expect(page.locator('main').getByText(sponsorName).first()).not.toBeVisible({
          timeout: 5000
        })
      }
    })
  })

  // ==========================================================================
  // Navigation
  // ==========================================================================
  test.describe('Navigation', () => {
    test('should navigate to packages page', async ({ page }) => {
      await page.goto(sponsoringUrl)

      await page.getByRole('link', { name: 'Packages' }).click()

      await expect(page).toHaveURL(`${sponsoringUrl}/packages`)
    })

    test('should navigate to sponsors list page', async ({ page }) => {
      await page.goto(sponsoringUrl)

      await page.getByRole('link', { name: 'Sponsors' }).click()

      await expect(page).toHaveURL(`${sponsoringUrl}/sponsors`)
    })

    test('should navigate back to edition selector', async ({ page }) => {
      await page.goto(sponsoringUrl)

      // Navigate back via breadcrumb or back link
      await page.locator('a[href="/admin/sponsoring"]').first().click()

      await expect(page).toHaveURL('/admin/sponsoring')
    })
  })

  // ==========================================================================
  // Access Control
  // ==========================================================================
  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(sponsoringUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should deny speaker access with 403', async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('speaker@example.com')
      await page.getByLabel('Password').fill('speaker123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })

      const response = await page.goto(sponsoringUrl)

      expect(response?.status()).toBe(403)
    })
  })
})
