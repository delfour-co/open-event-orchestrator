import { expect, test } from '@playwright/test'

test.describe('Sponsoring Packages', () => {
  const editionSlug = 'devfest-paris-2025'
  const packagesUrl = `/admin/sponsoring/${editionSlug}/packages`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Packages List
  // ==========================================================================
  test.describe('Packages List', () => {
    test('should display packages page', async ({ page }) => {
      await page.goto(packagesUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Sponsorship Packages' })).toBeVisible()
    })

    test('should show seeded packages', async ({ page }) => {
      await page.goto(packagesUrl)

      // Seeded packages
      await expect(page.getByText('Platinum')).toBeVisible()
      await expect(page.getByText('Gold')).toBeVisible()
      await expect(page.getByText('Silver')).toBeVisible()
      await expect(page.getByText('Bronze')).toBeVisible()
    })

    test('should show package prices', async ({ page }) => {
      await page.goto(packagesUrl)

      // Check that prices are displayed
      await expect(page.getByText(/€/).first()).toBeVisible()
    })

    test('should show tier badges', async ({ page }) => {
      await page.goto(packagesUrl)

      await expect(page.getByText('Tier 1 (Highest)').first()).toBeVisible()
      await expect(page.getByText('Tier 2').first()).toBeVisible()
    })

    test('should show benefits list on package cards', async ({ page }) => {
      await page.goto(packagesUrl)

      // Benefits section should be visible
      await expect(page.getByText('Benefits').first()).toBeVisible()
    })
  })

  // ==========================================================================
  // Package CRUD
  // ==========================================================================
  test.describe('Package CRUD', () => {
    test('should create a new package', async ({ page }) => {
      await page.goto(packagesUrl)

      const packageName = `E2E Package ${Date.now()}`

      await page.getByRole('button', { name: /New Package/ }).click()
      await expect(page.getByRole('heading', { name: 'New Package' })).toBeVisible()

      await page.locator('#pkg-name').fill(packageName)
      await page.locator('#pkg-tier').selectOption('3')
      await page.locator('#pkg-price').fill('2500')
      await page.locator('#pkg-currency').selectOption('EUR')
      await page.locator('#pkg-max').fill('10')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // New package should be visible
      await expect(page.getByText(packageName)).toBeVisible()
    })

    test('should edit an existing package', async ({ page }) => {
      await page.goto(packagesUrl)

      const packageName = `EditPkg ${Date.now()}`

      // Create a package first
      await page.getByRole('button', { name: /New Package/ }).click()
      await page.locator('#pkg-name').fill(packageName)
      await page.locator('#pkg-price').fill('1000')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(packageName)).toBeVisible()

      // Edit the package
      const card = page.locator('.card, [class*="card"]').filter({ hasText: packageName })
      await card.getByRole('button', { name: /Edit/ }).click()

      await expect(page.getByRole('heading', { name: 'Edit Package' })).toBeVisible()

      await page.locator('#pkg-price').clear()
      await page.locator('#pkg-price').fill('1500')
      await page.locator('#pkg-description').fill('Updated description')

      await page.getByRole('button', { name: 'Update' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(packageName)).toBeVisible()
    })

    test('should delete a package with no sponsors', async ({ page }) => {
      await page.goto(packagesUrl)

      const packageName = `DelPkg ${Date.now()}`

      // Create a package to delete
      await page.getByRole('button', { name: /New Package/ }).click()
      await page.locator('#pkg-name').fill(packageName)
      await page.locator('#pkg-price').fill('500')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(packageName)).toBeVisible()

      // Delete the package
      const card = page.locator('.card, [class*="card"]').filter({ hasText: packageName })
      await card.getByRole('button', { name: /Delete/ }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText(packageName)).not.toBeVisible()
    })

    test('should toggle package active status', async ({ page }) => {
      await page.goto(packagesUrl)

      const packageName = `TogglePkg ${Date.now()}`

      // Create a package
      await page.getByRole('button', { name: /New Package/ }).click()
      await page.locator('#pkg-name').fill(packageName)
      await page.locator('#pkg-price').fill('750')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Find the card with the switch
      const card = page.locator('.card, [class*="card"]').filter({ hasText: packageName })

      // Toggle the switch to inactive
      await card.locator('button[role="switch"]').click()
      await page.waitForLoadState('networkidle')

      // Card should show inactive state (opacity)
      await expect(card.locator('text=Inactive')).toBeVisible()
    })
  })

  // ==========================================================================
  // Benefits Management
  // ==========================================================================
  test.describe('Benefits Management', () => {
    test('should toggle benefits in package form', async ({ page }) => {
      await page.goto(packagesUrl)

      await page.getByRole('button', { name: /New Package/ }).click()
      await expect(page.getByRole('heading', { name: 'New Package' })).toBeVisible()

      // Default benefits should be visible in the dialog
      const dialog = page.locator('[role="dialog"], form')
      await expect(dialog.getByText('Logo on website').first()).toBeVisible()
      await expect(dialog.getByText('Booth at venue').first()).toBeVisible()

      // Click to toggle a benefit
      await dialog.getByText('Logo on website').first().click()

      // The benefit should now be included (checkmark visible)
    })

    test('should add custom benefit', async ({ page }) => {
      await page.goto(packagesUrl)

      await page.getByRole('button', { name: /New Package/ }).click()

      const customBenefit = `Custom Benefit ${Date.now()}`

      // Add custom benefit
      await page.getByPlaceholder('Add custom benefit').fill(customBenefit)
      await page
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .last()
        .click()

      // Custom benefit should appear in the list
      await expect(page.getByText(customBenefit)).toBeVisible()
    })
  })

  // ==========================================================================
  // Navigation
  // ==========================================================================
  test.describe('Navigation', () => {
    test('should navigate back to dashboard', async ({ page }) => {
      await page.goto(packagesUrl)

      await page.locator('main').getByRole('link', { name: 'Dashboard' }).click()

      await expect(page).toHaveURL(`/admin/sponsoring/${editionSlug}`)
    })

    test('should navigate to sponsors list', async ({ page }) => {
      await page.goto(packagesUrl)

      await page.locator('main').getByRole('link', { name: 'Sponsors' }).click()

      await expect(page).toHaveURL(`/admin/sponsoring/${editionSlug}/sponsors`)
    })
  })
})
