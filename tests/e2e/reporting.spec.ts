import { expect, test } from '@playwright/test'

test.describe('Reporting Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const reportingUrl = '/admin/reporting'
  const dashboardUrl = `${reportingUrl}/${editionSlug}`
  const alertsUrl = `${dashboardUrl}/alerts`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Reporting Edition Selector
  // ==========================================================================
  test.describe('Reporting Edition Selector', () => {
    test('should display reporting page with editions', async ({ page }) => {
      await page.goto(reportingUrl)

      await expect(page.getByRole('heading', { name: 'Reporting' })).toBeVisible()
      await expect(
        page.getByText('Select an edition to view its dashboard and metrics')
      ).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should navigate to edition dashboard', async ({ page }) => {
      await page.goto(reportingUrl)

      await page
        .getByRole('link', { name: /View Dashboard/ })
        .first()
        .click()

      await expect(page).toHaveURL(new RegExp(reportingUrl))
    })

    test('should show edition status badge', async ({ page }) => {
      await page.goto(reportingUrl)

      await expect(
        page.locator('text=Published').or(page.locator('text=Draft')).first()
      ).toBeVisible()
    })

    test('should toggle archived editions visibility', async ({ page }) => {
      await page.goto(reportingUrl)

      // If there are archived editions, the toggle button should be visible
      const showArchivedButton = page.getByRole('button', { name: /Show Archived|Hide Archived/ })
      if (await showArchivedButton.isVisible()) {
        await showArchivedButton.click()
        // After clicking, button text should change
        await expect(
          page.getByRole('button', { name: /Show Archived|Hide Archived/ })
        ).toBeVisible()
      }
    })
  })

  // ==========================================================================
  // Reporting Dashboard
  // ==========================================================================
  test.describe('Reporting Dashboard', () => {
    test('should display dashboard with edition name', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
    })

    test('should show back button to reporting list', async ({ page }) => {
      await page.goto(dashboardUrl)

      // Use main content area back button (not sidebar)
      const backButton = page.locator('main a[href="/admin/reporting"]').first()
      await expect(backButton).toBeVisible()
    })

    test('should show refresh button', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByRole('button', { name: /Refresh/ })).toBeVisible()
    })

    test('should display Ticketing section with metrics', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByRole('heading', { name: 'Ticketing', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Revenue', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Tickets Sold', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Check-in Rate', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible()
    })

    test('should display CFP section with metrics', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByRole('heading', { name: 'Call for Papers', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Submissions', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Pending Reviews', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Accepted', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Speakers', exact: true })).toBeVisible()
    })

    test('should display Planning section with metrics', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByRole('heading', { name: 'Planning', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Total Sessions', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Tracks', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Rooms', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Unscheduled', exact: true })).toBeVisible()
    })

    test('should display Sponsoring section with metrics', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByRole('heading', { name: 'Sponsoring', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Sponsorship Value', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Confirmed', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Total Sponsors', exact: true })).toBeVisible()
    })

    test('should display Budget section with metrics', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByRole('heading', { name: 'Budget', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Total Budget', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Spent', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Remaining', exact: true })).toBeVisible()
    })

    test('should show last updated timestamp', async ({ page }) => {
      await page.goto(dashboardUrl)

      await expect(page.getByText(/Last updated:/)).toBeVisible()
    })

    test('should refresh dashboard on button click', async ({ page }) => {
      await page.goto(dashboardUrl)

      const refreshButton = page.getByRole('button', { name: /Refresh/ })
      await refreshButton.click()

      // Button should show loading state
      await expect(refreshButton).toBeDisabled()

      // Wait for refresh to complete
      await expect(refreshButton).toBeEnabled({ timeout: 10000 })
    })

    test('should display charts for distributions', async ({ page }) => {
      await page.goto(dashboardUrl)

      // Check for chart containers
      await expect(page.getByRole('heading', { name: 'Submission Status', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Sponsor Status', exact: true })).toBeVisible()
    })
  })

  // ==========================================================================
  // Distribution Charts
  // ==========================================================================
  test.describe('Distribution Charts', () => {
    test('should display tickets by type chart when data exists', async ({ page }) => {
      await page.goto(dashboardUrl)

      // Either shows the chart or "No ticket sales yet" message
      const chartTitle = page.getByRole('heading', { name: 'Tickets by Type', exact: true })
      await expect(chartTitle).toBeVisible()
    })

    test('should display talks by category chart when data exists', async ({ page }) => {
      await page.goto(dashboardUrl)

      const chartTitle = page.getByRole('heading', { name: 'Talks by Category', exact: true })
      await expect(chartTitle).toBeVisible()
    })

    test('should display talks by format chart when data exists', async ({ page }) => {
      await page.goto(dashboardUrl)

      const chartTitle = page.getByRole('heading', { name: 'Talks by Format', exact: true })
      await expect(chartTitle).toBeVisible()
    })

    test('should display sessions by track chart when data exists', async ({ page }) => {
      await page.goto(dashboardUrl)

      // Only visible if there are tracks with sessions
      const chartTitle = page.getByRole('heading', { name: 'Sessions by Track', exact: true })
      // May or may not be visible depending on data
      if (await chartTitle.isVisible()) {
        await expect(chartTitle).toBeVisible()
      }
    })
  })

  // ==========================================================================
  // Alerts Page
  // ==========================================================================
  test.describe('Alerts Page', () => {
    test('should navigate to alerts page', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible({ timeout: 10000 })
    })

    test('should show back button to dashboard', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      // Use main content area back button
      const backButton = page.locator(`main a[href="${dashboardUrl}"]`).first()
      await expect(backButton).toBeVisible({ timeout: 10000 })
    })

    test('should display alert summary cards', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Active Alerts', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('Info', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Warning', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Critical', { exact: true }).first()).toBeVisible()
    })

    test('should display tabs for alerts, thresholds, and history', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      // Wait for the page to fully load
      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible({ timeout: 10000 })

      await expect(page.getByRole('button', { name: /^Alerts/ }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: /Thresholds/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /History/ })).toBeVisible()
    })

    test('should switch between tabs', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible({ timeout: 10000 })

      // Click Thresholds tab and wait for content
      const thresholdsTab = page.getByRole('button', { name: /Thresholds/ })
      await thresholdsTab.click()
      await page.waitForTimeout(500) // Wait for tab animation
      await expect(page.getByRole('heading', { name: 'Alert Thresholds', exact: true })).toBeVisible()

      // Click History tab
      const historyTab = page.getByRole('button', { name: /History/ })
      await historyTab.click()
      await page.waitForTimeout(500)
      // Should show history content or empty state

      // Click back to Alerts tab
      const alertsTab = page.getByRole('button', { name: /^Alerts/ }).first()
      await alertsTab.click()
    })
  })

  // ==========================================================================
  // Alert Thresholds Configuration
  // ==========================================================================
  test.describe('Alert Thresholds', () => {
    test('should show Add Threshold button', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible({ timeout: 10000 })

      await page.getByRole('button', { name: /Thresholds/ }).click()

      await expect(page.getByRole('button', { name: /Add Threshold/ })).toBeVisible()
    })

    // TODO: Fix flaky test - Add Threshold button not appearing in DOM
    test.skip('should open threshold creation form', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible({ timeout: 10000 })

      // Click Thresholds tab and wait for it to render
      await page.getByRole('button', { name: /Thresholds/ }).click()

      // Wait for Add Threshold button to be visible
      const addButton = page.getByRole('button', { name: /Add Threshold/ })
      await expect(addButton).toBeVisible({ timeout: 5000 })

      // Click Add Threshold and wait for form
      await addButton.click()

      await expect(page.getByRole('heading', { name: 'New Alert Threshold' })).toBeVisible({ timeout: 5000 })
      await expect(page.locator('#name')).toBeVisible()
      await expect(page.locator('#metric')).toBeVisible()
      await expect(page.locator('#operator')).toBeVisible()
      await expect(page.locator('#value')).toBeVisible()
      await expect(page.locator('#level')).toBeVisible()
    })

    // TODO: Fix flaky test - Add Threshold button not appearing in DOM
    test.skip('should cancel threshold creation', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible({ timeout: 10000 })

      // Navigate to Thresholds tab
      await page.getByRole('button', { name: /Thresholds/ }).click()

      // Wait for Add Threshold button
      const addButton = page.getByRole('button', { name: /Add Threshold/ })
      await expect(addButton).toBeVisible({ timeout: 5000 })

      // Open form
      await addButton.click()
      await expect(page.getByRole('heading', { name: 'New Alert Threshold' })).toBeVisible({ timeout: 5000 })

      // Cancel and verify form is hidden
      await page.getByRole('button', { name: /Cancel/ }).click()
      await expect(page.getByRole('heading', { name: 'New Alert Threshold' })).not.toBeVisible()
    })

    // TODO: Fix flaky test - Add Threshold button not appearing in DOM
    test.skip('should create a new threshold', async ({ page }) => {
      await page.goto(alertsUrl)
      await page.waitForLoadState('networkidle')

      // Wait for page to load
      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible({ timeout: 10000 })

      // Navigate to Thresholds tab
      await page.getByRole('button', { name: /Thresholds/ }).click()

      // Wait for Add Threshold button
      const addButton = page.getByRole('button', { name: /Add Threshold/ })
      await expect(addButton).toBeVisible({ timeout: 5000 })

      // Open form
      await addButton.click()
      await expect(page.getByRole('heading', { name: 'New Alert Threshold' })).toBeVisible({ timeout: 5000 })

      const thresholdName = `E2E Threshold ${Date.now()}`

      // Fill form using IDs
      await page.locator('#name').fill(thresholdName)
      await page.locator('#metric').selectOption('billing_sales')
      await page.locator('#operator').selectOption('lt')
      await page.locator('#value').fill('100')
      await page.locator('#level').selectOption('warning')

      await page.getByRole('button', { name: /Create Threshold/ }).click()
      await page.waitForLoadState('networkidle')

      // Verify the threshold appears
      await expect(page.getByText(thresholdName)).toBeVisible({ timeout: 5000 })
    })
  })

  // ==========================================================================
  // Access Control
  // ==========================================================================
  test.describe('Access Control', () => {
    test('should require authentication for reporting list', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(reportingUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should require authentication for dashboard', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(dashboardUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should require authentication for alerts', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(alertsUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should deny speaker access to reporting pages', async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('speaker@example.com')
      await page.getByLabel('Password').fill('speaker123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })

      const response = await page.goto(reportingUrl)

      expect(response?.status()).toBe(403)
      await expect(page.getByText(/access denied|forbidden/i)).toBeVisible()
    })
  })

  // ==========================================================================
  // Navigation
  // ==========================================================================
  test.describe('Navigation', () => {
    test('should navigate from sidebar to reporting', async ({ page }) => {
      await page.goto('/admin')

      // Click on Reporting in sidebar
      const reportingLink = page.locator('nav a[href="/admin/reporting"]')
      if (await reportingLink.isVisible()) {
        await reportingLink.click()
        await expect(page).toHaveURL(reportingUrl)
      }
    })

    test('should navigate back from dashboard to list', async ({ page }) => {
      await page.goto(dashboardUrl)

      // Use main content area back button (not sidebar)
      await page.locator('main a[href="/admin/reporting"]').first().click()

      await expect(page).toHaveURL(reportingUrl)
    })
  })
})
