import { expect, test } from '@playwright/test'

test.describe('Billing Public Module', () => {
  const editionSlug = 'devfest-paris-2025'
  const ticketsUrl = `/tickets/${editionSlug}`

  test.describe('Ticket Selection Page', () => {
    test('should display ticket selection page without auth', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      await expect(page.getByRole('heading', { name: 'DevFest Paris 2025' })).toBeVisible()
      await expect(page.getByText('Select your tickets below')).toBeVisible()
    })

    test('should show edition venue information', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      await expect(page.getByText(/Palais des Congres|Paris/).first()).toBeVisible()
    })

    test('should display active ticket types', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Seeded ticket types should be visible
      await expect(page.getByText('Early Bird').first()).toBeVisible()
      await expect(page.getByText('Standard').first()).toBeVisible()
      await expect(page.getByText('VIP').first()).toBeVisible()
      await expect(page.getByText('Student').first()).toBeVisible()
    })

    test('should display prices', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Should show "Free" for student tickets
      await expect(page.getByText('Free').first()).toBeVisible()
    })

    test('should increment and decrement ticket quantity', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Find the Student ticket card and click the + button
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Quantity should show 1
      await expect(studentCard.getByText('1')).toBeVisible()

      // Click + again
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Quantity should show 2
      await expect(studentCard.getByText('2')).toBeVisible()

      // Click - to decrement
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-minus') })
        .click()

      // Quantity should show 1 again
      await expect(studentCard.locator('span.text-center', { hasText: '1' })).toBeVisible()
    })

    test('should show cart summary when tickets are selected', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select a ticket
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Cart summary should appear at the bottom
      await expect(page.getByText('Continue to Checkout')).toBeVisible()
      await expect(page.getByText('1 ticket')).toBeVisible()
    })

    test('should navigate to checkout with selected tickets', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select a student (free) ticket
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Click Continue to Checkout
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      // Should navigate to checkout page with ticket params in URL
      await expect(page).toHaveURL(/\/checkout\?/)
    })
  })

  test.describe('Checkout Page', () => {
    test('should display checkout form', async ({ page }) => {
      await page.context().clearCookies()
      // Navigate to checkout with a student ticket
      await page.goto(ticketsUrl)

      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      await expect(page).toHaveURL(/\/checkout\?/)

      // Verify form fields
      await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
      await expect(page.getByLabel('First Name *')).toBeVisible()
      await expect(page.getByLabel('Last Name *')).toBeVisible()
      await expect(page.getByLabel('Email *')).toBeVisible()
    })

    test('should display order summary', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      // Order summary should show selected items
      await expect(page.getByText('Order Summary')).toBeVisible()
      await expect(page.getByText('Student').first()).toBeVisible()
      await expect(page.getByText('x1')).toBeVisible()
    })

    test('should show "Confirm Registration" for free tickets', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      // For free tickets, button should say "Confirm Registration"
      await expect(page.getByRole('button', { name: /Confirm Registration/ })).toBeVisible()
    })

    test('should redirect to selection if no tickets in URL params', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(`${ticketsUrl}/checkout`)

      // Should redirect back to ticket selection
      await expect(page).toHaveURL(ticketsUrl)
    })
  })

  test.describe('Free Checkout Flow', () => {
    test('should complete free checkout and show confirmation', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select student (free) ticket
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Go to checkout
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()
      await expect(page).toHaveURL(/\/checkout\?/)

      // Fill in attendee info
      await page.getByLabel('First Name *').fill('Test')
      await page.getByLabel('Last Name *').fill('User')
      await page.getByLabel('Email *').fill(`test-${Date.now()}@example.com`)

      // Submit
      await page.getByRole('button', { name: /Confirm Registration/ }).click()

      // Should redirect to confirmation page
      await page.waitForURL(/\/confirmation\?order=/, { timeout: 15000 })

      // Verify confirmation page
      await expect(page.getByText('Order Confirmed')).toBeVisible()
      await expect(page.getByText('Test User').first()).toBeVisible()
    })

    test('should display order details on confirmation', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select student (free) ticket
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Go to checkout
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      // Fill in attendee info
      const email = `test-details-${Date.now()}@example.com`
      await page.getByLabel('First Name *').fill('Jane')
      await page.getByLabel('Last Name *').fill('Doe')
      await page.getByLabel('Email *').fill(email)

      // Submit
      await page.getByRole('button', { name: /Confirm Registration/ }).click()
      await page.waitForURL(/\/confirmation\?order=/, { timeout: 15000 })

      // Order Details
      await expect(page.getByText('Order Details')).toBeVisible()
      await expect(page.getByText('Jane Doe').first()).toBeVisible()
      await expect(page.getByText(email).first()).toBeVisible()
      await expect(page.getByText('Student').first()).toBeVisible()
    })

    test('should show tickets with QR codes on confirmation', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select student (free) ticket
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Go to checkout
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      // Fill in attendee info
      await page.getByLabel('First Name *').fill('QR')
      await page.getByLabel('Last Name *').fill('Test')
      await page.getByLabel('Email *').fill(`test-qr-${Date.now()}@example.com`)

      // Submit
      await page.getByRole('button', { name: /Confirm Registration/ }).click()
      await page.waitForURL(/\/confirmation\?order=/, { timeout: 15000 })

      // Should show Your Tickets section
      await expect(page.getByText('Your Tickets').first()).toBeVisible()

      // Should have a ticket with Valid status
      await expect(page.getByText('Valid')).toBeVisible()

      // Should show QR code image
      const qrImage = page.locator('img[alt*="QR Code"]')
      await expect(qrImage).toBeVisible()
    })

    test('should show "Buy More Tickets" link on confirmation', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select student (free) ticket
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Go to checkout
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      // Fill in attendee info
      await page.getByLabel('First Name *').fill('More')
      await page.getByLabel('Last Name *').fill('Tickets')
      await page.getByLabel('Email *').fill(`test-more-${Date.now()}@example.com`)

      // Submit
      await page.getByRole('button', { name: /Confirm Registration/ }).click()
      await page.waitForURL(/\/confirmation\?order=/, { timeout: 15000 })

      // Should have a link back to ticket selection
      await expect(page.getByText('Buy More Tickets')).toBeVisible()
    })
  })

  test.describe('Multiple Tickets', () => {
    test('should handle multiple free tickets', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select 2 student (free) tickets
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Cart should show 2 tickets
      await expect(page.getByText('2 tickets')).toBeVisible()

      // Go to checkout
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()

      // Fill in attendee info
      await page.getByLabel('First Name *').fill('Multi')
      await page.getByLabel('Last Name *').fill('Ticket')
      await page.getByLabel('Email *').fill(`test-multi-${Date.now()}@example.com`)

      // Submit
      await page.getByRole('button', { name: /Confirm Registration/ }).click()
      await page.waitForURL(/\/confirmation\?order=/, { timeout: 15000 })

      // Should show 2 tickets on confirmation
      await expect(page.getByText('Order Confirmed')).toBeVisible()
      await expect(page.getByText('x2')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should require all attendee fields', async ({ page }) => {
      await page.context().clearCookies()
      await page.goto(ticketsUrl)

      // Select a ticket
      const studentCard = page.locator('[class*="card"]').filter({ hasText: 'Student' })
      await studentCard
        .locator('button')
        .filter({ has: page.locator('.lucide-plus') })
        .click()

      // Go to checkout
      await page.getByRole('button', { name: /Continue to Checkout/ }).click()
      await expect(page).toHaveURL(/\/checkout\?/)

      // Try to submit without filling fields
      await page.getByRole('button', { name: /Confirm Registration/ }).click()

      // HTML5 validation should prevent submission
      const firstNameInput = page.getByLabel('First Name *')
      const isInvalid = await firstNameInput.evaluate(
        (el) => (el as HTMLInputElement).validity.valueMissing
      )
      expect(isInvalid).toBe(true)
    })

    test('should return 404 for non-existent edition', async ({ page }) => {
      await page.context().clearCookies()
      const response = await page.goto('/tickets/non-existent-edition')

      expect(response?.status()).toBe(404)
    })
  })
})
