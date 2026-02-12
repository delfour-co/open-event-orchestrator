/**
 * Speaker Feedback Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ACCEPTED_TEMPLATE,
  DEFAULT_REJECTED_TEMPLATE,
  DEFAULT_WAITLISTED_TEMPLATE,
  type FeedbackVariableContext,
  type SpeakerFeedback,
  anonymizeComments,
  canSendFeedback,
  extractVariables,
  formatReviewerComments,
  getAvailableVariables,
  getDefaultTemplate,
  getFeedbackStatusColor,
  getFeedbackStatusLabel,
  getTemplateTypeForStatus,
  isFeedbackSent,
  renderTemplate,
  validateTemplate
} from './speaker-feedback'

// Test fixtures
const createContext = (overrides?: Partial<FeedbackVariableContext>): FeedbackVariableContext => ({
  speakerFirstName: 'John',
  speakerLastName: 'Doe',
  talkTitle: 'Building Scalable APIs',
  talkAbstract: 'In this talk, we will explore...',
  eventName: 'DevConf',
  editionName: 'DevConf 2025',
  editionDates: 'June 15-17, 2025',
  editionLocation: 'Paris, France',
  categoryName: 'Backend',
  formatName: 'Conference (45 min)',
  averageRating: 4.2,
  reviewerComments: ['Great topic!', 'Clear structure'],
  confirmationUrl: 'https://devconf.com/confirm/abc123',
  cfpUrl: 'https://devconf.com/cfp',
  ...overrides
})

describe('getAvailableVariables', () => {
  it('should return all available variables', () => {
    const variables = getAvailableVariables()

    expect(variables).toHaveLength(14)
    expect(variables.map((v) => v.variable)).toContain('speaker_name')
    expect(variables.map((v) => v.variable)).toContain('talk_title')
    expect(variables.map((v) => v.variable)).toContain('reviewer_comments')
  })

  it('should include descriptions and examples', () => {
    const variables = getAvailableVariables()

    for (const variable of variables) {
      expect(variable.description).toBeTruthy()
      expect(variable.example).toBeTruthy()
    }
  })
})

describe('renderTemplate', () => {
  it('should replace speaker name variables', () => {
    const template = 'Hello {speaker_name}, aka {speaker_full_name}!'
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toBe('Hello John, aka John Doe!')
  })

  it('should replace talk variables', () => {
    const template = 'Your talk "{talk_title}" - {talk_abstract}'
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toContain('Building Scalable APIs')
    expect(result).toContain('In this talk, we will explore...')
  })

  it('should replace event and edition variables', () => {
    const template = '{event_name} - {edition_name} ({edition_dates}) at {edition_location}'
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toBe('DevConf - DevConf 2025 (June 15-17, 2025) at Paris, France')
  })

  it('should replace category and format variables', () => {
    const template = 'Category: {category_name}, Format: {format_name}'
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toBe('Category: Backend, Format: Conference (45 min)')
  })

  it('should format average rating', () => {
    const template = 'Rating: {average_rating}'
    const context = createContext({ averageRating: 4.567 })

    const result = renderTemplate(template, context)

    expect(result).toBe('Rating: 4.6/5')
  })

  it('should show N/A for missing average rating', () => {
    const template = 'Rating: {average_rating}'
    const context = createContext({ averageRating: undefined })

    const result = renderTemplate(template, context)

    expect(result).toBe('Rating: N/A')
  })

  it('should format reviewer comments as bullet points', () => {
    const template = 'Comments:\n{reviewer_comments}'
    const context = createContext({ reviewerComments: ['Great topic!', 'Nice structure'] })

    const result = renderTemplate(template, context)

    expect(result).toContain('- Great topic!')
    expect(result).toContain('- Nice structure')
  })

  it('should handle empty reviewer comments', () => {
    const template = 'Comments: {reviewer_comments}'
    const context = createContext({ reviewerComments: [] })

    const result = renderTemplate(template, context)

    expect(result).toBe('Comments: ')
  })

  it('should replace URL variables', () => {
    const template = 'Confirm: {confirmation_url} | CFP: {cfp_url}'
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toContain('https://devconf.com/confirm/abc123')
    expect(result).toContain('https://devconf.com/cfp')
  })

  it('should handle optional fields gracefully', () => {
    const template = '{edition_dates} at {edition_location}'
    const context = createContext({ editionDates: undefined, editionLocation: undefined })

    const result = renderTemplate(template, context)

    expect(result).toBe(' at ')
  })

  it('should handle multiple occurrences of same variable', () => {
    const template = '{speaker_name} says hi! - {speaker_name}'
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toBe('John says hi! - John')
  })
})

describe('validateTemplate', () => {
  it('should validate template with known variables', () => {
    const template = 'Hello {speaker_name}, your talk {talk_title} is {event_name}'

    const result = validateTemplate(template)

    expect(result.valid).toBe(true)
    expect(result.unknownVariables).toHaveLength(0)
  })

  it('should detect unknown variables', () => {
    const template = 'Hello {speaker_name}, {unknown_var} and {another_unknown}'

    const result = validateTemplate(template)

    expect(result.valid).toBe(false)
    expect(result.unknownVariables).toContain('unknown_var')
    expect(result.unknownVariables).toContain('another_unknown')
  })

  it('should handle template with no variables', () => {
    const template = 'Hello, this is a static message!'

    const result = validateTemplate(template)

    expect(result.valid).toBe(true)
    expect(result.unknownVariables).toHaveLength(0)
  })
})

describe('extractVariables', () => {
  it('should extract variables from template', () => {
    const template = 'Hello {speaker_name}, your talk {talk_title}'

    const variables = extractVariables(template)

    expect(variables).toContain('speaker_name')
    expect(variables).toContain('talk_title')
    expect(variables).toHaveLength(2)
  })

  it('should not duplicate variables', () => {
    const template = '{speaker_name} says {speaker_name}'

    const variables = extractVariables(template)

    expect(variables).toHaveLength(1)
    expect(variables[0]).toBe('speaker_name')
  })

  it('should ignore unknown variables', () => {
    const template = '{speaker_name} {unknown_var}'

    const variables = extractVariables(template)

    expect(variables).toHaveLength(1)
    expect(variables).toContain('speaker_name')
  })

  it('should return empty array for no variables', () => {
    const template = 'Static text'

    const variables = extractVariables(template)

    expect(variables).toHaveLength(0)
  })
})

describe('Default Templates', () => {
  it('should have acceptance template with required fields', () => {
    expect(DEFAULT_ACCEPTED_TEMPLATE.name).toBeTruthy()
    expect(DEFAULT_ACCEPTED_TEMPLATE.subject).toContain('{talk_title}')
    expect(DEFAULT_ACCEPTED_TEMPLATE.body).toContain('{speaker_name}')
    expect(DEFAULT_ACCEPTED_TEMPLATE.body).toContain('{confirmation_url}')
    expect(DEFAULT_ACCEPTED_TEMPLATE.includeReviewerComments).toBe(true)
  })

  it('should have rejection template with required fields', () => {
    expect(DEFAULT_REJECTED_TEMPLATE.name).toBeTruthy()
    expect(DEFAULT_REJECTED_TEMPLATE.subject).toContain('{edition_name}')
    expect(DEFAULT_REJECTED_TEMPLATE.body).toContain('{speaker_name}')
    expect(DEFAULT_REJECTED_TEMPLATE.body).toContain('{talk_title}')
  })

  it('should have waitlist template with required fields', () => {
    expect(DEFAULT_WAITLISTED_TEMPLATE.name).toBeTruthy()
    expect(DEFAULT_WAITLISTED_TEMPLATE.subject).toContain('{edition_name}')
    expect(DEFAULT_WAITLISTED_TEMPLATE.body).toContain('{edition_dates}')
  })
})

describe('getDefaultTemplate', () => {
  it('should return accepted template', () => {
    const template = getDefaultTemplate('accepted')

    expect(template).not.toBeNull()
    expect(template?.name).toBe('Default Acceptance')
  })

  it('should return rejected template', () => {
    const template = getDefaultTemplate('rejected')

    expect(template).not.toBeNull()
    expect(template?.name).toBe('Default Rejection')
  })

  it('should return waitlisted template', () => {
    const template = getDefaultTemplate('waitlisted')

    expect(template).not.toBeNull()
    expect(template?.name).toBe('Default Waitlist')
  })

  it('should return null for custom type', () => {
    const template = getDefaultTemplate('custom')

    expect(template).toBeNull()
  })
})

describe('getTemplateTypeForStatus', () => {
  it('should return accepted for accepted status', () => {
    expect(getTemplateTypeForStatus('accepted')).toBe('accepted')
  })

  it('should return accepted for confirmed status', () => {
    expect(getTemplateTypeForStatus('confirmed')).toBe('accepted')
  })

  it('should return rejected for rejected status', () => {
    expect(getTemplateTypeForStatus('rejected')).toBe('rejected')
  })

  it('should return null for draft status', () => {
    expect(getTemplateTypeForStatus('draft')).toBeNull()
  })

  it('should return null for submitted status', () => {
    expect(getTemplateTypeForStatus('submitted')).toBeNull()
  })
})

describe('anonymizeComments', () => {
  it('should remove email addresses', () => {
    const comments = [{ content: 'Contact me at john@example.com for more info' }]

    const result = anonymizeComments(comments)

    expect(result[0]).toContain('[email]')
    expect(result[0]).not.toContain('john@example.com')
  })

  it('should remove @mentions', () => {
    const comments = [{ content: 'Great talk @johndoe!' }]

    const result = anonymizeComments(comments)

    expect(result[0]).toContain('[user]')
    expect(result[0]).not.toContain('@johndoe')
  })

  it('should replace first-person references', () => {
    const comments = [{ content: 'I think this is great. My favorite part was...' }]

    const result = anonymizeComments(comments)

    expect(result[0]).toContain('the reviewer think')
    expect(result[0]).toContain('the reviewer favorite')
  })

  it('should filter out empty comments', () => {
    const comments = [{ content: '   ' }, { content: 'Valid comment' }, { content: '' }]

    const result = anonymizeComments(comments)

    expect(result).toHaveLength(1)
    expect(result[0]).toBe('Valid comment')
  })

  it('should handle empty array', () => {
    const result = anonymizeComments([])

    expect(result).toHaveLength(0)
  })
})

describe('formatReviewerComments', () => {
  it('should format comments with header', () => {
    const comments = ['Great topic!', 'Clear structure']

    const result = formatReviewerComments(comments, true)

    expect(result).toContain('**Feedback from our reviewers:**')
    expect(result).toContain('• Great topic!')
    expect(result).toContain('• Clear structure')
  })

  it('should format comments without header', () => {
    const comments = ['Great topic!']

    const result = formatReviewerComments(comments, false)

    expect(result).not.toContain('Feedback from our reviewers')
    expect(result).toContain('• Great topic!')
  })

  it('should return empty string for no comments', () => {
    const result = formatReviewerComments([])

    expect(result).toBe('')
  })
})

describe('canSendFeedback', () => {
  it('should return true for accepted status', () => {
    expect(canSendFeedback('accepted')).toBe(true)
  })

  it('should return true for rejected status', () => {
    expect(canSendFeedback('rejected')).toBe(true)
  })

  it('should return true for confirmed status', () => {
    expect(canSendFeedback('confirmed')).toBe(true)
  })

  it('should return false for draft status', () => {
    expect(canSendFeedback('draft')).toBe(false)
  })

  it('should return false for submitted status', () => {
    expect(canSendFeedback('submitted')).toBe(false)
  })

  it('should return false for under_review status', () => {
    expect(canSendFeedback('under_review')).toBe(false)
  })
})

describe('isFeedbackSent', () => {
  it('should return true when status is sent and sentAt exists', () => {
    const feedback: SpeakerFeedback = {
      id: 'fb-001',
      talkId: 'talk-001',
      speakerId: 'speaker-001',
      subject: 'Test',
      body: 'Test body',
      status: 'sent',
      sentAt: new Date(),
      createdBy: 'user-001',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(isFeedbackSent(feedback)).toBe(true)
  })

  it('should return false when status is draft', () => {
    const feedback: SpeakerFeedback = {
      id: 'fb-001',
      talkId: 'talk-001',
      speakerId: 'speaker-001',
      subject: 'Test',
      body: 'Test body',
      status: 'draft',
      createdBy: 'user-001',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(isFeedbackSent(feedback)).toBe(false)
  })

  it('should return false when status is failed', () => {
    const feedback: SpeakerFeedback = {
      id: 'fb-001',
      talkId: 'talk-001',
      speakerId: 'speaker-001',
      subject: 'Test',
      body: 'Test body',
      status: 'failed',
      error: 'SMTP error',
      createdBy: 'user-001',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(isFeedbackSent(feedback)).toBe(false)
  })
})

describe('getFeedbackStatusLabel', () => {
  it('should return Draft for draft status', () => {
    expect(getFeedbackStatusLabel('draft')).toBe('Draft')
  })

  it('should return Sent for sent status', () => {
    expect(getFeedbackStatusLabel('sent')).toBe('Sent')
  })

  it('should return Failed for failed status', () => {
    expect(getFeedbackStatusLabel('failed')).toBe('Failed')
  })
})

describe('getFeedbackStatusColor', () => {
  it('should return slate color for draft', () => {
    expect(getFeedbackStatusColor('draft')).toBe('#94a3b8')
  })

  it('should return green color for sent', () => {
    expect(getFeedbackStatusColor('sent')).toBe('#22c55e')
  })

  it('should return red color for failed', () => {
    expect(getFeedbackStatusColor('failed')).toBe('#ef4444')
  })
})

describe('Template rendering with default templates', () => {
  it('should render acceptance template completely', () => {
    const template = DEFAULT_ACCEPTED_TEMPLATE.body
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toContain('John')
    expect(result).toContain('Building Scalable APIs')
    expect(result).toContain('DevConf 2025')
    expect(result).toContain('June 15-17, 2025')
    expect(result).toContain('Paris, France')
    expect(result).toContain('https://devconf.com/confirm/abc123')
    expect(result).not.toContain('{')
    expect(result).not.toContain('}')
  })

  it('should render rejection template completely', () => {
    const template = DEFAULT_REJECTED_TEMPLATE.body
    const context = createContext()

    const result = renderTemplate(template, context)

    expect(result).toContain('John')
    expect(result).toContain('Building Scalable APIs')
    expect(result).toContain('DevConf 2025')
    expect(result).not.toContain('{speaker_name}')
    expect(result).not.toContain('{talk_title}')
  })
})
