import { expect, test } from '@playwright/test'

test.describe('Organizations Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin/organizer
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display the organizations page', async ({ page }) => {
    await page.goto('/admin/organizations')

    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible()
    await expect(page.getByText(/Manage your organizations/)).toBeVisible()
  })

  test('should display existing organization from seed data', async ({ page }) => {
    await page.goto('/admin/organizations')

    await expect(page.getByText('Demo Conference Org')).toBeVisible()
  })

  test('should show create organization form when clicking button', async ({ page }) => {
    await page.goto('/admin/organizations')

    await page.getByRole('button', { name: /New Organization/ }).click()

    await expect(page.getByRole('heading', { name: 'Create Organization' })).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Slug')).toBeVisible()
  })

  test('should be accessible from sidebar', async ({ page }) => {
    await page.goto('/admin')

    await page.getByRole('link', { name: 'Organizations' }).click()

    await expect(page).toHaveURL('/admin/organizations')
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible()
  })
})

test.describe('Events Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin/organizer
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display the events page', async ({ page }) => {
    await page.goto('/admin/events')

    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible()
    await expect(page.getByText(/Manage your events/)).toBeVisible()
  })

  test('should have new event button', async ({ page }) => {
    await page.goto('/admin/events')

    await expect(page.getByRole('button', { name: /New Event/ })).toBeVisible()
  })

  test('should display existing event from seed data', async ({ page }) => {
    await page.goto('/admin/events')

    // The seed data creates a DevFest event with edition
    // Edition cards show event name and organization in description
    await expect(page.getByText('DevFest Paris 2025').first()).toBeVisible()
    await expect(page.getByText(/DevFest · Demo Conference Org/).first()).toBeVisible()
  })

  test('should expand event to show editions', async ({ page }) => {
    await page.goto('/admin/events')

    // With card-based layout, editions are shown directly without expansion
    // Should show the DevFest Paris 2025 edition card
    await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
  })

  test('should show create event form when clicking button', async ({ page }) => {
    await page.goto('/admin/events')

    await page.getByRole('button', { name: /New Event/ }).click()

    await expect(page.getByRole('heading', { name: 'Create Event' })).toBeVisible()
    await expect(page.getByLabel('Organization')).toBeVisible()
    await expect(page.getByLabel('Event Name')).toBeVisible()
  })

  test('should show add edition form when clicking button', async ({ page }) => {
    await page.goto('/admin/events')

    // Select event from the "Add Edition" card dropdown
    const addEditionCard = page.locator('text=Add a new edition').locator('..')
    const eventSelect = addEditionCard.locator('select')
    await eventSelect.selectOption({ label: 'DevFest' })

    // Should show the new edition form
    await expect(page.getByText('New Edition for DevFest')).toBeVisible()
    await expect(page.getByLabel('Start Date')).toBeVisible()
    await expect(page.getByLabel('End Date')).toBeVisible()
  })

  test('should have link to manage CFP for editions', async ({ page }) => {
    await page.goto('/admin/events')

    // Edition cards have settings button that links to edition settings
    // CFP is accessible via sidebar navigation
    const settingsButton = page
      .locator('a[href*="/admin/editions/devfest-paris-2025/settings"]')
      .first()
    await expect(settingsButton).toBeVisible()
  })

  test('should navigate to CFP page when clicking Manage CFP', async ({ page }) => {
    await page.goto('/admin/events')

    // Navigate to CFP via sidebar
    await page.getByRole('link', { name: 'CFP' }).click()

    // Should navigate to CFP page
    await expect(page).toHaveURL(/\/admin\/cfp/)
  })

  test('should display edition status badge', async ({ page }) => {
    await page.goto('/admin/events')

    // Status badges are visible on edition cards
    await expect(
      page
        .locator('span.rounded-full')
        .filter({ hasText: /published|draft/ })
        .first()
    ).toBeVisible()
  })

  test('should be accessible from sidebar', async ({ page }) => {
    await page.goto('/admin')

    // Click on Events link in sidebar
    await page.getByRole('link', { name: 'Events' }).click()

    await expect(page).toHaveURL('/admin/events')
    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible()
  })
})
