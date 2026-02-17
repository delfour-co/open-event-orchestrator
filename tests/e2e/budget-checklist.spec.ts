import { expect, test } from '@playwright/test'

test.describe('Budget Checklist', () => {
  const editionSlug = 'devfest-paris-2025'
  const checklistUrl = `/admin/budget/${editionSlug}/checklist`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Page Display
  // ==========================================================================
  test.describe('Page Display', () => {
    test('should display checklist page', async ({ page }) => {
      await page.goto(checklistUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
      await expect(page.getByText('Budget Checklist')).toBeVisible()
    })

    test('should show sub-navigation', async ({ page }) => {
      await page.goto(checklistUrl)

      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Checklist' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Profitability' })).toBeVisible()
    })

    test('should display stats cards', async ({ page }) => {
      await page.goto(checklistUrl)

      await expect(page.getByText('Total Items')).toBeVisible()
      await expect(page.getByText('Pending')).toBeVisible()
      await expect(page.getByText('Approved')).toBeVisible()
      await expect(page.getByText('Ordered')).toBeVisible()
      await expect(page.getByText('Paid')).toBeVisible()
      await expect(page.getByText('Total Estimated')).toBeVisible()
    })

    test('should show Add Item button', async ({ page }) => {
      await page.goto(checklistUrl)

      await expect(page.getByRole('button', { name: /Add Item/ })).toBeVisible()
    })

    test('should show Apply Template button', async ({ page }) => {
      await page.goto(checklistUrl)

      await expect(page.getByRole('button', { name: /Apply Template/ })).toBeVisible()
    })
  })

  // ==========================================================================
  // Checklist Item CRUD
  // ==========================================================================
  test.describe('Checklist Item CRUD', () => {
    test('should create a new checklist item', async ({ page }) => {
      await page.goto(checklistUrl)

      const itemName = `E2E Item ${Date.now()}`

      await page.getByRole('button', { name: /Add Item/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Item' })).toBeVisible()

      await page.locator('#item-name').fill(itemName)
      await page.locator('#item-amount').clear()
      await page.locator('#item-amount').fill('50000')
      await page.locator('#item-priority').selectOption('high')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify the item appears in the table
      await expect(page.locator('td', { hasText: itemName })).toBeVisible()
    })

    test('should edit an existing checklist item', async ({ page }) => {
      await page.goto(checklistUrl)

      const itemName = `EditItem ${Date.now()}`

      // Create item first
      await page.getByRole('button', { name: /Add Item/ }).click()
      await page.locator('#item-name').fill(itemName)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('td', { hasText: itemName })).toBeVisible()

      // Edit the item
      const row = page.locator('tr').filter({ hasText: itemName })
      await row
        .locator('button')
        .filter({ has: page.locator('.lucide-pencil') })
        .click()

      await expect(page.getByRole('heading', { name: 'Edit Item' })).toBeVisible()

      await page.locator('#item-status').selectOption('approved')
      await page.getByRole('button', { name: 'Update' }).click()
      await page.waitForLoadState('networkidle')

      // Verify the item still exists
      await expect(page.locator('td', { hasText: itemName })).toBeVisible()
    })

    test('should delete a checklist item', async ({ page }) => {
      await page.goto(checklistUrl)

      const itemName = `DelItem ${Date.now()}`

      // Create item first
      await page.getByRole('button', { name: /Add Item/ }).click()
      await page.locator('#item-name').fill(itemName)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('td', { hasText: itemName })).toBeVisible()

      // Delete the item
      const row = page.locator('tr').filter({ hasText: itemName })
      await row.locator('form button[type="submit"]').click()
      await page.waitForLoadState('networkidle')

      await expect(page.locator('td', { hasText: itemName })).not.toBeVisible()
    })

    test('should set item priority', async ({ page }) => {
      await page.goto(checklistUrl)

      const itemName = `PriorityItem ${Date.now()}`

      await page.getByRole('button', { name: /Add Item/ }).click()
      await page.locator('#item-name').fill(itemName)
      await page.locator('#item-priority').selectOption('high')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify high priority badge appears
      const row = page.locator('tr').filter({ hasText: itemName })
      await expect(row.locator('text=High')).toBeVisible()
    })

    test('should set item due date', async ({ page }) => {
      await page.goto(checklistUrl)

      const itemName = `DueItem ${Date.now()}`
      const dueDate = '2025-12-31'

      await page.getByRole('button', { name: /Add Item/ }).click()
      await page.locator('#item-name').fill(itemName)
      await page.locator('#item-due').fill(dueDate)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify due date appears
      const row = page.locator('tr').filter({ hasText: itemName })
      await expect(row.locator('text=2025-12-31')).toBeVisible()
    })

    test('should set item assignee', async ({ page }) => {
      await page.goto(checklistUrl)

      const itemName = `AssignItem ${Date.now()}`
      const assignee = 'John Doe'

      await page.getByRole('button', { name: /Add Item/ }).click()
      await page.locator('#item-name').fill(itemName)
      await page.locator('#item-assignee').fill(assignee)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify assignee appears
      const row = page.locator('tr').filter({ hasText: itemName })
      await expect(row.locator(`text=${assignee}`)).toBeVisible()
    })
  })

  // ==========================================================================
  // Templates
  // ==========================================================================
  test.describe('Templates', () => {
    test('should open apply template dialog', async ({ page }) => {
      await page.goto(checklistUrl)

      await page.getByRole('button', { name: /Apply Template/ }).click()

      await expect(page.getByRole('heading', { name: 'Apply Budget Template' })).toBeVisible()
    })

    test('should show template selector', async ({ page }) => {
      await page.goto(checklistUrl)

      await page.getByRole('button', { name: /Apply Template/ }).click()

      await expect(page.locator('#template-select')).toBeVisible()
    })

    test('should show multiplier input', async ({ page }) => {
      await page.goto(checklistUrl)

      await page.getByRole('button', { name: /Apply Template/ }).click()

      await expect(page.locator('#multiplier')).toBeVisible()
    })
  })

  // ==========================================================================
  // Status Workflow
  // ==========================================================================
  test.describe('Status Workflow', () => {
    test('should change item status from pending to approved', async ({ page }) => {
      await page.goto(checklistUrl)

      const itemName = `StatusItem ${Date.now()}`

      // Create item
      await page.getByRole('button', { name: /Add Item/ }).click()
      await page.locator('#item-name').fill(itemName)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify pending status
      const row = page.locator('tr').filter({ hasText: itemName })
      await expect(row.locator('text=Pending')).toBeVisible()

      // Edit to approved
      await row
        .locator('button')
        .filter({ has: page.locator('.lucide-pencil') })
        .click()
      await page.locator('#item-status').selectOption('approved')
      await page.getByRole('button', { name: 'Update' }).click()
      await page.waitForLoadState('networkidle')

      // Verify approved status
      await expect(row.locator('text=Approved')).toBeVisible()
    })
  })
})
