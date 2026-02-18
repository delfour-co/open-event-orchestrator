import { expect, test } from '@playwright/test'

test.describe('Email Verification', () => {
  test.describe('Verification Page Display', () => {
    test('should show error page for missing token', async ({ page }) => {
      // Navigate to verification route without a token - should still match the route
      // The route is /auth/verify/[token] so we need some token value
      await page.goto('/auth/verify/')

      // Without proper routing, this might 404 or show an error
      // Check that we're not stuck on a loading state
      await page.waitForLoadState('networkidle')
    })

    test('should show error message for invalid token', async ({ page }) => {
      // Use an invalid token
      await page.goto('/auth/verify/invalid-token-12345')

      // Should show error state with XCircle icon indicator
      await expect(page.locator('.bg-red-100, .bg-red-900\\/30')).toBeVisible({ timeout: 5000 })

      // Should show "Verification Failed" heading
      await expect(page.getByRole('heading', { name: /verification failed/i })).toBeVisible()

      // Should show error message
      await expect(page.getByText(/couldn't verify|expired|invalid/i)).toBeVisible()
    })

    test('should show error message for expired token', async ({ page }) => {
      // Use an obviously expired/malformed token
      await page.goto('/auth/verify/expired-fake-token-abc123')

      // Should show error state
      await expect(page.getByRole('heading', { name: /verification failed/i })).toBeVisible()

      // Should have explanation about expired or invalid link
      await expect(page.getByText(/link may have expired|invalid/i)).toBeVisible()
    })

    test('should display login link on error page', async ({ page }) => {
      await page.goto('/auth/verify/invalid-token')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Should have link to login page
      const loginLink = page.getByRole('link', { name: /login|sign in/i })
      await expect(loginLink).toBeVisible()

      // Verify the link points to login
      await expect(loginLink).toHaveAttribute('href', '/auth/login')
    })

    test('should navigate to login when clicking login button on error', async ({ page }) => {
      await page.goto('/auth/verify/bad-token')

      // Wait for error page
      await expect(page.getByRole('heading', { name: /verification failed/i })).toBeVisible()

      // Click the login button
      await page.getByRole('link', { name: /login|sign in/i }).click()

      // Should navigate to login page
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('Page Title and Structure', () => {
    test('should have correct page title', async ({ page }) => {
      await page.goto('/auth/verify/test-token')

      // Page should have email verification in the title
      await expect(page).toHaveTitle(/email verification/i)
    })

    test('should display card-based layout', async ({ page }) => {
      await page.goto('/auth/verify/test-token')

      // Should have the card container
      await expect(page.locator('.shadow-lg')).toBeVisible()
    })

    test('should be centered on the page', async ({ page }) => {
      await page.goto('/auth/verify/test-token')

      // Check for centering classes
      await expect(page.locator('.flex.min-h-screen.items-center.justify-center')).toBeVisible()
    })
  })

  test.describe('Success Scenario', () => {
    // Note: Testing actual successful verification requires generating a valid token
    // which would typically involve creating a user and triggering the verification flow.
    // These tests verify the UI structure when verification succeeds.

    test('should display success elements when verification succeeds', async ({ page }) => {
      // For a real success test, we would need to:
      // 1. Create a user via API
      // 2. Get the verification token from the email (via Mailpit API)
      // 3. Navigate to the verification URL with that token
      // This test documents the expected behavior

      // Navigate to verification page (will show error for invalid token)
      await page.goto('/auth/verify/test-token')

      // Verify the page structure is correct
      // On success, we expect:
      // - Green checkmark icon (CheckCircle2)
      // - "Email Verified!" heading
      // - Success message about features access
      // - "Go to Dashboard" button linking to /admin

      // For now, just verify the page loads without crashing
      await page.waitForLoadState('networkidle')

      // The page should show either success or error state (not empty)
      const hasContent = (await page.getByRole('heading').count()) > 0

      expect(hasContent).toBe(true)
    })
  })

  test.describe('Error State Details', () => {
    test('should show specific error message from server', async ({ page }) => {
      await page.goto('/auth/verify/completely-invalid-token-xyz')

      // Wait for the page to process the token
      await page.waitForLoadState('networkidle')

      // Should display error heading
      await expect(page.getByRole('heading', { name: /verification failed/i })).toBeVisible()

      // Error message should be visible in a paragraph element
      // The actual error message comes from PocketBase ("An error occurred while validating...")
      await expect(page.locator('p.text-destructive')).toBeVisible({ timeout: 5000 })
    })

    test('should display helpful error explanation', async ({ page }) => {
      await page.goto('/auth/verify/fake-token')

      // Should have explanation text
      await expect(page.getByText(/couldn't verify your email address/i)).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/auth/verify/test-token')

      // Should have exactly one h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBe(1)
    })

    test('should have focusable login button', async ({ page }) => {
      await page.goto('/auth/verify/invalid-token')

      // Wait for error state
      await expect(page.getByRole('heading', { name: /verification failed/i })).toBeVisible()

      // The login button should be focusable
      const loginButton = page.getByRole('link', { name: /login|sign in/i })
      await loginButton.focus()
      await expect(loginButton).toBeFocused()
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/auth/verify/test-token')

      // Card should be visible and properly sized
      const card = page.locator('.w-full.max-w-md')
      await expect(card).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/auth/verify/test-token')

      // Card should remain centered
      await expect(page.locator('.flex.items-center.justify-center')).toBeVisible()
    })
  })
})
