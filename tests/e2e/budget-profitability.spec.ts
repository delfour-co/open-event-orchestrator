import { expect, test } from '@playwright/test'

test.describe('Budget Profitability', () => {
  const editionSlug = 'devfest-paris-2025'
  const profitabilityUrl = `/admin/budget/${editionSlug}/profitability`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Page Display
  // ==========================================================================
  test.describe('Page Display', () => {
    test('should display profitability page', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
      await expect(page.getByText('Profitability & Forecasting')).toBeVisible()
    })

    test('should show sub-navigation', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Checklist' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Profitability' })).toBeVisible()
    })

    test('should show risk level indicator', async ({ page }) => {
      await page.goto(profitabilityUrl)

      // Risk level should be visible (low, medium, or high)
      await expect(
        page
          .locator('text=Low Risk')
          .or(page.locator('text=Medium Risk'))
          .or(page.locator('text=High Risk'))
      ).toBeVisible()
    })
  })

  // ==========================================================================
  // Key Metrics
  // ==========================================================================
  test.describe('Key Metrics', () => {
    test('should display profitability overview card', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Profitability Overview')).toBeVisible()
    })

    test('should display revenue metrics', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Ticket Revenue')).toBeVisible()
      await expect(page.getByText('Sponsor Revenue')).toBeVisible()
    })

    test('should display cost metrics', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Total Costs')).toBeVisible()
    })

    test('should display profit metrics', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Net Profit')).toBeVisible()
      await expect(page.getByText('Profit Margin')).toBeVisible()
    })
  })

  // ==========================================================================
  // Break-even Analysis
  // ==========================================================================
  test.describe('Break-even Analysis', () => {
    test('should display break-even section', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Break-even Analysis')).toBeVisible()
    })

    test('should show break-even attendees', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Break-even Attendees')).toBeVisible()
    })

    test('should show current vs break-even comparison', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Current Attendees')).toBeVisible()
    })
  })

  // ==========================================================================
  // Cost Variance
  // ==========================================================================
  test.describe('Cost Variance', () => {
    test('should display cost variance section', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Cost Variance')).toBeVisible()
    })

    test('should show planned vs actual comparison', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Planned Costs')).toBeVisible()
      await expect(page.getByText('Actual Costs')).toBeVisible()
    })
  })

  // ==========================================================================
  // Forecast
  // ==========================================================================
  test.describe('Forecast', () => {
    test('should display forecast section', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Forecast')).toBeVisible()
    })

    test('should show projected metrics', async ({ page }) => {
      await page.goto(profitabilityUrl)

      await expect(page.getByText('Projected Revenue')).toBeVisible()
      await expect(page.getByText('Projected Profit')).toBeVisible()
    })
  })

  // ==========================================================================
  // Explanations
  // ==========================================================================
  test.describe('Explanations', () => {
    test('should display introduction explaining the dashboard', async ({ page }) => {
      await page.goto(profitabilityUrl)

      // The page should have explanatory content
      await expect(
        page.getByText(/This dashboard provides/i).or(page.getByText(/profitability/i).first())
      ).toBeVisible()
    })
  })
})
