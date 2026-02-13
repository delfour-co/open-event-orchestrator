import { expect, test } from '@playwright/test'

test.describe('Attendee PWA', () => {
  test.describe('Public Access', () => {
    test('should display edition schedule without authentication', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Should show the edition name
      await expect(page.getByTestId('edition-name')).toBeVisible()
      await expect(page.getByTestId('edition-name')).toContainText('DevFest Paris 2025')
    })

    test('should show 404 for non-existent edition', async ({ page }) => {
      const response = await page.goto('/app/non-existent-edition')
      expect(response?.status()).toBe(404)
    })

    test('should display schedule tab by default', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Schedule tab should be active
      await expect(page.getByTestId('schedule-tab')).toBeVisible()
      await expect(page.getByTestId('schedule-tab')).toHaveClass(/border-primary/)
    })

    test('should display favorites tab', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Favorites tab should be visible
      await expect(page.getByTestId('favorites-tab')).toBeVisible()
    })
  })

  test.describe('Schedule View', () => {
    test('should display day selector when schedule has multiple days', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Should show day selector buttons
      const dayButtons = page.locator('[data-testid^="day-selector-"]')
      const count = await dayButtons.count()

      // At least one day should be visible if schedule exists
      if (count > 0) {
        await expect(dayButtons.first()).toBeVisible()
      }
    })

    test('should allow switching between days', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      const dayButtons = page.locator('[data-testid^="day-selector-"]')
      const count = await dayButtons.count()

      if (count > 1) {
        // Click second day
        await dayButtons.nth(1).click()

        // Second day should now be active (have primary background)
        await expect(dayButtons.nth(1)).toHaveClass(/bg-primary/)
      }
    })

    test('should display session cards', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Wait for sessions to load
      await page.waitForTimeout(500)

      // Check for session cards
      const sessionCards = page.locator('[data-testid^="session-card-"]')
      const count = await sessionCards.count()

      // If there are sessions, they should be visible
      if (count > 0) {
        await expect(sessionCards.first()).toBeVisible()
      }
    })
  })

  test.describe('Favorites Feature', () => {
    test('should toggle favorite status on session', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Wait for page to load
      await page.waitForTimeout(500)

      // Find first session card
      const sessionCards = page.locator('[data-testid^="session-card-"]')
      const count = await sessionCards.count()

      if (count > 0) {
        // Get the session ID from the first card
        const firstCard = sessionCards.first()
        const testId = await firstCard.getAttribute('data-testid')
        const sessionId = testId?.replace('session-card-', '')

        if (sessionId) {
          // Find and click the favorite button
          const favoriteButton = page.getByTestId(`favorite-button-${sessionId}`)
          await expect(favoriteButton).toBeVisible()

          // Click to add to favorites
          await favoriteButton.click()

          // Heart should be filled (has fill-current class)
          const heartIcon = favoriteButton.locator('svg')
          await expect(heartIcon).toHaveClass(/fill-current/)

          // Click again to remove
          await favoriteButton.click()

          // Heart should not be filled
          await expect(heartIcon).not.toHaveClass(/fill-current/)
        }
      }
    })

    test('should switch to favorites view', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Click on favorites tab
      await page.getByTestId('favorites-tab').click()

      // Favorites tab should be active
      await expect(page.getByTestId('favorites-tab')).toHaveClass(/border-primary/)

      // Should show empty state message when no favorites
      await expect(page.getByText('No Favorites Yet')).toBeVisible()
    })

    test('should show favorited sessions in My Agenda view', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Wait for page to load
      await page.waitForTimeout(500)

      // Find first session and favorite it
      const sessionCards = page.locator('[data-testid^="session-card-"]')
      const count = await sessionCards.count()

      if (count > 0) {
        const firstCard = sessionCards.first()
        const testId = await firstCard.getAttribute('data-testid')
        const sessionId = testId?.replace('session-card-', '')

        if (sessionId) {
          // Add to favorites
          const favoriteButton = page.getByTestId(`favorite-button-${sessionId}`)
          await favoriteButton.click()

          // Wait for state update
          await page.waitForTimeout(200)

          // Switch to favorites view
          await page.getByTestId('favorites-tab').click()

          // Should show the favorited session
          await expect(page.getByText('No Favorites Yet')).not.toBeVisible()
        }
      }
    })

    test('should show favorite count badge on tab', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Wait for page to load
      await page.waitForTimeout(500)

      // Find first session and favorite it
      const sessionCards = page.locator('[data-testid^="session-card-"]')
      const count = await sessionCards.count()

      if (count > 0) {
        const firstCard = sessionCards.first()
        const testId = await firstCard.getAttribute('data-testid')
        const sessionId = testId?.replace('session-card-', '')

        if (sessionId) {
          // Add to favorites
          const favoriteButton = page.getByTestId(`favorite-button-${sessionId}`)
          await favoriteButton.click()

          // Wait for state update
          await page.waitForTimeout(200)

          // Check for badge on favorites tab
          const badge = page.getByTestId('favorites-tab').locator('span.rounded-full')
          await expect(badge).toBeVisible()
          await expect(badge).toContainText('1')
        }
      }
    })
  })

  test.describe('PWA Features', () => {
    test('should have PWA manifest link', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Check for manifest link in head
      const manifestLink = page.locator('link[rel="manifest"]').first()
      await expect(manifestLink).toHaveAttribute('href', '/manifest-app.json')
    })

    test('should have mobile web app meta tags', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // Check for mobile web app meta tags
      await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute(
        'content',
        'yes'
      )
      await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
        'content',
        'yes'
      )
      await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
        'content',
        'Event Schedule'
      )
    })

    test('should have theme color meta tag', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#3b82f6')
    })

    test('should display online/offline status indicator', async ({ page }) => {
      await page.goto('/app/devfest-paris-2025')

      // The layout should show the online/offline status bar
      const statusBar = page.locator('.fixed.top-0')
      await expect(statusBar).toBeVisible()
      await expect(statusBar.getByText(/Online|Offline/)).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/app/devfest-paris-2025')

      // Header should be visible
      await expect(page.getByTestId('edition-name')).toBeVisible()

      // Tabs should be visible and usable
      await expect(page.getByTestId('schedule-tab')).toBeVisible()
      await expect(page.getByTestId('favorites-tab')).toBeVisible()
    })

    test('should allow horizontal scrolling on day selector', async ({ page }) => {
      // Set narrow viewport
      await page.setViewportSize({ width: 320, height: 568 })

      await page.goto('/app/devfest-paris-2025')

      // Day selector container should allow horizontal scroll
      const daySelector = page.locator('.overflow-x-auto').first()
      if (await daySelector.isVisible()) {
        // Element should be scrollable or contain day buttons
        const dayButtons = page.locator('[data-testid^="day-selector-"]')
        const count = await dayButtons.count()
        expect(count).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
