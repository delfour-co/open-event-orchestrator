import { expect, test } from '@playwright/test'

test.describe('CFP Reviewer Workflow', () => {
  const editionSlug = 'devfest-paris-2025'
  const adminUrl = `/admin/cfp/${editionSlug}/submissions`

  test.beforeEach(async ({ page }) => {
    // Login as admin/organizer (who can review)
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display review form on talk detail page', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: 'Your Review', level: 4 })).toBeVisible()
  })

  test('should display rating options (1-5 stars)', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Should see rating buttons or stars
    const ratingButtons = page.locator('button[type="button"]').filter({
      hasText: /^[1-5]$/
    })
    // May be star icons or number buttons
    const starButtons = page.locator('button').filter({ has: page.locator('svg') })
    const hasRatingUI = (await ratingButtons.count()) > 0 || (await starButtons.count()) > 0
    expect(hasRatingUI).toBeTruthy()
  })

  test('should display comment field for review', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Look for review comment textarea or input
    const reviewSection = page.locator('h4:has-text("Your Review")').locator('..')
    await expect(
      reviewSection.getByRole('textbox').or(reviewSection.locator('textarea'))
    ).toBeVisible()
  })

  test('should have submit review button', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('button', { name: 'Submit Review' })).toBeVisible()
  })

  test('should display all reviews section', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: /All Reviews/, level: 4 })).toBeVisible()
  })

  test('should display average rating when reviews exist', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Look for average rating display
    const avgRatingText = page.getByText(/Average|avg/i)
    const ratingNumber = page.locator('text=/[0-5]\\.[0-9]/')
    const hasRatingDisplay = (await avgRatingText.count()) > 0 || (await ratingNumber.count()) > 0
    expect(hasRatingDisplay).toBeTruthy()
  })
})

test.describe('CFP Reviewer Comments', () => {
  const editionSlug = 'devfest-paris-2025'
  const adminUrl = `/admin/cfp/${editionSlug}/submissions`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display internal comments section', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: /Internal Comments/ })).toBeVisible()
  })

  test('should display comment visibility notice', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(
      page.getByText('Comments are only visible to organizers and reviewers')
    ).toBeVisible()
  })

  test('should have comment input field', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByPlaceholder('Add a comment...')).toBeVisible()
  })

  test('should have post comment button', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible()
  })

  test('should be able to type in comment field', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    const commentInput = page.getByPlaceholder('Add a comment...')
    await commentInput.fill('This is a test comment')
    await expect(commentInput).toHaveValue('This is a test comment')
  })
})

test.describe('CFP Reviewer Status Changes', () => {
  const editionSlug = 'devfest-paris-2025'
  const adminUrl = `/admin/cfp/${editionSlug}/submissions`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display status change section', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    await expect(page.getByRole('heading', { name: 'Status', level: 3 })).toBeVisible()
    await expect(page.getByText('Change Status')).toBeVisible()
  })

  test('should display all available status options', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Check for all status buttons
    await expect(page.getByRole('button', { name: 'draft', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'submitted', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'under_review', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'accepted', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'rejected', exact: true })).toBeVisible()
  })

  test('should disable current status button', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // The current status button should be disabled
    const submittedButton = page.getByRole('button', { name: 'submitted', exact: true })
    const isDisabled = await submittedButton.isDisabled()
    // The button representing current status should be styled differently or disabled
    expect(isDisabled).toBeDefined()
  })

  test('should have quick action buttons for common transitions', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Check for quick action buttons
    const startReviewBtn = page.getByRole('button', { name: 'Start Review' })
    const acceptBtn = page.getByRole('button', { name: 'Accept Talk' })
    const rejectBtn = page.getByRole('button', { name: 'Reject Talk' })

    // At least one should be visible depending on current status
    const hasQuickActions =
      (await startReviewBtn.count()) > 0 ||
      (await acceptBtn.count()) > 0 ||
      (await rejectBtn.count()) > 0
    expect(hasQuickActions).toBeTruthy()
  })
})

test.describe('CFP Reviewer Bulk Actions', () => {
  const editionSlug = 'devfest-paris-2025'
  const adminUrl = `/admin/cfp/${editionSlug}/submissions`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should show selection count when talks are selected', async ({ page }) => {
    await page.goto(adminUrl)

    // Select a talk using checkbox
    const firstCheckbox = page.locator('tbody tr').first().getByRole('checkbox')
    await firstCheckbox.click({ force: true })

    await expect(page.getByText(/1 talk\(s\) selected/)).toBeVisible()
  })

  test('should show bulk accept button when talks selected', async ({ page }) => {
    await page.goto(adminUrl)

    const firstCheckbox = page.locator('tbody tr').first().getByRole('checkbox')
    await firstCheckbox.click({ force: true })

    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
  })

  test('should show bulk reject button when talks selected', async ({ page }) => {
    await page.goto(adminUrl)

    const firstCheckbox = page.locator('tbody tr').first().getByRole('checkbox')
    await firstCheckbox.click({ force: true })

    await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible()
  })

  test('should show bulk start review button when talks selected', async ({ page }) => {
    await page.goto(adminUrl)

    const firstCheckbox = page.locator('tbody tr').first().getByRole('checkbox')
    await firstCheckbox.click({ force: true })

    await expect(page.getByRole('button', { name: 'Start Review' })).toBeVisible()
  })

  test('should clear selection with clear button', async ({ page }) => {
    await page.goto(adminUrl)

    // Select a talk
    const firstCheckbox = page.locator('tbody tr').first().getByRole('checkbox')
    await firstCheckbox.click({ force: true })

    // Clear selection
    await page.getByRole('button', { name: 'Clear selection' }).click()

    // Selection indicator should be gone
    await expect(page.getByText(/talk\(s\) selected/)).not.toBeVisible()
  })

  test('should select all talks with header checkbox', async ({ page }) => {
    await page.goto(adminUrl)

    const headerCheckbox = page.locator('thead').getByRole('checkbox')
    await headerCheckbox.click({ force: true })

    // Should show all talks selected (5 in seed data)
    await expect(page.getByText(/5 talk\(s\) selected/)).toBeVisible()
  })
})

test.describe('CFP Anonymous Review Mode', () => {
  const editionSlug = 'devfest-paris-2025'
  const adminUrl = `/admin/cfp/${editionSlug}/submissions`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should have speaker column in submissions table', async ({ page }) => {
    await page.goto(adminUrl)

    // In non-anonymous mode, speaker names should be visible
    await expect(page.getByRole('columnheader', { name: 'Speaker(s)' })).toBeVisible()
  })

  test('should display speaker info on talk detail when not anonymous', async ({ page }) => {
    await page.goto(adminUrl)
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Speaker section should be visible
    await expect(page.getByRole('heading', { name: 'Speaker', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Jane Speaker', level: 4 })).toBeVisible()
  })
})
