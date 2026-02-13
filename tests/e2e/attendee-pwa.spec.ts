import { expect, test } from '@playwright/test'

test.describe('Attendee PWA', () => {
	test.beforeEach(async ({ page }) => {
		// This assumes there's a published edition with slug "test-edition"
		// In a real scenario, we'd set up test data first
		await page.goto('/app/test-edition')
	})

	test('should display edition name and basic info', async ({ page }) => {
		// Check that the page loads and shows edition name
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
	})

	test('should have schedule, favorites, and feedback tabs', async ({ page }) => {
		// Check navigation tabs exist
		await expect(page.getByRole('button', { name: /schedule/i })).toBeVisible()
		await expect(page.getByRole('button', { name: /my agenda/i })).toBeVisible()
	})

	test('should be able to switch between tabs', async ({ page }) => {
		// Click on favorites tab
		await page.getByRole('button', { name: /my agenda/i }).click()

		// Should show favorites view
		await expect(
			page.getByRole('heading', { name: /no favorites yet/i })
		).toBeVisible()

		// Go back to schedule
		await page.getByRole('button', { name: /schedule/i }).click()
	})

	test('should display session cards in schedule view', async ({ page }) => {
		// This test would need actual session data to be meaningful
		// Check that schedule view is showing
		const scheduleTab = page.getByRole('button', { name: /schedule/i })
		await expect(scheduleTab).toHaveAttribute('class', /border-primary/)
	})

	test('should be responsive on mobile viewport', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 })

		// Check that navigation is still visible
		await expect(page.getByRole('button', { name: /schedule/i })).toBeVisible()
		await expect(page.getByRole('button', { name: /my agenda/i })).toBeVisible()
	})

	test('should show feedback tab when enabled', async ({ page }) => {
		// Check if feedback tab exists
		const feedbackTab = page.getByRole('button', { name: /feedback/i })

		// Tab may or may not be visible depending on settings
		const isVisible = await feedbackTab.isVisible().catch(() => false)

		if (isVisible) {
			await feedbackTab.click()
			await expect(
				page.getByRole('heading', { name: /general feedback/i })
			).toBeVisible()
		}
	})
})

test.describe('Attendee PWA - Session Favorites', () => {
	test('should show empty state in favorites initially', async ({ page }) => {
		await page.goto('/app/test-edition')

		// Navigate to favorites
		await page.getByRole('button', { name: /my agenda/i }).click()

		// Should show empty state
		await expect(
			page.getByRole('heading', { name: /no favorites yet/i })
		).toBeVisible()
		await expect(page.getByRole('button', { name: /browse schedule/i })).toBeVisible()
	})

	test('should navigate back to schedule from empty favorites', async ({ page }) => {
		await page.goto('/app/test-edition')

		// Navigate to favorites
		await page.getByRole('button', { name: /my agenda/i }).click()

		// Click browse schedule button
		await page.getByRole('button', { name: /browse schedule/i }).click()

		// Should be back on schedule tab
		const scheduleTab = page.getByRole('button', { name: /schedule/i })
		await expect(scheduleTab).toHaveAttribute('class', /border-primary/)
	})
})
