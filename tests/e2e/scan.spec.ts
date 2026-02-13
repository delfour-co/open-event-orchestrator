import { expect, test } from '@playwright/test'

test.describe('Scanner PWA', () => {
  test.describe('Unauthenticated Access', () => {
    test('should show login link when not authenticated', async ({ page }) => {
      await page.goto('/scan')

      // Should show the page but with login required message
      await expect(page.getByRole('heading', { name: 'Ticket Scanner' })).toBeVisible()
      await expect(page.getByText('Login required')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Login required' })).toHaveAttribute(
        'href',
        '/auth/login?redirect=/scan'
      )
    })

    test('should redirect to login with correct redirect parameter', async ({ page }) => {
      await page.goto('/scan')

      // Click on the login link
      await page.getByRole('link', { name: 'Login required' }).click()

      // Should redirect to login with redirect parameter
      await expect(page).toHaveURL(/\/auth\/login\?redirect=\/scan/)
    })
  })

  test.describe('Authenticated - Edition List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should display edition list when authenticated', async ({ page }) => {
      await page.goto('/scan')

      // Should show the scanner page title
      await expect(page.getByRole('heading', { name: 'Ticket Scanner' })).toBeVisible()
      await expect(page.getByText('Select an edition to start scanning')).toBeVisible()
    })

    test('should show available editions', async ({ page }) => {
      await page.goto('/scan')

      // Should show at least one edition (DevFest Paris 2025)
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should navigate to scanner when clicking an edition', async ({ page }) => {
      await page.goto('/scan')

      // Click on the DevFest edition
      await page.getByText('DevFest Paris 2025').click()

      // Should navigate to the scanner page
      await page.waitForURL(/\/scan\/[a-z0-9]+/, { timeout: 10000 })
    })

    test('should not show login required when authenticated', async ({ page }) => {
      await page.goto('/scan')

      // Should not show login required message
      await expect(page.getByText('Login required')).not.toBeVisible()
    })
  })

  test.describe('Authenticated - Scanner Interface', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })

      // Navigate to scanner
      await page.goto('/scan')
      await page.getByText('DevFest Paris 2025').click()
      await page.waitForURL(/\/scan\/[a-z0-9]+/, { timeout: 10000 })
    })

    test('should display scanner interface with edition name', async ({ page }) => {
      // Should show the edition name in the header
      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
    })

    test('should display download offline button', async ({ page }) => {
      // Should show the download offline button
      await expect(page.getByRole('button', { name: /Download offline/ })).toBeVisible()
    })

    test('should display statistics counters', async ({ page }) => {
      // Should show the statistics bar with Expected, Scanned, and Errors
      await expect(page.getByText('Expected')).toBeVisible()
      await expect(page.getByText('Scanned')).toBeVisible()
      await expect(page.getByText('Errors')).toBeVisible()
    })

    test('should display logout button', async ({ page }) => {
      // Should show the logout button (form with logout action)
      const logoutForm = page.locator('form[action="/auth/logout"]')
      await expect(logoutForm).toBeVisible()

      const logoutButton = logoutForm.getByRole('button')
      await expect(logoutButton).toBeVisible()
    })

    test('should have back link to edition selection', async ({ page }) => {
      // Should show the back link
      const backLink = page.locator('a[href="/scan"]')
      await expect(backLink).toBeVisible()
    })

    test('should navigate back to edition list when clicking back', async ({ page }) => {
      // Click the back link
      await page.locator('a[href="/scan"]').click()

      // Should navigate back to scan page
      await page.waitForURL('/scan', { timeout: 5000 })
      await expect(page.getByRole('heading', { name: 'Ticket Scanner' })).toBeVisible()
    })

    test('should display online/offline status indicator', async ({ page }) => {
      // The layout should show the online/offline status bar
      // Check for either "Online" or "Offline" text in the status bar
      const statusBar = page.locator('.fixed.top-0')
      await expect(statusBar).toBeVisible()
      await expect(statusBar.getByText(/Online|Offline/)).toBeVisible()
    })

    test('should show ticket count in header', async ({ page }) => {
      // Should show the ticket count (e.g., "0 tickets")
      await expect(page.getByText(/\d+ tickets/)).toBeVisible()
    })
  })

  test.describe('Logout from Scanner', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should logout when clicking logout button', async ({ page }) => {
      // Navigate to scanner interface
      await page.goto('/scan')
      await page.getByText('DevFest Paris 2025').click()
      await page.waitForURL(/\/scan\/[a-z0-9]+/, { timeout: 10000 })

      // Click the logout button
      const logoutForm = page.locator('form[action="/auth/logout"]')
      await logoutForm.getByRole('button').click()

      // Should redirect to login or home page after logout
      await page.waitForURL(/\/auth\/login|\//, { timeout: 10000 })
    })
  })

  test.describe('PWA Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })

    test('should have PWA manifest link', async ({ page }) => {
      await page.goto('/scan')

      // Check for manifest link in head (use first() since there might be multiple)
      const manifestLink = page.locator('link[rel="manifest"]').first()
      await expect(manifestLink).toHaveAttribute('href', '/manifest.json')
    })

    test('should have mobile web app meta tags', async ({ page }) => {
      await page.goto('/scan')

      // Check for mobile web app meta tags
      await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute(
        'content',
        'yes'
      )
      await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
        'content',
        'OEO Scanner'
      )
    })
  })
})
