import { describe, expect, it } from 'vitest'
import {
  buildPreviewData,
  calculateDeliverabilityScore,
  calculateTextToImageRatio,
  detectSpamTriggers,
  estimateSendDuration,
  extractVariables,
  formatTestSubject,
  getDeliverabilityColor,
  getDeliverabilityLabel,
  getDefaultFallbacks,
  resolveVariables,
  validatePreSend,
  validateTestAddresses
} from './email-preview'

describe('email-preview', () => {
  describe('extractVariables', () => {
    it('should extract variables from content', () => {
      const content = 'Hello {{firstName}}, welcome to {{eventName}}!'
      const variables = extractVariables(content)

      expect(variables).toContain('firstName')
      expect(variables).toContain('eventName')
      expect(variables).toHaveLength(2)
    })

    it('should handle variables with spaces', () => {
      const content = 'Hello {{ firstName }}, welcome!'
      const variables = extractVariables(content)

      expect(variables).toContain('firstName')
    })

    it('should deduplicate variables', () => {
      const content = '{{name}} - {{name}} - {{name}}'
      const variables = extractVariables(content)

      expect(variables).toHaveLength(1)
      expect(variables[0]).toBe('name')
    })

    it('should return empty array for no variables', () => {
      const content = 'Hello, welcome to the event!'
      const variables = extractVariables(content)

      expect(variables).toHaveLength(0)
    })
  })

  describe('resolveVariables', () => {
    it('should resolve variables with data', () => {
      const content = 'Hello {{firstName}}, welcome to {{eventName}}!'
      const data = { firstName: 'John', eventName: 'DevCon 2024' }

      const { resolved, statuses } = resolveVariables(content, data)

      expect(resolved).toBe('Hello John, welcome to DevCon 2024!')
      expect(statuses.every((s) => s.resolved)).toBe(true)
    })

    it('should use fallbacks for missing data', () => {
      const content = 'Hello {{firstName}}!'
      const data = {}
      const fallbacks = { firstName: 'Friend' }

      const { resolved, statuses } = resolveVariables(content, data, fallbacks)

      expect(resolved).toBe('Hello Friend!')
      expect(statuses[0].resolved).toBe(true)
      expect(statuses[0].fallback).toBe('Friend')
    })

    it('should track unresolved variables', () => {
      const content = 'Hello {{firstName}} from {{company}}!'
      const data = { firstName: 'John' }

      const { resolved, statuses } = resolveVariables(content, data)

      expect(resolved).toContain('{{company}}')
      expect(statuses.find((s) => s.name === 'company')?.resolved).toBe(false)
    })
  })

  describe('buildPreviewData', () => {
    it('should build complete preview data', () => {
      const preview = buildPreviewData(
        'Welcome {{firstName}}!',
        '<p>Hello {{firstName}}, welcome to {{eventName}}!</p>',
        'Hello {{firstName}}',
        { firstName: 'John', eventName: 'DevCon' }
      )

      expect(preview.resolvedSubject).toBe('Welcome John!')
      expect(preview.resolvedHtmlContent).toContain('Hello John')
      expect(preview.resolvedTextContent).toBe('Hello John')
      expect(preview.unresolvedCount).toBe(0)
    })

    it('should count unresolved variables', () => {
      const preview = buildPreviewData(
        'Welcome {{firstName}}!',
        '<p>Hello {{firstName}} from {{company}}!</p>',
        undefined,
        { firstName: 'John' }
      )

      expect(preview.unresolvedCount).toBe(1)
    })

    it('should deduplicate variables across fields', () => {
      const preview = buildPreviewData('{{firstName}}', '{{firstName}}', '{{firstName}}', {
        firstName: 'John'
      })

      expect(preview.variables).toHaveLength(1)
    })
  })

  describe('detectSpamTriggers', () => {
    it('should detect spam trigger words', () => {
      const content = 'Act now! This is a free offer for a limited time!'
      const triggers = detectSpamTriggers(content)

      expect(triggers).toContain('act now')
      expect(triggers).toContain('free')
      expect(triggers).toContain('limited time')
    })

    it('should be case insensitive', () => {
      const content = 'FREE OFFER - ACT NOW!'
      const triggers = detectSpamTriggers(content)

      expect(triggers).toContain('free')
      expect(triggers).toContain('act now')
    })

    it('should return empty array for clean content', () => {
      const content = 'Thank you for registering for our conference.'
      const triggers = detectSpamTriggers(content)

      expect(triggers).toHaveLength(0)
    })
  })

  describe('calculateDeliverabilityScore', () => {
    it('should return 100 for perfect email', () => {
      const score = calculateDeliverabilityScore(true, true, true, 0, 0, 0.8)
      expect(score).toBe(100)
    })

    it('should penalize missing subject', () => {
      const score = calculateDeliverabilityScore(false, true, true, 0, 0, 0.8)
      expect(score).toBe(70)
    })

    it('should penalize missing unsubscribe', () => {
      const score = calculateDeliverabilityScore(true, false, true, 0, 0, 0.8)
      expect(score).toBe(80)
    })

    it('should penalize spam triggers', () => {
      const scoreWithSpam = calculateDeliverabilityScore(true, true, true, 0, 3, 0.8)
      const scoreClean = calculateDeliverabilityScore(true, true, true, 0, 0, 0.8)
      expect(scoreWithSpam).toBeLessThan(scoreClean)
    })

    it('should penalize low text to image ratio', () => {
      const scoreLowRatio = calculateDeliverabilityScore(true, true, true, 0, 0, 0.2)
      const scoreHighRatio = calculateDeliverabilityScore(true, true, true, 0, 0, 0.8)
      expect(scoreLowRatio).toBeLessThan(scoreHighRatio)
    })

    it('should not go below 0', () => {
      const score = calculateDeliverabilityScore(false, false, false, 10, 10, 0)
      expect(score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('validatePreSend', () => {
    it('should pass validation for valid campaign', () => {
      const result = validatePreSend(
        'Welcome to DevCon',
        'DevCon Team',
        'team@devcon.com',
        '<p>Content with <a href="#unsubscribe">unsubscribe</a></p>',
        'Plain text version',
        100,
        0
      )

      expect(result.valid).toBe(true)
      expect(result.errorCount).toBe(0)
    })

    it('should fail for missing subject', () => {
      const result = validatePreSend('', 'Sender', 'sender@test.com', '<p>Content</p>', '', 100, 0)

      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.code === 'missing_subject')).toBe(true)
    })

    it('should fail for missing from name', () => {
      const result = validatePreSend('Subject', '', 'sender@test.com', '<p>Content</p>', '', 100, 0)

      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.code === 'missing_from_name')).toBe(true)
    })

    it('should fail for missing unsubscribe link', () => {
      const result = validatePreSend(
        'Subject',
        'Sender',
        'sender@test.com',
        '<p>Just some regular content here</p>',
        '',
        100,
        0
      )

      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.code === 'missing_unsubscribe')).toBe(true)
    })

    it('should fail for empty segment', () => {
      const result = validatePreSend(
        'Subject',
        'Sender',
        'sender@test.com',
        '<p>Content with unsubscribe</p>',
        '',
        0,
        0
      )

      expect(result.valid).toBe(false)
      expect(result.issues.some((i) => i.code === 'empty_segment')).toBe(true)
    })

    it('should warn about unresolved variables', () => {
      const result = validatePreSend(
        'Welcome',
        'Sender',
        'sender@test.com',
        '<p>Content with unsubscribe</p>',
        '',
        100,
        3
      )

      expect(result.issues.some((i) => i.code === 'unresolved_variables')).toBe(true)
      expect(result.issues.find((i) => i.code === 'unresolved_variables')?.severity).toBe('warning')
    })

    it('should warn about missing text version', () => {
      const result = validatePreSend(
        'Subject',
        'Sender',
        'sender@test.com',
        '<p>Content with unsubscribe</p>',
        '',
        100,
        0
      )

      expect(result.issues.some((i) => i.code === 'no_text_version')).toBe(true)
    })

    it('should calculate deliverability score', () => {
      const result = validatePreSend(
        'Subject',
        'Sender',
        'sender@test.com',
        '<p>Content with unsubscribe</p>',
        'Text',
        100,
        0
      )

      expect(result.deliverabilityScore).toBeGreaterThan(0)
      expect(result.deliverabilityScore).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateTextToImageRatio', () => {
    it('should return 1 for text-only content', () => {
      const ratio = calculateTextToImageRatio('<p>Just text content here</p>')
      expect(ratio).toBe(1)
    })

    it('should return lower ratio for image-heavy content', () => {
      const content = '<p>Text</p><img src="a.jpg"><img src="b.jpg"><img src="c.jpg">'
      const ratio = calculateTextToImageRatio(content)
      expect(ratio).toBeLessThan(1)
    })

    it('should return 0 for image-only content', () => {
      const ratio = calculateTextToImageRatio('<img src="a.jpg">')
      expect(ratio).toBe(0)
    })
  })

  describe('estimateSendDuration', () => {
    it('should estimate duration based on send rate', () => {
      const estimate = estimateSendDuration(1000, 100)

      expect(estimate.recipientCount).toBe(1000)
      expect(estimate.estimatedDurationMinutes).toBe(10)
      expect(estimate.sendRate).toBe(100)
    })

    it('should round up for partial minutes', () => {
      const estimate = estimateSendDuration(150, 100)
      expect(estimate.estimatedDurationMinutes).toBe(2)
    })
  })

  describe('formatTestSubject', () => {
    it('should prefix subject with [TEST]', () => {
      expect(formatTestSubject('Welcome to DevCon')).toBe('[TEST] Welcome to DevCon')
    })
  })

  describe('getDeliverabilityLabel', () => {
    it('should return correct labels', () => {
      expect(getDeliverabilityLabel(95)).toBe('excellent')
      expect(getDeliverabilityLabel(80)).toBe('good')
      expect(getDeliverabilityLabel(60)).toBe('fair')
      expect(getDeliverabilityLabel(40)).toBe('poor')
    })
  })

  describe('getDeliverabilityColor', () => {
    it('should return green for high scores', () => {
      expect(getDeliverabilityColor(95)).toBe('#22c55e')
    })

    it('should return red for low scores', () => {
      expect(getDeliverabilityColor(30)).toBe('#ef4444')
    })
  })

  describe('getDefaultFallbacks', () => {
    it('should return common fallbacks', () => {
      const fallbacks = getDefaultFallbacks()

      expect(fallbacks.firstName).toBeDefined()
      expect(fallbacks.eventName).toBeDefined()
      expect(fallbacks.unsubscribeUrl).toBeDefined()
    })
  })

  describe('validateTestAddresses', () => {
    it('should validate email addresses', () => {
      const { valid, invalid } = validateTestAddresses([
        'test@example.com',
        'invalid-email',
        'another@test.org',
        'not an email'
      ])

      expect(valid).toContain('test@example.com')
      expect(valid).toContain('another@test.org')
      expect(invalid).toContain('invalid-email')
      expect(invalid).toContain('not an email')
    })

    it('should normalize email addresses', () => {
      const { valid } = validateTestAddresses(['  Test@Example.COM  '])
      expect(valid[0]).toBe('test@example.com')
    })

    it('should handle empty array', () => {
      const { valid, invalid } = validateTestAddresses([])
      expect(valid).toHaveLength(0)
      expect(invalid).toHaveLength(0)
    })
  })
})
