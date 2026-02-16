import { describe, expect, it } from 'vitest'
import {
  type MessageSenderType,
  type SponsorMessage,
  countUnread,
  createSponsorMessageSchema,
  formatMessageDate,
  getAttachmentCount,
  getLastMessage,
  getSenderTypeLabel,
  getUnreadForOrganizer,
  getUnreadForSponsor,
  hasAttachments,
  isFromOrganizer,
  isFromSponsor,
  isRead,
  isUnread,
  messageSenderTypeSchema,
  sortByCreatedAsc,
  sortByCreatedDesc,
  sponsorMessageSchema,
  truncateContent,
  updateSponsorMessageSchema
} from './sponsor-message'

describe('SponsorMessage Domain', () => {
  const validMessage: SponsorMessage = {
    id: 'msg123',
    editionSponsorId: 'es123',
    senderType: 'organizer',
    senderUserId: 'user123',
    senderName: 'John Doe',
    subject: 'Welcome to our event',
    content: 'Thank you for becoming a sponsor!',
    attachments: [],
    readAt: undefined,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z')
  }

  describe('messageSenderTypeSchema', () => {
    it('should accept valid sender types', () => {
      const types: MessageSenderType[] = ['organizer', 'sponsor']
      for (const type of types) {
        expect(messageSenderTypeSchema.safeParse(type).success).toBe(true)
      }
    })

    it('should reject invalid sender type', () => {
      expect(messageSenderTypeSchema.safeParse('admin').success).toBe(false)
      expect(messageSenderTypeSchema.safeParse('guest').success).toBe(false)
    })
  })

  describe('sponsorMessageSchema', () => {
    it('should validate a complete message', () => {
      const result = sponsorMessageSchema.safeParse(validMessage)
      expect(result.success).toBe(true)
    })

    it('should validate message with minimal fields', () => {
      const minimal = {
        id: 'msg123',
        editionSponsorId: 'es123',
        senderType: 'sponsor',
        senderName: 'Sponsor Inc',
        content: 'Hello!',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = sponsorMessageSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty content', () => {
      const invalid = { ...validMessage, content: '' }
      const result = sponsorMessageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject content too long', () => {
      const invalid = { ...validMessage, content: 'a'.repeat(10001) }
      const result = sponsorMessageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject empty sender name', () => {
      const invalid = { ...validMessage, senderName: '' }
      const result = sponsorMessageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject sender name too long', () => {
      const invalid = { ...validMessage, senderName: 'a'.repeat(201) }
      const result = sponsorMessageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject subject too long', () => {
      const invalid = { ...validMessage, subject: 'a'.repeat(501) }
      const result = sponsorMessageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should validate message with attachments', () => {
      const withAttachments = {
        ...validMessage,
        attachments: ['file1.pdf', 'image.png']
      }
      const result = sponsorMessageSchema.safeParse(withAttachments)
      expect(result.success).toBe(true)
    })

    it('should default attachments to empty array', () => {
      const data = {
        id: 'msg123',
        editionSponsorId: 'es123',
        senderType: 'organizer',
        senderName: 'Test',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = sponsorMessageSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.attachments).toEqual([])
      }
    })
  })

  describe('createSponsorMessageSchema', () => {
    it('should omit id, readAt, createdAt, updatedAt', () => {
      const createData = {
        editionSponsorId: 'es123',
        senderType: 'sponsor' as const,
        senderName: 'Sponsor Inc',
        content: 'New message',
        attachments: []
      }
      const result = createSponsorMessageSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should allow optional subject', () => {
      const createData = {
        editionSponsorId: 'es123',
        senderType: 'organizer' as const,
        senderName: 'Event Team',
        subject: 'Important Update',
        content: 'Message content',
        attachments: []
      }
      const result = createSponsorMessageSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateSponsorMessageSchema', () => {
    it('should allow readAt update', () => {
      const updateData = { readAt: new Date() }
      const result = updateSponsorMessageSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateSponsorMessageSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('getSenderTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getSenderTypeLabel('organizer')).toBe('Organizer')
      expect(getSenderTypeLabel('sponsor')).toBe('Sponsor')
    })
  })

  describe('isFromOrganizer', () => {
    it('should return true for organizer messages', () => {
      expect(isFromOrganizer(validMessage)).toBe(true)
    })

    it('should return false for sponsor messages', () => {
      const sponsorMsg = { ...validMessage, senderType: 'sponsor' as const }
      expect(isFromOrganizer(sponsorMsg)).toBe(false)
    })
  })

  describe('isFromSponsor', () => {
    it('should return true for sponsor messages', () => {
      const sponsorMsg = { ...validMessage, senderType: 'sponsor' as const }
      expect(isFromSponsor(sponsorMsg)).toBe(true)
    })

    it('should return false for organizer messages', () => {
      expect(isFromSponsor(validMessage)).toBe(false)
    })
  })

  describe('isRead / isUnread', () => {
    it('should identify read messages', () => {
      const readMsg = { ...validMessage, readAt: new Date() }
      expect(isRead(readMsg)).toBe(true)
      expect(isUnread(readMsg)).toBe(false)
    })

    it('should identify unread messages', () => {
      expect(isRead(validMessage)).toBe(false)
      expect(isUnread(validMessage)).toBe(true)
    })
  })

  describe('countUnread', () => {
    it('should count unread messages for organizer', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '1', senderType: 'sponsor' },
        { ...validMessage, id: '2', senderType: 'sponsor' },
        { ...validMessage, id: '3', senderType: 'sponsor', readAt: new Date() },
        { ...validMessage, id: '4', senderType: 'organizer' }
      ]
      // Organizer wants to see unread messages from sponsors (not their own)
      expect(countUnread(messages, 'organizer')).toBe(2)
    })

    it('should count unread messages for sponsor', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '1', senderType: 'organizer' },
        { ...validMessage, id: '2', senderType: 'organizer', readAt: new Date() },
        { ...validMessage, id: '3', senderType: 'sponsor' }
      ]
      // Sponsor wants to see unread messages from organizer (not their own)
      expect(countUnread(messages, 'sponsor')).toBe(1)
    })
  })

  describe('getUnreadForOrganizer', () => {
    it('should return unread sponsor messages', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '1', senderType: 'sponsor' },
        { ...validMessage, id: '2', senderType: 'sponsor', readAt: new Date() },
        { ...validMessage, id: '3', senderType: 'organizer' }
      ]
      const unread = getUnreadForOrganizer(messages)
      expect(unread).toHaveLength(1)
      expect(unread[0].id).toBe('1')
    })
  })

  describe('getUnreadForSponsor', () => {
    it('should return unread organizer messages', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '1', senderType: 'organizer' },
        { ...validMessage, id: '2', senderType: 'organizer', readAt: new Date() },
        { ...validMessage, id: '3', senderType: 'sponsor' }
      ]
      const unread = getUnreadForSponsor(messages)
      expect(unread).toHaveLength(1)
      expect(unread[0].id).toBe('1')
    })
  })

  describe('sortByCreatedDesc', () => {
    it('should sort messages newest first', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '1', createdAt: new Date('2025-01-01') },
        { ...validMessage, id: '3', createdAt: new Date('2025-01-03') },
        { ...validMessage, id: '2', createdAt: new Date('2025-01-02') }
      ]
      const sorted = sortByCreatedDesc(messages)
      expect(sorted.map((m) => m.id)).toEqual(['3', '2', '1'])
    })

    it('should not mutate original array', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '1', createdAt: new Date('2025-01-01') },
        { ...validMessage, id: '2', createdAt: new Date('2025-01-02') }
      ]
      sortByCreatedDesc(messages)
      expect(messages[0].id).toBe('1')
    })
  })

  describe('sortByCreatedAsc', () => {
    it('should sort messages oldest first', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '3', createdAt: new Date('2025-01-03') },
        { ...validMessage, id: '1', createdAt: new Date('2025-01-01') },
        { ...validMessage, id: '2', createdAt: new Date('2025-01-02') }
      ]
      const sorted = sortByCreatedAsc(messages)
      expect(sorted.map((m) => m.id)).toEqual(['1', '2', '3'])
    })
  })

  describe('getLastMessage', () => {
    it('should return the most recent message', () => {
      const messages: SponsorMessage[] = [
        { ...validMessage, id: '1', createdAt: new Date('2025-01-01') },
        { ...validMessage, id: '3', createdAt: new Date('2025-01-03') },
        { ...validMessage, id: '2', createdAt: new Date('2025-01-02') }
      ]
      const last = getLastMessage(messages)
      expect(last?.id).toBe('3')
    })

    it('should return null for empty array', () => {
      expect(getLastMessage([])).toBeNull()
    })
  })

  describe('formatMessageDate', () => {
    it('should format today as time', () => {
      const now = new Date()
      const result = formatMessageDate(now)
      expect(result).toMatch(/^\d{1,2}:\d{2}/)
    })

    it('should format yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatMessageDate(yesterday)).toBe('Yesterday')
    })

    it('should format days within a week as weekday', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const result = formatMessageDate(threeDaysAgo)
      // Should return a weekday name (locale-dependent)
      // Just verify it's not a time format or "Yesterday"
      expect(result).not.toMatch(/^\d{1,2}:\d{2}/)
      expect(result).not.toBe('Yesterday')
      expect(result.length).toBeGreaterThan(2)
    })

    it('should format older dates with month and day', () => {
      const oldDate = new Date('2024-06-15')
      const result = formatMessageDate(oldDate)
      // Should contain day number 15 (locale-independent)
      expect(result).toMatch(/15/)
      // Should be a non-empty formatted date
      expect(result.length).toBeGreaterThan(2)
    })
  })

  describe('truncateContent', () => {
    it('should not truncate short content', () => {
      expect(truncateContent('Hello')).toBe('Hello')
      expect(truncateContent('a'.repeat(100))).toBe('a'.repeat(100))
    })

    it('should truncate long content', () => {
      const long = 'a'.repeat(150)
      expect(truncateContent(long)).toBe(`${'a'.repeat(100)}...`)
    })

    it('should use custom max length', () => {
      expect(truncateContent('Hello World', 5)).toBe('Hello...')
    })
  })

  describe('hasAttachments', () => {
    it('should return true when message has attachments', () => {
      const msg = { ...validMessage, attachments: ['file.pdf'] }
      expect(hasAttachments(msg)).toBe(true)
    })

    it('should return false when message has no attachments', () => {
      expect(hasAttachments(validMessage)).toBe(false)
    })
  })

  describe('getAttachmentCount', () => {
    it('should return correct count', () => {
      expect(getAttachmentCount(validMessage)).toBe(0)
      const msg = { ...validMessage, attachments: ['a.pdf', 'b.png'] }
      expect(getAttachmentCount(msg)).toBe(2)
    })
  })
})
