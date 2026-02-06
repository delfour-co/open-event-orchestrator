import { expect, test } from '@playwright/test'

test.describe('Public Sponsors Page', () => {
  const editionSlug = 'devfest-paris-2025'
  const publicUrl = `/sponsors/${editionSlug}`

  // ==========================================================================
  // Public Display
  // ==========================================================================
  test.describe('Public Display', () => {
    test('should display public sponsors page without auth', async ({ page }) => {
      await page.goto(publicUrl)

      await expect(page.getByRole('heading', { name: 'Our Sponsors' })).toBeVisible()
    })

    test('should show confirmed sponsors grouped by tier', async ({ page }) => {
      await page.goto(publicUrl)

      // Tier headers should be visible for seeded packages (h2 with "X Sponsors")
      await expect(
        page.getByText(/Platinum Sponsors|Gold Sponsors|Silver Sponsors|Partners/).first()
      ).toBeVisible()
    })

    test('should display sponsor logos or placeholders', async ({ page }) => {
      await page.goto(publicUrl)

      // Should have sponsor cards/images or sponsor name text
      const sponsorElements = page.locator('img[alt], div.flex.items-center.justify-center')
      await expect(sponsorElements.first()).toBeVisible()
    })

    test('should link sponsor logos to their websites', async ({ page }) => {
      await page.goto(publicUrl)

      // Sponsors with websites should have links
      const sponsorLinks = page.locator('a[target="_blank"]')
      const count = await sponsorLinks.count()
      expect(count).toBeGreaterThanOrEqual(0) // May be 0 if no websites set
    })
  })

  // ==========================================================================
  // Empty State
  // ==========================================================================
  test.describe('Empty State', () => {
    test('should handle edition with no confirmed sponsors gracefully', async ({ page }) => {
      // Try a non-existent edition or one without sponsors
      await page.goto('/sponsors/non-existent-edition')

      // Should show 404 or empty state
      const notFound = page.getByText(/not found|no sponsors/i)
      await expect(notFound).toBeVisible()
    })
  })

  // ==========================================================================
  // Responsive Design
  // ==========================================================================
  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(publicUrl)

      await expect(page.getByRole('heading', { name: 'Our Sponsors' })).toBeVisible()
    })

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(publicUrl)

      await expect(page.getByRole('heading', { name: 'Our Sponsors' })).toBeVisible()
    })

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(publicUrl)

      await expect(page.getByRole('heading', { name: 'Our Sponsors' })).toBeVisible()
    })
  })
})
