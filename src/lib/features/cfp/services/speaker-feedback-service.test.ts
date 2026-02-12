/**
 * Speaker Feedback Service Tests
 */

import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EmailService } from './email-service'
import { createSpeakerFeedbackService } from './speaker-feedback-service'

describe('SpeakerFeedbackService', () => {
  let mockPb: PocketBase
  let mockEmailService: EmailService

  beforeEach(() => {
    vi.clearAllMocks()

    mockEmailService = {
      send: vi.fn().mockResolvedValue({ success: true })
    }

    mockPb = {
      baseUrl: 'http://localhost:8090',
      collection: vi.fn(() => ({
        getOne: vi.fn(),
        getFirstListItem: vi.fn(),
        getFullList: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }))
    } as unknown as PocketBase
  })

  describe('Template Management', () => {
    describe('createTemplate', () => {
      it('should create a new template', async () => {
        const createdRecord = {
          id: 'tpl-001',
          editionId: 'edition-001',
          type: 'accepted',
          name: 'Test Template',
          subject: 'Test Subject',
          body: 'Test Body',
          includeReviewerComments: false,
          isDefault: false,
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }

        mockPb = {
          collection: vi.fn(() => ({
            create: vi.fn().mockResolvedValue(createdRecord)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.createTemplate({
          editionId: 'edition-001',
          type: 'accepted',
          name: 'Test Template',
          subject: 'Test Subject',
          body: 'Test Body',
          includeReviewerComments: false,
          isDefault: false
        })

        expect(result.id).toBe('tpl-001')
        expect(result.type).toBe('accepted')
        expect(result.name).toBe('Test Template')
      })
    })

    describe('updateTemplate', () => {
      it('should update a template', async () => {
        const updatedRecord = {
          id: 'tpl-001',
          editionId: 'edition-001',
          type: 'accepted',
          name: 'Updated Name',
          subject: 'Updated Subject',
          body: 'Test Body',
          includeReviewerComments: true,
          isDefault: false,
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-02T00:00:00Z'
        }

        mockPb = {
          collection: vi.fn(() => ({
            update: vi.fn().mockResolvedValue(updatedRecord)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.updateTemplate('tpl-001', {
          name: 'Updated Name',
          subject: 'Updated Subject',
          includeReviewerComments: true
        })

        expect(result.name).toBe('Updated Name')
        expect(result.subject).toBe('Updated Subject')
        expect(result.includeReviewerComments).toBe(true)
      })
    })

    describe('getTemplateById', () => {
      it('should return template if found', async () => {
        const record = {
          id: 'tpl-001',
          editionId: 'edition-001',
          type: 'accepted',
          name: 'Test Template',
          subject: 'Test Subject',
          body: 'Test Body',
          includeReviewerComments: false,
          isDefault: true,
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }

        mockPb = {
          collection: vi.fn(() => ({
            getOne: vi.fn().mockResolvedValue(record)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.getTemplateById('tpl-001')

        expect(result).not.toBeNull()
        expect(result?.id).toBe('tpl-001')
      })

      it('should return null if template not found', async () => {
        mockPb = {
          collection: vi.fn(() => ({
            getOne: vi.fn().mockRejectedValue(new Error('Not found'))
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.getTemplateById('tpl-999')

        expect(result).toBeNull()
      })
    })

    describe('listTemplatesByEdition', () => {
      it('should return all templates for an edition', async () => {
        const records = [
          {
            id: 'tpl-001',
            editionId: 'edition-001',
            type: 'accepted',
            name: 'Accepted Template',
            subject: 'Subject 1',
            body: 'Body 1',
            created: '2025-01-01T00:00:00Z',
            updated: '2025-01-01T00:00:00Z'
          },
          {
            id: 'tpl-002',
            editionId: 'edition-001',
            type: 'rejected',
            name: 'Rejected Template',
            subject: 'Subject 2',
            body: 'Body 2',
            created: '2025-01-01T00:00:00Z',
            updated: '2025-01-01T00:00:00Z'
          }
        ]

        mockPb = {
          collection: vi.fn(() => ({
            getFullList: vi.fn().mockResolvedValue(records)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.listTemplatesByEdition('edition-001')

        expect(result).toHaveLength(2)
        expect(result[0].type).toBe('accepted')
        expect(result[1].type).toBe('rejected')
      })
    })
  })

  describe('Feedback Management', () => {
    describe('createFeedback', () => {
      it('should create feedback in draft status', async () => {
        const createdRecord = {
          id: 'fb-001',
          talkId: 'talk-001',
          speakerId: 'speaker-001',
          templateId: 'tpl-001',
          subject: 'Test Subject',
          body: 'Test Body',
          status: 'draft',
          createdBy: 'user-001',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }

        mockPb = {
          collection: vi.fn(() => ({
            create: vi.fn().mockResolvedValue(createdRecord)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.createFeedback({
          talkId: 'talk-001',
          speakerId: 'speaker-001',
          templateId: 'tpl-001',
          subject: 'Test Subject',
          body: 'Test Body',
          status: 'draft',
          createdBy: 'user-001'
        })

        expect(result.id).toBe('fb-001')
        expect(result.status).toBe('draft')
      })
    })

    describe('getFeedbackByTalkAndSpeaker', () => {
      it('should return feedback if exists', async () => {
        const record = {
          id: 'fb-001',
          talkId: 'talk-001',
          speakerId: 'speaker-001',
          subject: 'Test',
          body: 'Body',
          status: 'sent',
          sentAt: '2025-01-02T00:00:00Z',
          createdBy: 'user-001',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }

        mockPb = {
          collection: vi.fn(() => ({
            getFirstListItem: vi.fn().mockResolvedValue(record)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.getFeedbackByTalkAndSpeaker('talk-001', 'speaker-001')

        expect(result).not.toBeNull()
        expect(result?.status).toBe('sent')
      })

      it('should return null if feedback not found', async () => {
        mockPb = {
          collection: vi.fn(() => ({
            getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.getFeedbackByTalkAndSpeaker('talk-001', 'speaker-001')

        expect(result).toBeNull()
      })
    })

    describe('listFeedbackByTalk', () => {
      it('should return all feedbacks for a talk', async () => {
        const records = [
          {
            id: 'fb-001',
            talkId: 'talk-001',
            speakerId: 'speaker-001',
            subject: 'Subject 1',
            body: 'Body 1',
            status: 'sent',
            createdBy: 'user-001',
            created: '2025-01-01T00:00:00Z',
            updated: '2025-01-01T00:00:00Z'
          },
          {
            id: 'fb-002',
            talkId: 'talk-001',
            speakerId: 'speaker-002',
            subject: 'Subject 2',
            body: 'Body 2',
            status: 'draft',
            createdBy: 'user-001',
            created: '2025-01-01T00:00:00Z',
            updated: '2025-01-01T00:00:00Z'
          }
        ]

        mockPb = {
          collection: vi.fn(() => ({
            getFullList: vi.fn().mockResolvedValue(records)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.listFeedbackByTalk('talk-001')

        expect(result).toHaveLength(2)
      })
    })
  })

  describe('Feedback Sending', () => {
    describe('sendFeedback', () => {
      it('should send feedback and update status', async () => {
        const feedback = {
          id: 'fb-001',
          talkId: 'talk-001',
          speakerId: 'speaker-001',
          subject: 'Test Subject',
          body: 'Test Body',
          status: 'draft',
          createdBy: 'user-001',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }

        const speaker = {
          id: 'speaker-001',
          email: 'speaker@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }

        const updatedFeedback = {
          ...feedback,
          status: 'sent',
          sentAt: '2025-01-02T00:00:00Z'
        }

        mockPb = {
          collection: vi.fn((name) => {
            if (name === 'speaker_feedbacks') {
              return {
                getOne: vi.fn().mockResolvedValue(feedback),
                update: vi.fn().mockResolvedValue(updatedFeedback)
              }
            }
            if (name === 'speakers') {
              return {
                getOne: vi.fn().mockResolvedValue(speaker)
              }
            }
            return { getOne: vi.fn() }
          })
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.sendFeedback('fb-001')

        expect(result.status).toBe('sent')
        expect(mockEmailService.send).toHaveBeenCalledWith({
          to: 'speaker@example.com',
          subject: 'Test Subject',
          html: expect.any(String),
          text: expect.any(String)
        })
      })

      it('should throw error if feedback not found', async () => {
        mockPb = {
          collection: vi.fn(() => ({
            getOne: vi.fn().mockRejectedValue(new Error('Not found'))
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)

        await expect(service.sendFeedback('fb-999')).rejects.toThrow('Feedback not found')
      })

      it('should throw error if feedback already sent', async () => {
        const feedback = {
          id: 'fb-001',
          talkId: 'talk-001',
          speakerId: 'speaker-001',
          subject: 'Test',
          body: 'Body',
          status: 'sent',
          createdBy: 'user-001',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }

        mockPb = {
          collection: vi.fn(() => ({
            getOne: vi.fn().mockResolvedValue(feedback)
          }))
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)

        await expect(service.sendFeedback('fb-001')).rejects.toThrow('Feedback already sent')
      })

      it('should handle email sending failure', async () => {
        const feedback = {
          id: 'fb-001',
          talkId: 'talk-001',
          speakerId: 'speaker-001',
          subject: 'Test',
          body: 'Body',
          status: 'draft',
          createdBy: 'user-001',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }

        const speaker = {
          id: 'speaker-001',
          email: 'speaker@example.com'
        }

        const failedFeedback = {
          ...feedback,
          status: 'failed',
          error: 'SMTP error'
        }

        mockPb = {
          collection: vi.fn((name) => {
            if (name === 'speaker_feedbacks') {
              return {
                getOne: vi.fn().mockResolvedValue(feedback),
                update: vi.fn().mockResolvedValue(failedFeedback)
              }
            }
            if (name === 'speakers') {
              return {
                getOne: vi.fn().mockResolvedValue(speaker)
              }
            }
            return { getOne: vi.fn() }
          })
        } as unknown as PocketBase

        mockEmailService = {
          send: vi.fn().mockResolvedValue({ success: false, error: 'SMTP error' })
        }

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const result = await service.sendFeedback('fb-001')

        expect(result.status).toBe('failed')
        expect(result.error).toBe('SMTP error')
      })
    })

    describe('sendBulkFeedback', () => {
      it('should send multiple feedbacks', async () => {
        const feedbacks = [
          {
            id: 'fb-001',
            talkId: 'talk-001',
            speakerId: 'speaker-001',
            subject: 'Subject 1',
            body: 'Body 1',
            status: 'draft',
            createdBy: 'user-001',
            created: '2025-01-01T00:00:00Z',
            updated: '2025-01-01T00:00:00Z'
          },
          {
            id: 'fb-002',
            talkId: 'talk-001',
            speakerId: 'speaker-002',
            subject: 'Subject 2',
            body: 'Body 2',
            status: 'draft',
            createdBy: 'user-001',
            created: '2025-01-01T00:00:00Z',
            updated: '2025-01-01T00:00:00Z'
          }
        ]

        const speaker = {
          id: 'speaker-001',
          email: 'speaker@example.com'
        }

        let callCount = 0
        mockPb = {
          collection: vi.fn((name) => {
            if (name === 'speaker_feedbacks') {
              return {
                getOne: vi.fn().mockImplementation(() => {
                  const fb = feedbacks[callCount % 2]
                  return Promise.resolve(fb)
                }),
                update: vi.fn().mockImplementation((id) => {
                  callCount++
                  return Promise.resolve({
                    ...feedbacks.find((f) => f.id === id),
                    status: 'sent',
                    sentAt: '2025-01-02T00:00:00Z'
                  })
                })
              }
            }
            if (name === 'speakers') {
              return {
                getOne: vi.fn().mockResolvedValue(speaker)
              }
            }
            return { getOne: vi.fn() }
          })
        } as unknown as PocketBase

        const service = createSpeakerFeedbackService(mockPb, mockEmailService)
        const results = await service.sendBulkFeedback(['fb-001', 'fb-002'])

        expect(results).toHaveLength(2)
        expect(results[0].success).toBe(true)
        expect(results[1].success).toBe(true)
      })
    })
  })

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined)
      mockPb = {
        collection: vi.fn(() => ({
          delete: deleteMock
        }))
      } as unknown as PocketBase

      const service = createSpeakerFeedbackService(mockPb, mockEmailService)
      await service.deleteTemplate('tpl-001')

      expect(deleteMock).toHaveBeenCalledWith('tpl-001')
    })
  })

  describe('deleteFeedback', () => {
    it('should delete a feedback', async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined)
      mockPb = {
        collection: vi.fn(() => ({
          delete: deleteMock
        }))
      } as unknown as PocketBase

      const service = createSpeakerFeedbackService(mockPb, mockEmailService)
      await service.deleteFeedback('fb-001')

      expect(deleteMock).toHaveBeenCalledWith('fb-001')
    })
  })
})
