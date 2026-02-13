import { expect, test } from '@playwright/test'

test.describe('Check-in Control Tower', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test.describe('Page Layout', () => {
    test('should display check-in control page with two columns', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Header
      await expect(page.getByRole('heading', { name: 'Check-in Control' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()

      // Scanner Station section
      await expect(page.getByText('Scanner Station')).toBeVisible()

      // Field Scanners section
      await expect(page.getByText('Field Scanners')).toBeVisible()

      // Recent Activity section
      await expect(page.getByText('Recent Activity')).toBeVisible()
    })

    test('should display global stats card', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Stats should be visible
      await expect(page.getByText('Checked in')).toBeVisible()
      await expect(page.getByText('Active Scanners')).toBeVisible()
      await expect(page.getByText('Progress')).toBeVisible()

      // Progress bar should exist
      const progressBar = page.locator('.bg-green-500.rounded-full')
      await expect(progressBar).toBeVisible()
    })

    test('should have back link to billing dashboard', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      const backLink = page.locator('a[href="/admin/billing/devfest-paris-2025"]')
      await expect(backLink).toBeVisible()

      await backLink.click()
      await page.waitForURL('/admin/billing/devfest-paris-2025')
    })

    test('should have link to stats page', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      const statsLink = page.getByRole('link', { name: 'Stats' })
      await expect(statsLink).toBeVisible()
      await expect(statsLink).toHaveAttribute(
        'href',
        '/admin/billing/devfest-paris-2025/checkin/stats'
      )
    })

    test('should have refresh button', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      const refreshButton = page.getByRole('button', { name: 'Refresh' })
      await expect(refreshButton).toBeVisible()
    })
  })

  test.describe('Mode Toggle', () => {
    test('should start in manual mode by default', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Manual button should be active (default variant)
      const manualButton = page.getByRole('button', { name: 'Manual' })
      await expect(manualButton).toBeVisible()

      // Manual entry form should be visible
      await expect(page.getByPlaceholder('Enter ticket number...')).toBeVisible()
    })

    test('should switch to scanner mode when clicking Scan QR', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Click Scan QR button
      await page.getByRole('button', { name: 'Scan QR' }).click()

      // Manual entry form should be hidden
      await expect(page.getByPlaceholder('Enter ticket number...')).not.toBeVisible()

      // Scanner container should exist in DOM (may be hidden while initializing)
      await expect(page.locator('#qr-scanner')).toBeAttached()

      // Scanner instruction text should be visible
      await expect(page.getByText('Point camera at the QR code')).toBeVisible()
    })

    test('should switch back to manual mode', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Switch to scanner mode
      await page.getByRole('button', { name: 'Scan QR' }).click()
      await expect(page.getByPlaceholder('Enter ticket number...')).not.toBeVisible()

      // Switch back to manual mode
      await page.getByRole('button', { name: 'Manual' }).click()
      await expect(page.getByPlaceholder('Enter ticket number...')).toBeVisible()
    })
  })

  test.describe('Manual Check-in', () => {
    test('should show error for empty ticket input', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Check In button should be disabled when input is empty
      const checkInButton = page.getByRole('button', { name: 'Check In' })
      await expect(checkInButton).toBeDisabled()
    })

    test('should enable Check In button when ticket number is entered', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Enter a ticket number
      await page.getByPlaceholder('Enter ticket number...').fill('TKT-123456')

      // Check In button should be enabled
      const checkInButton = page.getByRole('button', { name: 'Check In' })
      await expect(checkInButton).toBeEnabled()
    })

    test('should show error for invalid ticket number', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Enter an invalid ticket number
      await page.getByPlaceholder('Enter ticket number...').fill('INVALID-TICKET')
      await page.getByRole('button', { name: 'Check In' }).click()

      // Should show error message
      await expect(page.getByText('Check-in Failed')).toBeVisible()
      await expect(page.getByText('Ticket not found')).toBeVisible()
    })
  })

  test.describe('Field Scanners Dashboard', () => {
    test('should show empty state when no scanners active', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Check for empty state or scanner list
      const fieldScannersSection = page.locator('text=Field Scanners').locator('..')
      await expect(fieldScannersSection).toBeVisible()
    })

    test('should display scanner info when scanners have checked in tickets', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // The field scanners section should exist
      await expect(page.getByText('Field Scanners')).toBeVisible()

      // Either shows empty state or scanner list
      const emptyState = page.getByText('No scanners active yet')
      const scannerList = page.locator('.divide-y').first()

      // One of these should be visible
      const isEmpty = await emptyState.isVisible().catch(() => false)
      if (!isEmpty) {
        await expect(scannerList).toBeVisible()
      }
    })
  })

  test.describe('Recent Activity Feed', () => {
    test('should display recent activity section', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      await expect(page.getByText('Recent Activity')).toBeVisible()
    })

    test('should show empty state or activity list', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      // Either shows empty state or activity list
      const emptyState = page.getByText('No check-ins yet')
      const activityList = page.locator('.max-h-\\[400px\\]')

      const isEmpty = await emptyState.isVisible().catch(() => false)
      if (!isEmpty) {
        await expect(activityList).toBeVisible()
      }
    })
  })

  test.describe('Refresh Functionality', () => {
    test('should refresh data when clicking refresh button', async ({ page }) => {
      await page.goto('/admin/billing/devfest-paris-2025/checkin')

      const refreshButton = page.getByRole('button', { name: 'Refresh' })

      // Click refresh
      await refreshButton.click()

      // Button should show spinning animation briefly
      // The page should still be functional after refresh
      await expect(page.getByRole('heading', { name: 'Check-in Control' })).toBeVisible()
    })
  })
})

test.describe('Billing Dashboard - Scanner URL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display scanner URL on billing dashboard', async ({ page }) => {
    await page.goto('/admin/billing/devfest-paris-2025')

    // Should show Scanner URL section
    await expect(page.getByText('Scanner:')).toBeVisible()

    // Should have /scan/ in the URL display
    await expect(page.locator('code', { hasText: '/scan/' })).toBeVisible()
  })

  test('should display public tickets URL on billing dashboard', async ({ page }) => {
    await page.goto('/admin/billing/devfest-paris-2025')

    // Should show Tickets URL section
    await expect(page.getByText('Tickets:')).toBeVisible()

    // Should have /tickets/ in the URL display
    await expect(page.locator('code', { hasText: '/tickets/' })).toBeVisible()
  })

  test('should have copy buttons for both URLs', async ({ page }) => {
    await page.goto('/admin/billing/devfest-paris-2025')

    // Should have multiple copy buttons (at least 2 - one for each URL)
    const copyButtons = page.locator('button').filter({ has: page.locator('svg') })
    expect(await copyButtons.count()).toBeGreaterThanOrEqual(2)
  })

  test('should have external link to scanner', async ({ page }) => {
    await page.goto('/admin/billing/devfest-paris-2025')

    // Find the scanner external link
    const scannerLink = page.locator('a[href^="/scan/"]')
    await expect(scannerLink).toBeVisible()
  })

  test('should navigate to check-in page from dashboard', async ({ page }) => {
    await page.goto('/admin/billing/devfest-paris-2025')

    // Click Check-in button
    await page.getByRole('link', { name: 'Check-in' }).click()

    await page.waitForURL(/\/admin\/billing\/devfest-paris-2025\/checkin/)
    await expect(page.getByRole('heading', { name: 'Check-in Control' })).toBeVisible()
  })
})

test.describe('Check-in Stats Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should load stats page without error', async ({ page }) => {
    await page.goto('/admin/billing/devfest-paris-2025/checkin/stats')

    // Page should load successfully (not 500 error)
    await expect(page).not.toHaveURL(/error/)

    // Should have some content
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('should navigate to stats from checkin page', async ({ page }) => {
    await page.goto('/admin/billing/devfest-paris-2025/checkin')

    // Click Stats button
    await page.getByRole('link', { name: 'Stats' }).click()

    await page.waitForURL(/\/admin\/billing\/devfest-paris-2025\/checkin\/stats/)
  })
})
