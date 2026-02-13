import { expect, test } from '@playwright/test'

test.describe('Quick Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin/organizer
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('should display quick setup button on dashboard', async ({ page }) => {
    await page.goto('/admin')

    const quickSetupButton = page.getByTestId('quick-setup-button')
    await expect(quickSetupButton).toBeVisible()
    await expect(quickSetupButton).toHaveText(/Quick Setup/)
  })

  test('should open wizard when clicking quick setup button', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Wizard should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Quick Setup Wizard')).toBeVisible()
    await expect(page.getByText('Step 1: Organization')).toBeVisible()
  })

  test('should close wizard when clicking close button', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByTestId('wizard-close').click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should show organization selection when organizations exist', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Should show existing organization option
    await expect(page.getByText('Use existing')).toBeVisible()
    await expect(page.getByText('Create new')).toBeVisible()
    await expect(page.getByTestId('wizard-select-org')).toBeVisible()
  })

  test('should toggle between existing and new organization', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Initially shows select dropdown
    await expect(page.getByTestId('wizard-select-org')).toBeVisible()

    // Click create new
    await page.getByLabel('Create new').click()

    // Should show organization name input
    await expect(page.getByTestId('wizard-org-name')).toBeVisible()
    await expect(page.getByTestId('wizard-org-slug')).toBeVisible()

    // Click use existing
    await page.getByLabel('Use existing').click()

    // Should show select dropdown again
    await expect(page.getByTestId('wizard-select-org')).toBeVisible()
  })

  test('should navigate through wizard steps', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Step 1: Organization - select existing
    await expect(page.getByTestId('wizard-step-organization-content')).toBeVisible()
    await page.getByTestId('wizard-next').click()

    // Step 2: Event
    await expect(page.getByTestId('wizard-step-event-content')).toBeVisible()
    await page.getByTestId('wizard-event-name').fill('Test Event')
    await page.getByTestId('wizard-next').click()

    // Step 3: Edition
    await expect(page.getByTestId('wizard-step-edition-content')).toBeVisible()
  })

  test('should go back to previous steps', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Go to step 2
    await page.getByTestId('wizard-next').click()
    await expect(page.getByTestId('wizard-step-event-content')).toBeVisible()

    // Go back to step 1
    await page.getByTestId('wizard-back').click()
    await expect(page.getByTestId('wizard-step-organization-content')).toBeVisible()
  })

  test('should auto-generate slugs from names', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Create new organization
    await page.getByLabel('Create new').click()
    await page.getByTestId('wizard-org-name').fill('My Test Organization')
    await expect(page.getByTestId('wizard-org-slug')).toHaveValue('my-test-organization')

    await page.getByTestId('wizard-next').click()

    // Event name
    await page.getByTestId('wizard-event-name').fill('Annual Conference')
    await expect(page.getByTestId('wizard-event-slug')).toHaveValue('annual-conference')

    await page.getByTestId('wizard-next').click()

    // Edition name
    await page.getByTestId('wizard-edition-name').fill('Annual Conference 2025')
    await expect(page.getByTestId('wizard-edition-slug')).toHaveValue('annual-conference-2025')
  })

  test('should disable next button when required fields are empty', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Create new org - next should be disabled without name
    await page.getByLabel('Create new').click()
    await expect(page.getByTestId('wizard-next')).toBeDisabled()

    // Fill org name - next should be enabled
    await page.getByTestId('wizard-org-name').fill('Test Org')
    await expect(page.getByTestId('wizard-next')).toBeEnabled()

    // Go to step 2 - next should be disabled without event name
    await page.getByTestId('wizard-next').click()
    await expect(page.getByTestId('wizard-next')).toBeDisabled()

    // Fill event name - next should be enabled
    await page.getByTestId('wizard-event-name').fill('Test Event')
    await expect(page.getByTestId('wizard-next')).toBeEnabled()
  })

  test('should disable submit button when required edition fields are empty', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Complete organization step (use existing)
    await page.getByTestId('wizard-next').click()

    // Complete event step
    await page.getByTestId('wizard-event-name').fill('Test Event')
    await page.getByTestId('wizard-next').click()

    // Edition step - submit should be disabled without required fields
    await expect(page.getByTestId('wizard-submit')).toBeDisabled()

    // Fill edition name
    await page.getByTestId('wizard-edition-name').fill('Test Edition 2025')

    // Still disabled - need dates
    await expect(page.getByTestId('wizard-submit')).toBeDisabled()

    // Fill dates
    await page.getByTestId('wizard-edition-start-date').fill('2025-06-01')
    await page.getByTestId('wizard-edition-end-date').fill('2025-06-03')

    // Now should be enabled
    await expect(page.getByTestId('wizard-submit')).toBeEnabled()
  })

  test('should complete wizard and create organization, event, and edition', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Step 1: Create new organization
    await page.getByLabel('Create new').click()
    const timestamp = Date.now()
    await page.getByTestId('wizard-org-name').fill(`Wizard Test Org ${timestamp}`)
    await page.getByTestId('wizard-next').click()

    // Step 2: Create event
    await page.getByTestId('wizard-event-name').fill(`Wizard Test Event ${timestamp}`)
    await page.getByTestId('wizard-next').click()

    // Step 3: Create edition
    await page.getByTestId('wizard-edition-name').fill(`Wizard Test Edition ${timestamp}`)
    await page.getByTestId('wizard-edition-start-date').fill('2025-09-15')
    await page.getByTestId('wizard-edition-end-date').fill('2025-09-17')
    await page.getByTestId('wizard-edition-venue').fill('Test Venue')
    await page.getByTestId('wizard-edition-city').fill('Test City')
    await page.getByTestId('wizard-edition-country').fill('Test Country')

    // Submit
    await page.getByTestId('wizard-submit').click()

    // Should redirect to edition settings page
    await page.waitForURL(/\/admin\/editions\/wizard-test-edition-\d+\/settings/, {
      timeout: 10000
    })
  })

  test('should complete wizard using existing organization', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Step 1: Use existing organization
    await expect(page.getByTestId('wizard-select-org')).toBeVisible()
    await page.getByTestId('wizard-next').click()

    // Step 2: Create event
    const timestamp = Date.now()
    await page.getByTestId('wizard-event-name').fill(`Quick Event ${timestamp}`)
    await page.getByTestId('wizard-next').click()

    // Step 3: Create edition
    await page.getByTestId('wizard-edition-name').fill(`Quick Edition ${timestamp}`)
    await page.getByTestId('wizard-edition-start-date').fill('2025-10-01')
    await page.getByTestId('wizard-edition-end-date').fill('2025-10-02')

    // Submit
    await page.getByTestId('wizard-submit').click()

    // Should redirect to edition settings page
    await page.waitForURL(/\/admin\/editions\/quick-edition-\d+\/settings/, { timeout: 10000 })
  })

  test('should show step indicators and allow clicking completed steps', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Step indicators should be visible
    await expect(page.getByTestId('wizard-step-organization')).toBeVisible()
    await expect(page.getByTestId('wizard-step-event')).toBeVisible()
    await expect(page.getByTestId('wizard-step-edition')).toBeVisible()

    // Go to step 2
    await page.getByTestId('wizard-next').click()
    await page.getByTestId('wizard-event-name').fill('Test Event')

    // Go to step 3
    await page.getByTestId('wizard-next').click()

    // Click on step 1 indicator to go back
    await page.getByTestId('wizard-step-organization').click()
    await expect(page.getByTestId('wizard-step-organization-content')).toBeVisible()
  })

  test('should handle validation errors gracefully', async ({ page }) => {
    await page.goto('/admin')

    await page.getByTestId('quick-setup-button').click()

    // Try to create organization with existing slug
    await page.getByLabel('Create new').click()
    await page.getByTestId('wizard-org-name').fill('Demo Conference Org')
    // Manually set the slug to match existing one
    await page.getByTestId('wizard-org-slug').fill('demo-conference-org')
    await page.getByTestId('wizard-next').click()

    // Fill event step
    await page.getByTestId('wizard-event-name').fill('Test Event')
    await page.getByTestId('wizard-next').click()

    // Fill edition step
    await page.getByTestId('wizard-edition-name').fill('Test Edition')
    await page.getByTestId('wizard-edition-start-date').fill('2025-06-01')
    await page.getByTestId('wizard-edition-end-date').fill('2025-06-02')

    // Submit - should show error for duplicate slug
    await page.getByTestId('wizard-submit').click()

    await expect(page.getByText(/already exists/i)).toBeVisible()
  })
})
