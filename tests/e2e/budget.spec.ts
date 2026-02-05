import { expect, test } from '@playwright/test'

test.describe('Budget Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const budgetUrl = `/admin/budget/${editionSlug}`
  const settingsUrl = `${budgetUrl}/settings`

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('Email').fill('admin@example.com')
    await page.getByLabel('Password').fill('admin123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  // ==========================================================================
  // Budget Edition Selector
  // ==========================================================================
  test.describe('Budget Edition Selector', () => {
    test('should display budget page with editions', async ({ page }) => {
      await page.goto('/admin/budget')

      await expect(page.getByRole('heading', { name: 'Budget' })).toBeVisible()
      await expect(page.getByText('DevFest Paris 2025')).toBeVisible()
    })

    test('should navigate to edition budget dashboard', async ({ page }) => {
      await page.goto('/admin/budget')

      await page.getByRole('link', { name: /Manage Budget/ }).click()

      await expect(page).toHaveURL(budgetUrl)
    })

    test('should show edition status badge', async ({ page }) => {
      await page.goto('/admin/budget')

      await expect(page.locator('text=published').or(page.locator('text=draft'))).toBeVisible()
    })

    test('should show settings icon on edition card', async ({ page }) => {
      await page.goto('/admin/budget')

      await expect(page.locator('a[title="Budget Settings"]')).toBeVisible()
    })
  })

  // ==========================================================================
  // Budget Dashboard
  // ==========================================================================
  test.describe('Budget Dashboard', () => {
    test('should display budget dashboard for edition', async ({ page }) => {
      await page.goto(budgetUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
    })

    test('should show stats cards', async ({ page }) => {
      await page.goto(budgetUrl)

      await expect(page.getByRole('heading', { name: 'Total Budget' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Income' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Balance' })).toBeVisible()
    })

    test('should show budget status badge', async ({ page }) => {
      await page.goto(budgetUrl)

      await expect(
        page.locator('text=approved').or(page.locator('text=draft')).or(page.locator('text=closed'))
      ).toBeVisible()
    })

    test('should show settings link', async ({ page }) => {
      await page.goto(budgetUrl)

      const settingsLink = page.locator(`a[href="${settingsUrl}"]`).first()
      await expect(settingsLink).toBeVisible()
    })

    test('should display seeded categories in table', async ({ page }) => {
      await page.goto(budgetUrl)

      await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible()

      // Table headers
      const categoriesTable = page.locator('table').first()
      await expect(categoriesTable.locator('th', { hasText: 'Category' })).toBeVisible()
      await expect(categoriesTable.locator('th', { hasText: 'Planned' })).toBeVisible()
      await expect(categoriesTable.locator('th', { hasText: 'Spent' })).toBeVisible()
      await expect(categoriesTable.locator('th', { hasText: 'Remaining' })).toBeVisible()

      // Seeded categories in table rows
      await expect(categoriesTable.locator('td', { hasText: 'Venue' })).toBeVisible()
      await expect(categoriesTable.locator('td', { hasText: 'Catering' })).toBeVisible()
      await expect(categoriesTable.locator('td', { hasText: 'Marketing' })).toBeVisible()
    })

    test('should display seeded transactions in table', async ({ page }) => {
      await page.goto(budgetUrl)

      await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()

      // Transaction table (second table on the page)
      const txTable = page.locator('table').nth(1)
      await expect(txTable.locator('th', { hasText: 'Description' })).toBeVisible()
      await expect(txTable.locator('th', { hasText: 'Amount' })).toBeVisible()
      await expect(txTable.locator('th', { hasText: 'Status' })).toBeVisible()

      // Seeded transactions
      await expect(txTable.locator('td', { hasText: 'Venue deposit' })).toBeVisible()
      await expect(txTable.locator('td', { hasText: 'Gold sponsor - TechCorp' })).toBeVisible()
    })
  })

  // ==========================================================================
  // Budget Settings
  // ==========================================================================
  test.describe('Budget Settings', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByRole('heading', { name: 'Budget Settings' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Budget Status' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Budget Details' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Related Settings' })).toBeVisible()
    })

    test('should show current status with buttons', async ({ page }) => {
      await page.goto(settingsUrl)

      await expect(page.getByText('Current status:')).toBeVisible()
      await expect(page.getByRole('button', { name: 'draft' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'approved' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'closed' })).toBeVisible()
    })

    test('should update budget details', async ({ page }) => {
      await page.goto(settingsUrl)

      const notesField = page.locator('#bg-notes')
      await notesField.clear()
      await notesField.fill('Updated via E2E test')

      await page.getByRole('button', { name: /Save Settings/ }).click()
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Budget settings saved successfully')).toBeVisible()
    })

    test('should navigate back to dashboard', async ({ page }) => {
      await page.goto(settingsUrl)

      await page.getByRole('link', { name: 'Budget Dashboard' }).click()

      await expect(page).toHaveURL(budgetUrl)
    })
  })

  // ==========================================================================
  // Category CRUD
  // ==========================================================================
  test.describe('Category CRUD', () => {
    test('should create a new category', async ({ page }) => {
      await page.goto(budgetUrl)

      const categoryName = `E2E Cat ${Date.now()}`

      await page.getByRole('button', { name: /Add Category/ }).click()

      // Wait for dialog heading
      await expect(page.getByRole('heading', { name: 'Add Category' })).toBeVisible()

      await page.locator('#cat-name').fill(categoryName)
      await page.locator('#cat-planned').clear()
      await page.locator('#cat-planned').fill('3000')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      // Verify the new category appears in table
      const categoriesTable = page.locator('table').first()
      await expect(categoriesTable.locator('td', { hasText: categoryName })).toBeVisible()
    })

    test('should edit an existing category', async ({ page }) => {
      await page.goto(budgetUrl)

      const categoryName = `EditCat ${Date.now()}`

      // Create a category first
      await page.getByRole('button', { name: /Add Category/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Category' })).toBeVisible()
      await page.locator('#cat-name').fill(categoryName)
      await page.locator('#cat-planned').clear()
      await page.locator('#cat-planned').fill('1000')
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      const categoriesTable = page.locator('table').first()
      await expect(categoriesTable.locator('td', { hasText: categoryName })).toBeVisible()

      // Click edit button on the category row
      const row = categoriesTable.locator('tr').filter({ hasText: categoryName })
      await row
        .locator('button')
        .filter({ has: page.locator('.lucide-pencil') })
        .click()

      await expect(page.getByRole('heading', { name: 'Edit Category' })).toBeVisible()

      await page.locator('#cat-planned').clear()
      await page.locator('#cat-planned').fill('5000')

      await page.getByRole('button', { name: 'Update' }).click()
      await page.waitForLoadState('networkidle')

      await expect(categoriesTable.locator('td', { hasText: categoryName })).toBeVisible()
    })

    test('should delete a category with no transactions', async ({ page }) => {
      await page.goto(budgetUrl)

      const categoryName = `DelCat ${Date.now()}`

      // Create a category to delete
      await page.getByRole('button', { name: /Add Category/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Category' })).toBeVisible()
      await page.locator('#cat-name').fill(categoryName)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      const categoriesTable = page.locator('table').first()
      await expect(categoriesTable.locator('td', { hasText: categoryName })).toBeVisible()

      // Click delete button on the category row
      const row = categoriesTable.locator('tr').filter({ hasText: categoryName })
      await row.locator('form button[type="submit"]').click()
      await page.waitForLoadState('networkidle')

      await expect(categoriesTable.locator('td', { hasText: categoryName })).not.toBeVisible()
    })
  })

  // ==========================================================================
  // Transaction CRUD
  // ==========================================================================
  test.describe('Transaction CRUD', () => {
    test('should create a new expense transaction', async ({ page }) => {
      await page.goto(budgetUrl)

      const description = `E2E Expense ${Date.now()}`

      await page.getByRole('button', { name: /Add Transaction/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible()

      await page.locator('#tx-category').selectOption({ index: 0 })
      await page.locator('#tx-type').selectOption('expense')
      await page.locator('#tx-amount').fill('150.50')
      await page.locator('#tx-description').fill(description)
      await page.locator('#tx-vendor').fill('Test Vendor')
      await page.locator('#tx-status').selectOption('paid')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      const txTable = page.locator('table').nth(1)
      await expect(txTable.locator('td', { hasText: description })).toBeVisible()
    })

    test('should create an income transaction', async ({ page }) => {
      await page.goto(budgetUrl)

      const description = `E2E Income ${Date.now()}`

      await page.getByRole('button', { name: /Add Transaction/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible()

      await page.locator('#tx-category').selectOption({ index: 0 })
      await page.locator('#tx-type').selectOption('income')
      await page.locator('#tx-amount').fill('5000')
      await page.locator('#tx-description').fill(description)
      await page.locator('#tx-vendor').fill('Sponsor Corp')
      await page.locator('#tx-status').selectOption('paid')

      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      const txTable = page.locator('table').nth(1)
      await expect(txTable.locator('td', { hasText: description })).toBeVisible()
    })

    test('should edit an existing transaction', async ({ page }) => {
      await page.goto(budgetUrl)

      const description = `EditTx ${Date.now()}`

      // Create a transaction first
      await page.getByRole('button', { name: /Add Transaction/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible()
      await page.locator('#tx-category').selectOption({ index: 0 })
      await page.locator('#tx-amount').fill('200')
      await page.locator('#tx-description').fill(description)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      const txTable = page.locator('table').nth(1)
      await expect(txTable.locator('td', { hasText: description })).toBeVisible()

      // Click edit button on the transaction row
      const row = txTable.locator('tr').filter({ hasText: description })
      await row
        .locator('button')
        .filter({ has: page.locator('.lucide-pencil') })
        .click()

      await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible()

      await page.locator('#tx-amount').clear()
      await page.locator('#tx-amount').fill('350')

      await page.getByRole('button', { name: 'Update' }).click()
      await page.waitForLoadState('networkidle')

      await expect(txTable.locator('td', { hasText: description })).toBeVisible()
    })

    test('should delete a transaction', async ({ page }) => {
      await page.goto(budgetUrl)

      const description = `DelTx ${Date.now()}`

      // Create a transaction to delete
      await page.getByRole('button', { name: /Add Transaction/ }).click()
      await expect(page.getByRole('heading', { name: 'Add Transaction' })).toBeVisible()
      await page.locator('#tx-category').selectOption({ index: 0 })
      await page.locator('#tx-amount').fill('100')
      await page.locator('#tx-description').fill(description)
      await page.getByRole('button', { name: 'Create' }).click()
      await page.waitForLoadState('networkidle')

      const txTable = page.locator('table').nth(1)
      await expect(txTable.locator('td', { hasText: description })).toBeVisible()

      // Click delete button on the transaction row
      const row = txTable.locator('tr').filter({ hasText: description })
      await row.locator('form button[type="submit"]').click()
      await page.waitForLoadState('networkidle')

      await expect(txTable.locator('td', { hasText: description })).not.toBeVisible()
    })
  })

  // ==========================================================================
  // Access Control
  // ==========================================================================
  test.describe('Access Control', () => {
    test('should require authentication', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(budgetUrl)

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should deny speaker access to budget pages with 403', async ({ page }) => {
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('speaker@example.com')
      await page.getByLabel('Password').fill('speaker123')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })

      const response = await page.goto(budgetUrl)

      expect(response?.status()).toBe(403)
      await expect(page.getByText(/access denied|forbidden/i)).toBeVisible()
    })
  })
})
