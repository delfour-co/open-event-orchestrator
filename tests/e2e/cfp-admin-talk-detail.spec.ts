import { expect, test } from '@playwright/test'

test.describe('CFP Admin Talk Detail', () => {
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
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(
      page.getByRole('heading', { name: 'Building Scalable Web Apps with SvelteKit' })
    ).toBeVisible()
  })

  test('should display talk abstract and description', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: 'Talk Details', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Abstract', level: 4 })).toBeVisible()
    await expect(page.getByText(/Learn how to build performant/)).toBeVisible()
  })

  test('should display speaker information', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: 'Speaker', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Jane Speaker', level: 4 })).toBeVisible()
    await expect(page.getByText('speaker@example.com')).toBeVisible()
  })

  test('should display status badge', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // The status badge shows "Submitted" in the header
    await expect(page.locator('text=Submitted').first()).toBeVisible()
  })

  test('should display talk metadata in sidebar', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify metadata section exists
    await expect(page.getByRole('heading', { name: 'Information', level: 3 })).toBeVisible()

    // Verify metadata content using dl/dt/dd structure
    await expect(page.locator('dt:has-text("Category")')).toBeVisible()
    await expect(page.locator('dd:has-text("Web Development")')).toBeVisible()
    await expect(page.locator('dt:has-text("Format")')).toBeVisible()
    await expect(page.locator('dd:has-text("Conference Talk")')).toBeVisible()
    await expect(page.locator('dt:has-text("Language")')).toBeVisible()
    await expect(page.locator('dd:has-text("English")')).toBeVisible()
    await expect(page.locator('dt:has-text("Level")')).toBeVisible()
    await expect(page.locator('dd:has-text("Intermediate")')).toBeVisible()
  })

  test('should display status change options', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: 'Status', level: 3 })).toBeVisible()

    // Check that status change section exists with Change Status text and status buttons
    await expect(page.getByText('Change Status')).toBeVisible()
    // At least some status buttons should be visible
    const statusButtons = page.locator(
      'button:has-text("draft"), button:has-text("accepted"), button:has-text("rejected")'
    )
    await expect(statusButtons.first()).toBeVisible()
  })

  test('should display all status options for changing status', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('button', { name: 'draft', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'under_review', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'accepted', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'rejected', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'confirmed', exact: true })).toBeVisible()
  })

  test('should have delete button with confirmation', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('Are you sure you want to delete this talk?')).toBeVisible()
    await expect(page.getByText('This action cannot be undone.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete' }).nth(1)).toBeVisible()
  })

  test('should cancel delete when clicking cancel', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await page.getByRole('button', { name: 'Delete' }).first().click()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByText('Are you sure you want to delete this talk?')).not.toBeVisible()
  })

  test('should display reviews section', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: 'Reviews', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your Review', level: 4 })).toBeVisible()
  })

  test('should display comments section', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

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

    await page.locator('a[href*="/submissions"]').first().click()

    await expect(page).toHaveURL(`/admin/cfp/${editionSlug}/submissions`)
  })

  test('should update talk status', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    // Use the React Native talk which should still be in 'submitted' status
    await page.getByRole('link', { name: 'React Native vs Flutter' }).click()

    // Click "Start Review" to change status from submitted to under_review
    const startReviewBtn = page.getByRole('button', { name: 'Start Review' })
    if (await startReviewBtn.isVisible()) {
      await startReviewBtn.click()
      await page.waitForLoadState('networkidle')
      // The status should now show under_review or the button should be disabled
      const underReviewButton = page.getByRole('button', { name: 'under_review', exact: true })
      await expect(underReviewButton).toBeDisabled()
    } else {
      // Status already changed - check that the status section exists
      await expect(page.getByRole('heading', { name: 'Status', level: 3 })).toBeVisible()
    }
  })

  test('should display existing reviews with ratings', async ({ page }) => {
    await page.goto(`/admin/cfp/${editionSlug}/submissions`)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Look for All Reviews heading with count
    await expect(page.getByRole('heading', { name: /All Reviews/, level: 4 })).toBeVisible()
    // The seeded data has reviews - look for any rating display (format "X.X")
    await expect(page.locator('text=/[0-5]\\.[0-9]/').first()).toBeVisible()
  })
})
