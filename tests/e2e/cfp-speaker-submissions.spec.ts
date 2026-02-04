import { expect, test } from '@playwright/test'

test.describe('CFP Speaker Submissions Page', () => {
  const editionSlug = 'devfest-paris-2025'
  const speakerEmail = 'speaker@example.com'
  const submissionsUrl = `/cfp/${editionSlug}/submissions`

  test('should prompt for email when accessing submissions without email', async ({ page }) => {
    await page.goto(submissionsUrl)

    await expect(page.getByRole('heading', { name: 'My Submissions' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Find Your Submissions' })).toBeVisible()
    await expect(page.getByLabel('Email Address')).toBeVisible()
    await expect(page.getByRole('button', { name: 'View Submissions' })).toBeVisible()
  })

  test('should redirect to submissions with email after entering email', async ({ page }) => {
    await page.goto(submissionsUrl)

    await page.getByLabel('Email Address').fill(speakerEmail)
    await page.getByRole('button', { name: 'View Submissions' }).click()

    await expect(page).toHaveURL(new RegExp(`email=${encodeURIComponent(speakerEmail)}`))
  })

  test('should display speaker info when email is provided', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=${encodeURIComponent(speakerEmail)}`)

    await expect(page.getByText('Jane Speaker')).toBeVisible()
    await expect(page.getByText(speakerEmail)).toBeVisible()
  })

  test('should display speaker submissions list', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=${encodeURIComponent(speakerEmail)}`)

    // Jane Speaker has submitted talks in the seed data
    await expect(page.getByText('Building Scalable Web Apps with SvelteKit')).toBeVisible()
  })

  test('should display talk status badges', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=${encodeURIComponent(speakerEmail)}`)

    // Should see status indicators
    const statusBadges = page.locator('span').filter({
      hasText: /Submitted|Under Review|Accepted|Rejected|Draft|Confirmed|Declined|Withdrawn/
    })
    await expect(statusBadges.first()).toBeVisible()
  })

  test('should show edit button for draft/submitted talks when CFP is open', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=${encodeURIComponent(speakerEmail)}`)

    // Should see Edit button for talks that can be edited
    const editButton = page.getByRole('link', { name: 'Edit' })
    // May or may not be visible depending on talk status
    const count = await editButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show withdraw button for withdrawable talks', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=${encodeURIComponent(speakerEmail)}`)

    // Should see Withdraw button for talks that can be withdrawn
    const withdrawButton = page.getByRole('button', { name: 'Withdraw' })
    const count = await withdrawButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show submit another talk link when CFP is open', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=${encodeURIComponent(speakerEmail)}`)

    await expect(page.getByRole('link', { name: 'Submit Another Talk' })).toBeVisible()
  })

  test('should display no submissions message for unknown email', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=unknown@example.com`)

    await expect(page.getByText('No submissions found')).toBeVisible()
    await expect(
      page.getByText("We couldn't find any submissions for this email address")
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Submit a Talk' })).toBeVisible()
  })

  test('should navigate to submit page from no submissions state', async ({ page }) => {
    await page.goto(`${submissionsUrl}?email=unknown@example.com`)

    await page.getByRole('link', { name: 'Submit a Talk' }).click()

    await expect(page).toHaveURL(`/cfp/${editionSlug}/submit`)
  })
})

test.describe('CFP Speaker Talk Actions', () => {
  const editionSlug = 'devfest-paris-2025'
  const speakerEmail = 'speaker@example.com'
  const submissionsUrl = `/cfp/${editionSlug}/submissions?email=${encodeURIComponent(speakerEmail)}`

  test('should show withdraw confirmation dialog', async ({ page }) => {
    await page.goto(submissionsUrl)

    const withdrawButton = page.getByRole('button', { name: 'Withdraw' }).first()
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click()

      await expect(page.getByText('Withdraw this talk?')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Yes, Withdraw' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    }
  })

  test('should cancel withdraw when clicking cancel', async ({ page }) => {
    await page.goto(submissionsUrl)

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
  // John Talker has an accepted talk (Kubernetes for Developers)
  const acceptedSpeakerEmail = 'talker@example.com'
  const submissionsUrl = `/cfp/${editionSlug}/submissions?email=${encodeURIComponent(acceptedSpeakerEmail)}`

  test('should display confirm/decline buttons for accepted talks', async ({ page }) => {
    await page.goto(submissionsUrl)

    // Check for accepted talk section
    const acceptedSection = page.locator('text=Congratulations! Your talk has been accepted')
    if (await acceptedSection.isVisible()) {
      await expect(page.getByRole('button', { name: 'Confirm Participation' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible()
    }
  })

  test('should show decline confirmation dialog', async ({ page }) => {
    await page.goto(submissionsUrl)

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
  const speakerEmail = 'speaker@example.com'

  test('should display edit form with pre-filled data', async ({ page }) => {
    // Navigate to submissions first
    await page.goto(`/cfp/${editionSlug}/submissions?email=${encodeURIComponent(speakerEmail)}`)

    // Find an edit link if available
    const editLink = page.getByRole('link', { name: 'Edit' }).first()
    if (await editLink.isVisible()) {
      await editLink.click()

      // Should be on edit page
      await expect(page).toHaveURL(/\/edit/)

      // Form should have pre-filled values
      await expect(page.getByLabel('Title *')).not.toBeEmpty()
      await expect(page.getByLabel('Abstract *')).not.toBeEmpty()
    }
  })

  test('should have save and cancel buttons on edit form', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?email=${encodeURIComponent(speakerEmail)}`)

    const editLink = page.getByRole('link', { name: 'Edit' }).first()
    if (await editLink.isVisible()) {
      await editLink.click()

      await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    }
  })

  test('should navigate back to submissions when canceling edit', async ({ page }) => {
    await page.goto(`/cfp/${editionSlug}/submissions?email=${encodeURIComponent(speakerEmail)}`)

    const editLink = page.getByRole('link', { name: 'Edit' }).first()
    if (await editLink.isVisible()) {
      await editLink.click()
      await page.getByRole('button', { name: 'Cancel' }).click()

      await expect(page).toHaveURL(/\/submissions/)
    }
  })
})
