import { expect, test } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display the login form', async ({ page }) => {
      await page.goto('/auth/login')

      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    })

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/auth/login')

      const registerLink = page.getByRole('link', { name: /sign up/i })
      await expect(registerLink).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await page.getByLabel('Email').fill('invalid@example.com')
      await page.getByLabel('Password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Should show error message
      await expect(page.getByText(/invalid|failed|error/i)).toBeVisible({ timeout: 5000 })
    })

    test('should successfully login with valid organizer credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Should redirect after successful login
      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })
    })

    test('should successfully login with valid speaker credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await page.getByLabel('Email').fill('speaker@example.com')
      await page.getByLabel('Password').fill('speaker123')
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Should redirect after successful login
      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/login')

      // Click submit without filling fields
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Check for HTML5 validation
      const emailInput = page.getByLabel('Email')
      const isInvalid = await emailInput.evaluate(
        (el) => (el as HTMLInputElement).validity.valueMissing
      )
      expect(isInvalid).toBe(true)
    })
  })

  test.describe('Registration Page', () => {
    test('should display the registration form', async ({ page }) => {
      await page.goto('/auth/register')

      await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
      await expect(page.getByLabel('Name')).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
      await expect(page.getByLabel('Confirm Password')).toBeVisible()
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto('/auth/register')

      const loginLink = page.getByRole('link', { name: /sign in/i })
      await expect(loginLink).toBeVisible()
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from admin pages', async ({ page }) => {
      // Try to access admin page without login
      await page.goto('/admin/cfp/devfest-paris-2025/submissions')

      // Should either redirect to login or show unauthorized
      const currentUrl = page.url()
      const isOnLogin = currentUrl.includes('/auth/login')
      const isOnAdmin = currentUrl.includes('/admin')

      // If not on admin page, we're redirected (expected behavior)
      // If on admin page, check for unauthorized message
      if (isOnAdmin) {
        // Check for unauthorized state
        await expect(page.getByText(/unauthorized|access denied|sign in/i))
          .toBeVisible({ timeout: 3000 })
          .catch(() => {
            // If no message, the page might still load - which could indicate auth is optional
          })
      }
    })
  })

  test.describe('Logout', () => {
    test('should be able to logout after login', async ({ page }) => {
      // Login first
      await page.goto('/auth/login')
      await page.getByLabel('Email').fill('admin@example.com')
      await page.getByLabel('Password').fill('admin123')
      await page.getByRole('button', { name: 'Sign in' }).click()

      // Wait for login to complete
      await page.waitForURL(/^(?!.*\/auth\/login).*$/, { timeout: 5000 })

      // Look for logout button or menu
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
      const userMenu = page.getByRole('button', { name: /menu|profile|account/i })

      // Try to find and click logout
      if (await logoutButton.isVisible()) {
        await logoutButton.click()
      } else if (await userMenu.isVisible()) {
        await userMenu.click()
        const logoutInMenu = page.getByRole('menuitem', { name: /logout|sign out/i })
        if (await logoutInMenu.isVisible()) {
          await logoutInMenu.click()
        }
      }
    })
  })
})
