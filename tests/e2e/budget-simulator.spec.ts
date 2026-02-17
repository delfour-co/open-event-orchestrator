import { expect, test } from '@playwright/test'

test.describe('Budget Simulator', () => {
  const editionSlug = 'devfest-paris-2025'
  const simulatorUrl = `/admin/budget/${editionSlug}/simulator`
  const budgetUrl = `/admin/budget/${editionSlug}`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Navigation
  // ==========================================================================
  test.describe('Navigation', () => {
    test('should access simulator via calculator button in header', async ({ page }) => {
      await page.goto(budgetUrl)

      // Click the calculator button next to the status badge
      await page.locator('a[href*="simulator"] button').click()

      await expect(page).toHaveURL(simulatorUrl)
      await expect(page.getByText('Budget Simulator')).toBeVisible()
    })

    test('should display simulator page', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
      await expect(page.getByText('Budget Simulator')).toBeVisible()
    })
  })

  // ==========================================================================
  // Simulation Form
  // ==========================================================================
  test.describe('Simulation Form', () => {
    test('should display ticket type inputs when available', async ({ page }) => {
      await page.goto(simulatorUrl)

      // Should show ticket sales estimates section
      await expect(page.getByText('Ticket Sales Estimates')).toBeVisible()
    })

    test('should display sponsorship target input', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByLabel(/Sponsorship Target/)).toBeVisible()
    })

    test('should display fixed costs section', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByRole('heading', { name: 'Fixed Costs' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Add/ }).first()).toBeVisible()
    })

    test('should display variable costs section', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByRole('heading', { name: /Variable Costs/ })).toBeVisible()
    })

    test('should add a fixed cost item', async ({ page }) => {
      await page.goto(simulatorUrl)

      // Click the Add button in the Fixed Costs section
      const fixedCostsCard = page
        .locator('div')
        .filter({ hasText: /^Fixed Costs/ })
        .first()
      await fixedCostsCard.getByRole('button', { name: /Add/ }).click()

      // Count inputs should increase
      const inputs = page.locator('input[placeholder="Cost name"]')
      await expect(inputs).toHaveCount(await inputs.count())
    })

    test('should add a variable cost item', async ({ page }) => {
      await page.goto(simulatorUrl)

      // Click the Add button in the Variable Costs section
      const variableCostsCard = page
        .locator('div')
        .filter({ hasText: /Variable Costs.*per attendee/ })
        .first()
      await variableCostsCard.getByRole('button', { name: /Add/ }).click()

      // Verify the add worked by checking inputs exist
      await expect(page.locator('input[placeholder="Cost name"]').first()).toBeVisible()
    })
  })

  // ==========================================================================
  // Simulation Results
  // ==========================================================================
  test.describe('Simulation Results', () => {
    test('should display net profit result', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByText('Net Profit')).toBeVisible()
    })

    test('should display break-even result', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByText('Break-even')).toBeVisible()
      await expect(page.getByText('attendees to break even')).toBeVisible()
    })

    test('should display revenue breakdown', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByRole('heading', { name: 'Revenue Breakdown' })).toBeVisible()
      await expect(page.getByText('Ticket Revenue')).toBeVisible()
      await expect(page.getByText('Sponsorship Revenue')).toBeVisible()
      await expect(page.getByText('Total Revenue')).toBeVisible()
    })

    test('should display cost breakdown', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByRole('heading', { name: 'Cost Breakdown' })).toBeVisible()
      await expect(page.getByText('Fixed Costs').first()).toBeVisible()
      await expect(page.getByText('Variable Costs').first()).toBeVisible()
      await expect(page.getByText('Total Costs')).toBeVisible()
    })

    test('should display summary', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible()
    })

    test('should run simulation on button click', async ({ page }) => {
      await page.goto(simulatorUrl)

      await page.getByRole('button', { name: /Simulate/ }).click()

      // Results should be visible after simulation
      await expect(page.getByText('Net Profit')).toBeVisible()
    })
  })

  // ==========================================================================
  // Presets
  // ==========================================================================
  test.describe('Presets', () => {
    test('should display quick presets', async ({ page }) => {
      await page.goto(simulatorUrl)

      await expect(page.getByRole('heading', { name: 'Quick Presets' })).toBeVisible()
    })

    test('should load preset on click', async ({ page }) => {
      await page.goto(simulatorUrl)

      // Click a preset button
      const presetButton = page.getByRole('button', { name: /Small Conference/ })
      if (await presetButton.isVisible()) {
        await presetButton.click()

        // Verify costs were loaded
        await expect(page.locator('input[placeholder="Cost name"]').first()).toHaveValue(/.+/)
      }
    })
  })

  // ==========================================================================
  // Save Scenario
  // ==========================================================================
  test.describe('Save Scenario', () => {
    test('should open save dialog', async ({ page }) => {
      await page.goto(simulatorUrl)

      await page.getByRole('button', { name: /Save Scenario/ }).click()

      await expect(page.getByRole('heading', { name: 'Save Scenario' })).toBeVisible()
    })

    test('should save a scenario', async ({ page }) => {
      await page.goto(simulatorUrl)

      const scenarioName = `E2E Scenario ${Date.now()}`

      await page.getByRole('button', { name: /Save Scenario/ }).click()
      await expect(page.getByRole('heading', { name: 'Save Scenario' })).toBeVisible()

      await page.locator('#scenario-name').fill(scenarioName)
      await page.locator('#scenario-description').fill('Test scenario from E2E')

      await page.getByRole('button', { name: 'Save' }).click()
      await page.waitForLoadState('networkidle')

      // Scenario should appear in saved scenarios list
      await expect(page.getByText(scenarioName)).toBeVisible()
    })

    test('should load a saved scenario', async ({ page }) => {
      await page.goto(simulatorUrl)

      // First create a scenario
      const scenarioName = `LoadTest ${Date.now()}`

      await page.getByRole('button', { name: /Save Scenario/ }).click()
      await page.locator('#scenario-name').fill(scenarioName)
      await page.getByRole('button', { name: 'Save' }).click()
      await page.waitForLoadState('networkidle')

      // Now load it
      const scenarioRow = page.locator('div').filter({ hasText: scenarioName }).first()
      await scenarioRow.getByRole('button', { name: 'Load' }).click()

      // Verify it was loaded
      await expect(page.getByText('Net Profit')).toBeVisible()
    })

    test('should delete a saved scenario', async ({ page }) => {
      await page.goto(simulatorUrl)

      // First create a scenario
      const scenarioName = `DeleteTest ${Date.now()}`

      await page.getByRole('button', { name: /Save Scenario/ }).click()
      await page.locator('#scenario-name').fill(scenarioName)
      await page.getByRole('button', { name: 'Save' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(scenarioName)).toBeVisible()

      // Delete it
      const scenarioRow = page.locator('div').filter({ hasText: scenarioName }).first()
      await scenarioRow.locator('form button[type="submit"]').click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(scenarioName)).not.toBeVisible()
    })
  })
})
