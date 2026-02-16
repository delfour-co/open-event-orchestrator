import { describe, expect, it, vi } from 'vitest'
import type { ReportConfig } from '../domain/report-config'
import { createReportSchedulerService } from './report-scheduler-service'

const createMockConfig = (): ReportConfig => ({
  id: 'cfg-123',
  editionId: 'ed-456',
  name: 'Weekly Report',
  enabled: true,
  frequency: 'weekly',
  dayOfWeek: 'monday',
  timeOfDay: '09:00',
  timezone: 'Europe/Paris',
  recipientRoles: ['admin', 'organizer'],
  recipients: [
    { email: 'test1@example.com', name: 'Test User 1' },
    { email: 'test2@example.com', name: 'Test User 2' }
  ],
  sections: ['cfp', 'billing'],
  createdAt: new Date(),
  updatedAt: new Date()
})

const createMockDependencies = () => {
  const mockConfig = createMockConfig()

  const mockEmailService = {
    send: vi.fn().mockResolvedValue({ success: true })
  }

  const mockReportGenerator = {
    generateReport: vi.fn().mockResolvedValue({
      config: mockConfig,
      data: {},
      html: '<html>Report</html>',
      text: 'Report',
      subject: 'Weekly Report'
    }),
    generateReportData: vi.fn()
  }

  const mockPb = {
    collection: vi.fn().mockReturnValue({
      getOne: vi.fn().mockResolvedValue({
        ...mockConfig,
        created: mockConfig.createdAt.toISOString(),
        updated: mockConfig.updatedAt.toISOString(),
        recipients: JSON.stringify(mockConfig.recipients),
        sections: JSON.stringify(mockConfig.sections)
      }),
      getList: vi.fn().mockResolvedValue({ items: [] }),
      getFullList: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({
        ...mockConfig,
        created: mockConfig.createdAt.toISOString(),
        updated: mockConfig.updatedAt.toISOString(),
        recipients: JSON.stringify(mockConfig.recipients),
        sections: JSON.stringify(mockConfig.sections)
      }),
      delete: vi.fn()
    })
  }

  return {
    // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
    pb: mockPb as any,
    emailService: mockEmailService,
    reportGenerator: mockReportGenerator
  }
}

describe('createReportSchedulerService', () => {
  describe('sendReport', () => {
    it('sends report to all recipients', async () => {
      const deps = createMockDependencies()
      const service = createReportSchedulerService(deps)

      const config = createMockConfig()
      const result = await service.sendReport(config)

      expect(result.success).toBe(true)
      expect(result.recipientsSent).toBe(2)
      expect(result.recipientsFailed).toBe(0)
      expect(deps.emailService.send).toHaveBeenCalledTimes(2)
    })

    it('handles partial send failures', async () => {
      const deps = createMockDependencies()
      deps.emailService.send
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Failed' })

      const service = createReportSchedulerService(deps)

      const config = createMockConfig()
      const result = await service.sendReport(config)

      expect(result.success).toBe(true)
      expect(result.recipientsSent).toBe(1)
      expect(result.recipientsFailed).toBe(1)
    })

    it('handles complete send failure', async () => {
      const deps = createMockDependencies()
      deps.emailService.send.mockResolvedValue({ success: false, error: 'Failed' })

      const service = createReportSchedulerService(deps)

      const config = createMockConfig()
      const result = await service.sendReport(config)

      expect(result.success).toBe(false)
      expect(result.recipientsSent).toBe(0)
      expect(result.recipientsFailed).toBe(2)
      expect(result.error).toBe('Failed to send to any recipients')
    })

    it('handles report generation error', async () => {
      const deps = createMockDependencies()
      deps.reportGenerator.generateReport.mockRejectedValue(new Error('Generation failed'))

      const service = createReportSchedulerService(deps)

      const config = createMockConfig()
      const result = await service.sendReport(config)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Generation failed')
    })
  })

  describe('sendTestReport', () => {
    it('sends test report with [TEST] prefix', async () => {
      const deps = createMockDependencies()
      const service = createReportSchedulerService(deps)

      const result = await service.sendTestReport('cfg-123', 'test@example.com')

      expect(result.success).toBe(true)
      expect(deps.emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('[TEST]')
        })
      )
    })

    it('returns error if config not found', async () => {
      const deps = createMockDependencies()
      deps.pb.collection().getOne.mockRejectedValue(new Error('Not found'))

      const service = createReportSchedulerService(deps)

      const result = await service.sendTestReport('invalid-id', 'test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('processDueReports', () => {
    it('processes all due reports', async () => {
      const deps = createMockDependencies()
      const config1 = { ...createMockConfig(), id: 'cfg-1' }
      const config2 = { ...createMockConfig(), id: 'cfg-2' }

      const mockCollection = deps.pb.collection()
      mockCollection.getFullList.mockResolvedValue([
        {
          ...config1,
          created: config1.createdAt.toISOString(),
          updated: config1.updatedAt.toISOString(),
          recipients: JSON.stringify(config1.recipients),
          sections: JSON.stringify(config1.sections)
        },
        {
          ...config2,
          created: config2.createdAt.toISOString(),
          updated: config2.updatedAt.toISOString(),
          recipients: JSON.stringify(config2.recipients),
          sections: JSON.stringify(config2.sections)
        }
      ])

      const service = createReportSchedulerService(deps)

      const result = await service.processDueReports()

      expect(result.processed).toBe(2)
      expect(result.succeeded).toBe(2)
      expect(result.failed).toBe(0)
    })

    it('handles mixed success and failure', async () => {
      const deps = createMockDependencies()
      const config1 = { ...createMockConfig(), id: 'cfg-1' }
      const config2 = { ...createMockConfig(), id: 'cfg-2' }

      const mockCollection = deps.pb.collection()
      mockCollection.getFullList.mockResolvedValue([
        {
          ...config1,
          created: config1.createdAt.toISOString(),
          updated: config1.updatedAt.toISOString(),
          recipients: JSON.stringify(config1.recipients),
          sections: JSON.stringify(config1.sections)
        },
        {
          ...config2,
          created: config2.createdAt.toISOString(),
          updated: config2.updatedAt.toISOString(),
          recipients: JSON.stringify(config2.recipients),
          sections: JSON.stringify(config2.sections)
        }
      ])

      deps.reportGenerator.generateReport
        .mockResolvedValueOnce({
          config: config1,
          data: {},
          html: '<html></html>',
          text: 'text',
          subject: 'Subject 1'
        })
        .mockRejectedValueOnce(new Error('Failed'))

      const service = createReportSchedulerService(deps)

      const result = await service.processDueReports()

      expect(result.processed).toBe(2)
      expect(result.succeeded).toBe(1)
      expect(result.failed).toBe(1)
    })
  })

  describe('getUpcomingReports', () => {
    it('returns enabled reports sorted by next scheduled date', async () => {
      const deps = createMockDependencies()
      const now = new Date()
      const config1 = {
        ...createMockConfig(),
        id: 'cfg-1',
        nextScheduledAt: new Date(now.getTime() + 3600000)
      }
      const config2 = {
        ...createMockConfig(),
        id: 'cfg-2',
        nextScheduledAt: new Date(now.getTime() + 1800000)
      }

      const mockCollection = deps.pb.collection()
      mockCollection.getList.mockResolvedValue({
        items: [
          {
            ...config1,
            created: config1.createdAt.toISOString(),
            updated: config1.updatedAt.toISOString(),
            nextScheduledAt: config1.nextScheduledAt?.toISOString(),
            recipients: JSON.stringify(config1.recipients),
            sections: JSON.stringify(config1.sections)
          },
          {
            ...config2,
            created: config2.createdAt.toISOString(),
            updated: config2.updatedAt.toISOString(),
            nextScheduledAt: config2.nextScheduledAt?.toISOString(),
            recipients: JSON.stringify(config2.recipients),
            sections: JSON.stringify(config2.sections)
          }
        ]
      })

      const service = createReportSchedulerService(deps)

      const upcoming = await service.getUpcomingReports('ed-456')

      expect(upcoming).toHaveLength(2)
      expect(upcoming[0].id).toBe('cfg-2')
      expect(upcoming[1].id).toBe('cfg-1')
    })
  })
})
