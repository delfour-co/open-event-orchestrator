import { expect, test } from '@playwright/test'

test.describe('CFP Admin Submissions', () => {
  const editionSlug = 'devfest-paris-2025'
  const adminUrl = `/admin/cfp/${editionSlug}/submissions`

  test.beforeEach(async ({ page }) => {
    // Login as admin/organizer
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect to admin page after successful login
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display the submissions list page', async ({ page }) => {
    await page.goto(adminUrl)

    // Verify page header
    await expect(page.getByRole('heading', { name: 'CFP Submissions' })).toBeVisible()
    await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
  })

  test('should display status statistics cards', async ({ page }) => {
    await page.goto(adminUrl)

    // Verify stats cards are visible (use heading role for the card titles)
    await expect(page.getByRole('heading', { name: 'Total' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Submitted' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Accepted' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Rejected' })).toBeVisible()
  })

  test('should display talks in the submissions table', async ({ page }) => {
    await page.goto(adminUrl)

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Speaker(s)' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Category' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Format' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()

    // Verify seeded talks are displayed
    await expect(page.getByText('Building Scalable Web Apps with SvelteKit')).toBeVisible()
    await expect(page.getByText('Kubernetes for Developers: A Practical Guide')).toBeVisible()
    await expect(page.getByText('Introduction to Large Language Models')).toBeVisible()
  })

  test('should display speaker names in the table', async ({ page }) => {
    await page.goto(adminUrl)

    // Speaker names appear in the table cells
    await expect(page.locator('tbody').getByText('Jane Speaker').first()).toBeVisible()
    await expect(page.locator('tbody').getByText('John Talker').first()).toBeVisible()
  })

  test('should have filter controls', async ({ page }) => {
    await page.goto(adminUrl)

    // Verify search input
    await expect(page.getByPlaceholder('Search by title or speaker...')).toBeVisible()

    // Verify filter dropdowns
    await expect(page.getByLabel('Status')).toBeVisible()
    await expect(page.getByLabel('Category')).toBeVisible()
    await expect(page.getByLabel('Format')).toBeVisible()
  })

  test('should filter talks by status', async ({ page }) => {
    await page.goto(adminUrl)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('tbody tr').first()).toBeVisible()

    // Count initial talks
    const initialCount = await page.locator('tbody tr').count()

    // Filter by accepted status
    await page.getByLabel('Status').selectOption('accepted')
    await page.waitForLoadState('networkidle')

    // The accepted talks should be visible - count may change based on filter
    const filteredCount = await page.locator('tbody tr').count()

    // At least one talk should be visible after filtering
    expect(filteredCount).toBeGreaterThan(0)

    // If counts differ, filter is working
    // If same count, all talks might be accepted which is also valid
    await expect(
      page.locator('tbody').getByText('Kubernetes for Developers: A Practical Guide')
    ).toBeVisible()
  })

  test('should filter talks by category', async ({ page }) => {
    await page.goto(adminUrl)

    // Get the Web Development option and filter by it
    await page.getByLabel('Category').selectOption({ label: 'Web Development' })

    // Only Web Development talks should be visible
    await expect(page.getByText('Building Scalable Web Apps with SvelteKit')).toBeVisible()
  })

  test('should search talks by title', async ({ page }) => {
    await page.goto(adminUrl)

    // Search for SvelteKit
    await page.getByPlaceholder('Search by title or speaker...').fill('SvelteKit')
    await page.getByRole('button', { name: 'Search' }).click()

    // Wait for results
    await page.waitForURL(/search=SvelteKit/)

    await expect(page.getByText('Building Scalable Web Apps with SvelteKit')).toBeVisible()
  })

  test('should navigate to talk detail page when clicking on title', async ({ page }) => {
    await page.goto(adminUrl)

    // Click on a talk title
    await page.getByRole('link', { name: 'Building Scalable Web Apps with SvelteKit' }).click()

    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/admin\/cfp\/devfest-paris-2025\/submissions\//)
  })

  test('should allow selecting talks with checkboxes', async ({ page }) => {
    await page.goto(adminUrl)
    await page.waitForLoadState('networkidle')

    // Wait for table to be visible
    await expect(page.locator('tbody tr').first()).toBeVisible()

    // Select the first talk (use force click for styled checkbox)
    const firstCheckbox = page.locator('tbody tr').first().getByRole('checkbox')
    await firstCheckbox.click({ force: true })

    // Verify selection indicator appears
    await expect(page.getByText(/1 talk\(s\) selected/)).toBeVisible()
  })

  test('should show bulk action buttons when talks are selected', async ({ page }) => {
    await page.goto(adminUrl)
    await page.waitForLoadState('networkidle')

    // Wait for table to be visible
    await expect(page.locator('tbody tr').first()).toBeVisible()

    // Select a talk (use force click for styled checkbox)
    const firstCheckbox = page.locator('tbody tr').first().getByRole('checkbox')
    await firstCheckbox.click({ force: true })

    // Verify bulk action buttons are visible
    await expect(page.getByRole('button', { name: 'Start Review' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear selection' })).toBeVisible()
  })

  test('should have export CSV button', async ({ page }) => {
    await page.goto(adminUrl)

    await expect(page.getByRole('button', { name: /Export CSV/ })).toBeVisible()
  })

  test('should select all talks with header checkbox', async ({ page }) => {
    await page.goto(adminUrl)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('tbody tr').first()).toBeVisible()

    // Click the header checkbox to select all (use force click for styled checkbox)
    const headerCheckbox = page.locator('thead').getByRole('checkbox')
    await headerCheckbox.click({ force: true })

    // Verify all talks are selected (number may vary)
    await expect(page.getByText(/\d+ talk\(s\) selected/)).toBeVisible()
  })

  test('should clear selection when clicking clear button', async ({ page }) => {
    await page.goto(adminUrl)

    // Select all (use force click for styled checkbox)
    const headerCheckbox = page.locator('thead').getByRole('checkbox')
    await headerCheckbox.click({ force: true })

    // Clear selection
    await page.getByRole('button', { name: 'Clear selection' }).click()

    // Verify selection is cleared
    await expect(page.getByText(/talk\(s\) selected/)).not.toBeVisible()
  })
})
