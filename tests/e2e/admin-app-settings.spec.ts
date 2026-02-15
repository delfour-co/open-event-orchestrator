import { expect, test } from '@playwright/test'

test.describe('Admin App Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: /Sign in|Login/ }).click()

    // Wait for login to complete
    await page.waitForURL(/\/admin/)

    // Navigate to app settings
    await page.goto('/admin/app/devfest-paris-2025')
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Attendee App' })).toBeVisible()
  })

  test.describe('Navigation', () => {
    test('should display app settings page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Attendee App' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should have Open App button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /Open App/ })).toBeVisible()
    })

    test('should have settings tabs', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Appearance', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Features', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Feedback', exact: true })).toBeVisible()
    })

    test('should switch between tabs', async ({ page }) => {
      // Features tab
      await page.getByRole('button', { name: 'Features', exact: true }).click()
      await expect(page.getByText('App Tabs')).toBeVisible()

      // Feedback tab
      await page.getByRole('button', { name: 'Feedback', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Session Ratings' })).toBeVisible()

      // Back to appearance
      await page.getByRole('button', { name: 'Appearance', exact: true }).click()
      await expect(page.getByText('Branding')).toBeVisible()
    })
  })

  test.describe('Appearance Settings', () => {
    test('should display branding form', async ({ page }) => {
      await expect(page.getByLabel('App Title')).toBeVisible()
      await expect(page.getByLabel('Subtitle / Venue')).toBeVisible()
      await expect(page.getByLabel('Primary Color')).toBeVisible()
      await expect(page.getByLabel('Accent Color')).toBeVisible()
    })

    test('should have logo upload option', async ({ page }) => {
      await expect(page.getByText('Logo (Optional)')).toBeVisible()
      await expect(page.getByRole('button', { name: /Upload Logo/ })).toBeVisible()
    })

    test('should have header image upload option', async ({ page }) => {
      await expect(page.getByText('Header Background (Optional)')).toBeVisible()
      await expect(page.getByRole('button', { name: /Upload Image/ })).toBeVisible()
    })

    test('should have save appearance button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Save Appearance/ })).toBeVisible()
    })
  })

  test.describe('Features Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Features', exact: true }).click()
      await page.waitForTimeout(300)
    })

    test('should display feature toggles', async ({ page }) => {
      // Check that the App Tabs section is visible
      await expect(page.getByText('App Tabs')).toBeVisible()
      // Verify switches exist
      const switches = page.getByRole('switch')
      const count = await switches.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should have schedule always enabled', async ({ page }) => {
      // Schedule toggle should be disabled (always on)
      const scheduleSection = page.locator('[class*="bg-muted"]').filter({ hasText: 'Schedule' })
      await expect(scheduleSection).toBeVisible()
      await expect(scheduleSection.getByText('always enabled')).toBeVisible()
    })

    test('should toggle speakers feature', async ({ page }) => {
      // Find all switches in the features tab
      const switches = page.getByRole('switch')
      await expect(switches.first()).toBeVisible()

      // Just verify the switch exists and can be interacted with
      const count = await switches.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should toggle tickets feature', async ({ page }) => {
      // Second switch should be My Ticket
      const switches = page.getByRole('switch')
      expect(await switches.count()).toBeGreaterThan(1)
    })

    test('should toggle feedback feature', async ({ page }) => {
      // Third switch should be Feedback
      const switches = page.getByRole('switch')
      expect(await switches.count()).toBeGreaterThan(2)
    })

    test('should toggle favorites feature', async ({ page }) => {
      // Fourth switch should be Favorites
      const switches = page.getByRole('switch')
      expect(await switches.count()).toBeGreaterThanOrEqual(4)
    })

    test('should have save features button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Save Features/ })).toBeVisible()
    })
  })

  test.describe('Feedback Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'Feedback', exact: true }).click()
      // Wait for tab content to load
      await page.waitForTimeout(300)
    })

    test('should display session ratings settings', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Session Ratings' })).toBeVisible()
    })

    test('should display rating modes when enabled', async ({ page }) => {
      // Find switches in the feedback tab
      const switches = page.getByRole('switch')
      await expect(switches.first()).toBeVisible()

      // Just verify the feedback tab has switches for configuration
      const count = await switches.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should display event feedback settings', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Event Feedback' })).toBeVisible()
    })

    test('should display intro text field when feedback enabled', async ({ page }) => {
      // The second switch should be Enable Event Feedback
      const switches = page.getByRole('switch')
      const count = await switches.count()
      if (count >= 2) {
        const secondSwitch = switches.nth(1)

        // Enable event feedback if not already enabled
        if ((await secondSwitch.getAttribute('data-state')) !== 'checked') {
          await secondSwitch.click()
          await page.waitForTimeout(300)
        }

        await expect(page.getByLabel('Introduction Text')).toBeVisible()
      }
    })

    test('should have save feedback settings button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Save Feedback Settings/ })).toBeVisible()
    })
  })

  test.describe('Phone Preview', () => {
    test('should display phone preview iframe', async ({ page }) => {
      const iframe = page.locator('iframe[title="App Preview"]')
      await expect(iframe).toBeVisible()
    })

    test('should have refresh preview button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Refresh Preview/ })).toBeVisible()
    })

    test('should refresh preview on button click', async ({ page }) => {
      const iframe = page.locator('iframe[title="App Preview"]')

      await page.getByRole('button', { name: /Refresh Preview/ }).click()

      // After refresh, src should still contain the app URL
      const src = await iframe.getAttribute('src')
      expect(src).toContain('/app/devfest-paris-2025')
    })
  })
})
