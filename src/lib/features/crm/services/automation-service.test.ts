import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutomationService } from './automation-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found')),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-id',
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    update: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('AutomationService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createAutomationService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createAutomationService(pb)
  })

  describe('create', () => {
    it('should create an automation', async () => {
      const result = await service.create({
        eventId: 'evt-1',
        name: 'Welcome Flow',
        triggerType: 'contact_created',
        triggerConfig: { type: 'contact_created' }
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('automations').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-1',
          name: 'Welcome Flow',
          triggerType: 'contact_created',
          status: 'draft'
        })
      )
    })

    it('should use provided edition and description', async () => {
      await service.create({
        eventId: 'evt-1',
        editionId: 'ed-1',
        name: 'Test',
        description: 'Test description',
        triggerType: 'ticket_purchased',
        triggerConfig: { type: 'ticket_purchased' }
      })

      expect(pb.collection('automations').create).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'ed-1',
          description: 'Test description'
        })
      )
    })
  })

  describe('update', () => {
    it('should update automation fields', async () => {
      await service.update('auto-1', {
        name: 'Updated Name',
        description: 'New description'
      })

      expect(pb.collection('automations').update).toHaveBeenCalledWith('auto-1', {
        name: 'Updated Name',
        description: 'New description'
      })
    })
  })

  describe('delete', () => {
    it('should delete an automation', async () => {
      await service.delete('auto-1')

      expect(pb.collection('automations').delete).toHaveBeenCalledWith('auto-1')
    })
  })

  describe('get', () => {
    it('should return automation by id', async () => {
      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        eventId: 'evt-1',
        name: 'Test',
        triggerType: 'contact_created',
        triggerConfig: { type: 'contact_created' },
        status: 'draft',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.get('auto-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('auto-1')
    })

    it('should return null for non-existent automation', async () => {
      pb.collection('automations').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.get('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getByEvent', () => {
    it('should return automations for event', async () => {
      pb.collection('automations').getFullList.mockResolvedValue([
        {
          id: 'auto-1',
          eventId: 'evt-1',
          name: 'Flow 1',
          triggerType: 'contact_created',
          triggerConfig: {},
          status: 'active',
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getByEvent('evt-1')

      expect(result).toHaveLength(1)
    })

    it('should filter by status', async () => {
      await service.getByEvent('evt-1', 'active')

      expect(pb.collection('automations').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('active')
        })
      )
    })
  })

  describe('createStep', () => {
    it('should create a step', async () => {
      const result = await service.createStep({
        automationId: 'auto-1',
        type: 'send_email',
        config: { templateId: 'tpl-1' },
        position: 0
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('automation_steps').create).toHaveBeenCalledWith(
        expect.objectContaining({
          automationId: 'auto-1',
          type: 'send_email',
          position: 0
        })
      )
    })

    it('should reject invalid step config', async () => {
      await expect(
        service.createStep({
          automationId: 'auto-1',
          type: 'send_email',
          config: {} as never, // Missing templateId - intentionally invalid for test
          position: 0
        })
      ).rejects.toThrow('Template ID is required')
    })

    it('should validate wait step config', async () => {
      await expect(
        service.createStep({
          automationId: 'auto-1',
          type: 'wait',
          config: { duration: 5 } as never, // Missing unit - intentionally invalid for test
          position: 0
        })
      ).rejects.toThrow('Duration and unit are required')
    })
  })

  describe('updateStep', () => {
    it('should update step config', async () => {
      await service.updateStep('step-1', {
        config: { templateId: 'tpl-2' }
      })

      expect(pb.collection('automation_steps').update).toHaveBeenCalledWith('step-1', {
        config: { templateId: 'tpl-2' }
      })
    })

    it('should clear nextStepId when set to null', async () => {
      await service.updateStep('step-1', { nextStepId: null })

      expect(pb.collection('automation_steps').update).toHaveBeenCalledWith('step-1', {
        nextStepId: ''
      })
    })
  })

  describe('getSteps', () => {
    it('should return steps for automation', async () => {
      pb.collection('automation_steps').getFullList.mockResolvedValue([
        {
          id: 'step-1',
          automationId: 'auto-1',
          type: 'send_email',
          config: { templateId: 'tpl-1' },
          position: 0,
          created: now.toISOString(),
          updated: now.toISOString()
        },
        {
          id: 'step-2',
          automationId: 'auto-1',
          type: 'wait',
          config: { duration: 24, unit: 'hours' },
          position: 1,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getSteps('auto-1')

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('send_email')
      expect(result[1].type).toBe('wait')
    })
  })

  describe('reorderSteps', () => {
    it('should update step positions', async () => {
      await service.reorderSteps('auto-1', ['step-2', 'step-1', 'step-3'])

      expect(pb.collection('automation_steps').update).toHaveBeenCalledWith('step-2', {
        position: 0
      })
      expect(pb.collection('automation_steps').update).toHaveBeenCalledWith('step-1', {
        position: 1
      })
      expect(pb.collection('automation_steps').update).toHaveBeenCalledWith('step-3', {
        position: 2
      })
    })
  })

  describe('setStartStep', () => {
    it('should update start step', async () => {
      await service.setStartStep('auto-1', 'step-1')

      expect(pb.collection('automations').update).toHaveBeenCalledWith('auto-1', {
        startStepId: 'step-1'
      })
    })
  })

  describe('activate', () => {
    it('should activate valid automation', async () => {
      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        status: 'draft',
        startStepId: 'step-1',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('automation_steps').getFullList.mockResolvedValue([
        {
          id: 'step-1',
          type: 'send_email',
          config: { templateId: 'tpl-1' },
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.activate('auto-1')

      expect(result.success).toBe(true)
      expect(pb.collection('automations').update).toHaveBeenCalledWith('auto-1', {
        status: 'active'
      })
    })

    it('should reject automation without steps', async () => {
      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        status: 'draft',
        startStepId: 'step-1',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('automation_steps').getFullList.mockResolvedValue([])

      const result = await service.activate('auto-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('at least one step')
    })

    it('should reject automation without start step', async () => {
      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        status: 'draft',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('automation_steps').getFullList.mockResolvedValue([
        { id: 'step-1', created: now.toISOString(), updated: now.toISOString() }
      ])

      const result = await service.activate('auto-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('start step')
    })
  })

  describe('pause', () => {
    it('should pause an automation', async () => {
      await service.pause('auto-1')

      expect(pb.collection('automations').update).toHaveBeenCalledWith('auto-1', {
        status: 'paused'
      })
    })
  })

  describe('enrollContact', () => {
    it('should enroll contact in active automation', async () => {
      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        status: 'active',
        startStepId: 'step-1',
        enrollmentCount: 5,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.enrollContact('auto-1', 'contact-1')

      expect(result.id).toBeDefined()
      expect(pb.collection('automation_enrollments').create).toHaveBeenCalledWith(
        expect.objectContaining({
          automationId: 'auto-1',
          contactId: 'contact-1',
          status: 'active'
        })
      )
      expect(pb.collection('automations').update).toHaveBeenCalledWith('auto-1', {
        enrollmentCount: 6
      })
    })

    it('should reject enrollment in inactive automation', async () => {
      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        status: 'draft',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      await expect(service.enrollContact('auto-1', 'contact-1')).rejects.toThrow('not active')
    })
  })

  describe('exitEnrollment', () => {
    it('should exit enrollment with reason', async () => {
      await service.exitEnrollment('enroll-1', 'Manually removed')

      expect(pb.collection('automation_enrollments').update).toHaveBeenCalledWith(
        'enroll-1',
        expect.objectContaining({
          status: 'exited',
          exitReason: 'Manually removed'
        })
      )
    })
  })

  describe('getEnrollments', () => {
    it('should return enrollments for automation', async () => {
      pb.collection('automation_enrollments').getFullList.mockResolvedValue([
        {
          id: 'enroll-1',
          automationId: 'auto-1',
          contactId: 'contact-1',
          status: 'active',
          startedAt: now.toISOString(),
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getEnrollments('auto-1')

      expect(result).toHaveLength(1)
    })
  })

  describe('handleTrigger', () => {
    it('should find matching automations and enroll contact', async () => {
      pb.collection('automations').getFullList.mockResolvedValue([
        {
          id: 'auto-1',
          eventId: 'evt-1',
          triggerType: 'contact_created',
          triggerConfig: { type: 'contact_created' },
          status: 'active',
          startStepId: 'step-1',
          enrollmentCount: 0,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        status: 'active',
        startStepId: 'step-1',
        enrollmentCount: 0,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('automation_steps').getFullList.mockResolvedValue([])

      const result = await service.handleTrigger(
        'contact_created',
        { contactId: 'contact-1' },
        'evt-1'
      )

      expect(result).toHaveLength(1)
      expect(pb.collection('automation_enrollments').create).toHaveBeenCalled()
    })

    it('should filter by trigger config', async () => {
      pb.collection('automations').getFullList.mockResolvedValue([
        {
          id: 'auto-1',
          eventId: 'evt-1',
          triggerType: 'tag_added',
          triggerConfig: { type: 'tag_added', tagIds: ['tag-vip'] },
          status: 'active',
          startStepId: 'step-1',
          enrollmentCount: 0,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      // Non-matching tag
      const result = await service.handleTrigger(
        'tag_added',
        { contactId: 'contact-1', tagId: 'tag-other' },
        'evt-1'
      )

      expect(result).toHaveLength(0)
    })
  })

  describe('getLogs', () => {
    it('should return logs for automation', async () => {
      pb.collection('automation_logs').getList.mockResolvedValue({
        items: [
          {
            id: 'log-1',
            automationId: 'auto-1',
            enrollmentId: 'enroll-1',
            contactId: 'contact-1',
            stepId: 'step-1',
            stepType: 'send_email',
            status: 'completed',
            executedAt: now.toISOString(),
            created: now.toISOString()
          }
        ],
        totalItems: 1
      })

      const result = await service.getLogs('auto-1')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('completed')
    })

    it('should filter by contact', async () => {
      await service.getLogs('auto-1', { contactId: 'contact-1' })

      expect(pb.collection('automation_logs').getList).toHaveBeenCalledWith(
        1,
        100,
        expect.objectContaining({
          filter: expect.stringContaining('contact-1')
        })
      )
    })

    it('should limit results', async () => {
      await service.getLogs('auto-1', { limit: 50 })

      expect(pb.collection('automation_logs').getList).toHaveBeenCalledWith(
        1,
        50,
        expect.anything()
      )
    })
  })

  describe('processWaitingEnrollments', () => {
    it('should process enrollments past wait time', async () => {
      const pastWait = new Date(now.getTime() - 60000).toISOString()

      pb.collection('automation_enrollments').getFullList.mockResolvedValue([
        {
          id: 'enroll-1',
          automationId: 'auto-1',
          contactId: 'contact-1',
          currentStepId: 'step-wait',
          status: 'active',
          waitUntil: pastWait,
          startedAt: now.toISOString(),
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      pb.collection('automations').getOne.mockResolvedValue({
        id: 'auto-1',
        status: 'active',
        completedCount: 0,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('automation_steps').getFullList.mockResolvedValue([
        {
          id: 'step-wait',
          type: 'wait',
          config: { duration: 1, unit: 'hours' },
          position: 0,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.processWaitingEnrollments()

      expect(result).toBe(1)
      expect(pb.collection('automation_enrollments').update).toHaveBeenCalledWith(
        'enroll-1',
        expect.objectContaining({ waitUntil: null })
      )
    })
  })

  describe('duplicate', () => {
    it('should duplicate automation with steps', async () => {
      // First call returns original, second call returns the newly created
      pb.collection('automations')
        .getOne.mockResolvedValueOnce({
          id: 'auto-1',
          eventId: 'evt-1',
          name: 'Original',
          description: 'Desc',
          triggerType: 'contact_created',
          triggerConfig: { type: 'contact_created' },
          startStepId: 'step-1',
          created: now.toISOString(),
          updated: now.toISOString()
        })
        .mockResolvedValueOnce({
          id: 'new-id',
          eventId: 'evt-1',
          name: 'Copy of Original',
          description: 'Desc',
          triggerType: 'contact_created',
          triggerConfig: { type: 'contact_created' },
          startStepId: 'new-step-1',
          created: now.toISOString(),
          updated: now.toISOString()
        })

      pb.collection('automation_steps').getFullList.mockResolvedValue([
        {
          id: 'step-1',
          automationId: 'auto-1',
          type: 'send_email',
          config: { templateId: 'tpl-1' },
          position: 0,
          nextStepId: 'step-2',
          created: now.toISOString(),
          updated: now.toISOString()
        },
        {
          id: 'step-2',
          automationId: 'auto-1',
          type: 'wait',
          config: { duration: 24, unit: 'hours' },
          position: 1,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.duplicate('auto-1', 'Copy of Original')

      expect(result.name).toBe('Copy of Original')
      expect(pb.collection('automations').create).toHaveBeenCalled()
      expect(pb.collection('automation_steps').create).toHaveBeenCalledTimes(2)
    })

    it('should throw for non-existent automation', async () => {
      pb.collection('automations').getOne.mockRejectedValue(new Error('Not found'))

      await expect(service.duplicate('non-existent', 'Copy')).rejects.toThrow('not found')
    })
  })
})
