import { expect, test } from '@playwright/test'

// Note: These tests require both the app and PocketBase to be running.
// Some tests may fail in preview mode due to server-side rendering differences.
// For full testing, use: pnpm dev (in one terminal) and pnpm test:e2e (in another)
//
// TODO: Fix PocketBase connection in preview mode to enable these tests
test.describe.skip('CFP Admin Talk Detail', () => {
  const editionSlug = 'devfest-paris-2025'

  test.beforeEach(async ({ page }) => {
    // Login as admin/organizer
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display talk details page', async ({ page }) => {
    // Navigate to submissions list
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)

    // Click on the first talk
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify page title
    await expect(
      page.getByRole('heading', { name: 'Building Scalable Web Apps with SvelteKit' })
    ).toBeVisible()
  })

  test('should display talk abstract and description', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify talk details section
    await expect(page.getByRole('heading', { name: 'Talk Details' })).toBeVisible()
    await expect(page.getByText('Abstract')).toBeVisible()
    await expect(page.getByText(/Learn how to build performant/)).toBeVisible()
  })

  test('should display speaker information', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify speaker section
    await expect(page.getByRole('heading', { name: 'Speaker' })).toBeVisible()
    await expect(page.getByText('Jane Speaker')).toBeVisible()
    await expect(page.getByText('speaker@example.com')).toBeVisible()
  })

  test('should display status badge', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify status badge is displayed
    await expect(page.getByText('submitted')).toBeVisible()
  })

  test('should display talk metadata in sidebar', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify metadata section
    await expect(page.getByRole('heading', { name: 'Information' })).toBeVisible()
    await expect(page.getByText('Category')).toBeVisible()
    await expect(page.getByText('Web Development')).toBeVisible()
    await expect(page.getByText('Format')).toBeVisible()
    await expect(page.getByText('Conference Talk')).toBeVisible()
    await expect(page.getByText('Language')).toBeVisible()
    await expect(page.getByText('English')).toBeVisible()
    await expect(page.getByText('Level')).toBeVisible()
    await expect(page.getByText('Intermediate')).toBeVisible()
  })

  test('should display status change options', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify status section
    await expect(page.getByRole('heading', { name: 'Status' })).toBeVisible()
    await expect(page.getByText('Quick Actions')).toBeVisible()

    // Check for quick action buttons (for submitted status)
    await expect(page.getByRole('button', { name: 'Start Review' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible()
  })

  test('should display all status options for changing status', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify all status buttons are present
    await expect(page.getByRole('button', { name: 'draft', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'submitted', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'under_review', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'accepted', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'rejected', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'confirmed', exact: true })).toBeVisible()
  })

  test('should have delete button with confirmation', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).click()

    // Verify confirmation dialog appears
    await expect(page.getByText('Are you sure you want to delete this talk?')).toBeVisible()
    await expect(page.getByText('This action cannot be undone.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete' }).nth(1)).toBeVisible()
  })

  test('should cancel delete when clicking cancel', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).first().click()

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify confirmation dialog disappears
    await expect(page.getByText('Are you sure you want to delete this talk?')).not.toBeVisible()
  })

  test('should display reviews section', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify reviews section
    await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible()
    await expect(page.getByText('Your Review')).toBeVisible()
  })

  test('should display comments section', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify comments section
    await expect(page.getByRole('heading', { name: /Internal Comments/ })).toBeVisible()
    await expect(
      page.getByText('Comments are only visible to organizers and reviewers')
    ).toBeVisible()
    await expect(page.getByPlaceholder('Add a comment...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible()
  })

  test('should navigate back to submissions list', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Click back button
    await page.locator('a[href*="/submissions"]').first().click()

    // Verify navigation back to submissions list
    await expect(page).toHaveURL(`/admin/cfp/${editionSlug}/submissions`)
  })

  test('should update talk status', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Click "Start Review" button
    await page.getByRole('button', { name: 'Start Review' }).click()

    // Wait for the page to update
    await page.waitForLoadState('networkidle')

    // Verify status changed (check for success message or updated status)
    const successMessage = page.getByText(/success|updated|changed/i)
    const underReviewBadge = page.getByText('under_review')

    await expect(successMessage.or(underReviewBadge)).toBeVisible()
  })

  test('should display existing reviews with ratings', async ({ page }) => {
    // Navigate to the SvelteKit talk which has reviews
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify reviews are displayed
    await expect(page.getByText('All Reviews')).toBeVisible()
    // The seeded data has reviews for this talk
    await expect(page.getByText(/Admin User|Bob Reviewer/)).toBeVisible()
  })
})
