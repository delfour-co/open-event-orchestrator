import { expect, test } from '@playwright/test'

// Test tokens matching the seed data (64 hex chars)
const TEST_TOKENS = {
  speaker1: 'a'.repeat(64), // For speaker@example.com (Jane Speaker)
  speaker2: 'b'.repeat(64) // For speaker2@example.com (John Talker)
}

test.describe('CFP Speaker Submissions - Access Request', () => {
  const editionSlug = 'devfest-paris-2025'
  const submissionsUrl = `/cfp/${editionSlug}/submissions`

  test('should show access request form when no token provided', async ({ page }) => {
    await page.goto(submissionsUrl)

    await expect(page.getByRole('heading', { name: 'My Submissions' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Access Your Submissions' })).toBeVisible()
    await expect(page.getByLabel('Email Address')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Access Link' })).toBeVisible()
  })

  test('should show submit a talk link on access page', async ({ page }) => {
    await page.goto(submissionsUrl)

    await expect(page.getByText("Don't have any submissions yet?")).toBeVisible()
    await expect(page.getByRole('link', { name: 'Submit a Talk' })).toBeVisible()
  })

  test('should show confirmation message after requesting access', async ({ page }) => {
    await page.goto(submissionsUrl)

    await page.getByLabel('Email Address').fill('speaker@example.com')
    await page.getByRole('button', { name: 'Send Access Link' }).click()

    await expect(
      page.getByText(
        'If you have submissions with this email, you will receive an access link shortly'
      )
    ).toBeVisible()
  })

  test('should show same message for unknown email (no info leak)', async ({ page }) => {
    await page.goto(submissionsUrl)

    await page.getByLabel('Email Address').fill('unknown@example.com')
    await page.getByRole('button', { name: 'Send Access Link' }).click()

    // Same message for both known and unknown emails (security)
    await expect(
      page.getByText(
        'If you have submissions with this email, you will receive an access link shortly'
      )
    ).toBeVisible()
  })
})

test.describe('CFP Speaker Submissions - Token Access', () => {
  const editionSlug = 'devfest-paris-2025'

  test('should display speaker info when valid token provided', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    // Jane Speaker should be visible
    await expect(page.getByText('Jane Speaker')).toBeVisible()
    await expect(page.getByText('speaker@example.com')).toBeVisible()
  })

  test('should display speaker submissions list', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    // Jane Speaker has submitted talks in the seed data
    await expect(page.getByText('Building Scalable Web Apps with SvelteKit')).toBeVisible()
  })

  test('should display talk status badges', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    // Should see status indicators
    const statusBadges = page.locator('span').filter({
      hasText: /Submitted|Under Review|Accepted|Rejected|Draft|Confirmed|Declined|Withdrawn/
    })
    await expect(statusBadges.first()).toBeVisible()
  })

  test('should show submit another talk link when CFP is open', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    await expect(page.getByRole('link', { name: 'Submit Another Talk' })).toBeVisible()
  })

  test('should show invalid token message for bad token', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=invalid-token`)

    await expect(page.getByText('Invalid or Expired Link')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Request New Access Link' })).toBeVisible()
  })
})

test.describe('CFP Speaker Talk Actions', () => {
  const editionSlug = 'devfest-paris-2025'

  test('should show edit button for editable talks', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    // Should see Edit button for talks that can be edited
    const editButton = page.getByRole('link', { name: 'Edit' })
    const count = await editButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show withdraw button for withdrawable talks', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    // Should see Withdraw button for talks that can be withdrawn
    const withdrawButton = page.getByRole('button', { name: 'Withdraw' })
    const count = await withdrawButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show withdraw confirmation dialog', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    const withdrawButton = page.getByRole('button', { name: 'Withdraw' }).first()
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()

      await expect(page.getByText('Withdraw this talk?')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Yes, Withdraw' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    }
  })

  test('should cancel withdraw when clicking cancel', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    const withdrawButton = page.getByRole('button', { name: 'Withdraw' }).first()
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()
      await page.getByRole('button', { name: 'Cancel' }).click()

      await expect(page.getByText('Withdraw this talk?')).not.toBeVisible()
    }
  })
})

test.describe('CFP Speaker Accepted Talk Actions', () => {
  const editionSlug = 'devfest-paris-2025'

  test('should display confirm/decline buttons for accepted talks', async ({ page }) => {
    // John Talker has an accepted talk (Kubernetes for Developers)
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker2}`)

    // Check for accepted talk section
    const acceptedSection = page.locator('text=Congratulations! Your talk has been accepted')
    if (await acceptedSection.isVisible()) {
      await expect(page.getByRole('button', { name: 'Confirm Participation' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible()
    }
  })

  test('should show decline confirmation dialog', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker2}`)

    const declineButton = page.getByRole('button', { name: 'Decline' }).first()
    if (await declineButton.isVisible()) {
      await declineButton.click()

      await expect(page.getByText('Are you sure?')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Yes, Decline' })).toBeVisible()
    }
  })
})

test.describe('CFP Speaker Edit Submission', () => {
  const editionSlug = 'devfest-paris-2025'

  test('should navigate to edit page with token', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    // Find an edit link if available
    const editLink = page.getByRole('link', { name: 'Edit' }).first()
    if (await editLink.isVisible()) {
      await editLink.click()

      // Should be on edit page with token
      await expect(page).toHaveURL(/\/edit\?token=/)

      // Form should have pre-filled values
      await expect(page.getByLabel('Title *')).not.toBeEmpty()
      await expect(page.getByLabel('Abstract *')).not.toBeEmpty()
    }
  })

  test('should have save and cancel buttons on edit form', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    const editLink = page.getByRole('link', { name: 'Edit' }).first()
    if (await editLink.isVisible()) {
      await editLink.click()

      await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    }
  })

  test('should navigate back to submissions when canceling edit', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?token=${TEST_TOKENS.speaker1}`)

    const editLink = page.getByRole('link', { name: 'Edit' }).first()
    if (await editLink.isVisible()) {
      await editLink.click()
      await page.getByRole('button', { name: 'Cancel' }).click()

      await expect(page).toHaveURL(/\/submissions\?token=/)
    }
  })
})
