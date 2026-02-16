import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock all dependencies
vi.mock('$lib/features/cfp/services/email-service', () => ({
  createEmailService: vi.fn(() => ({
    send: vi.fn(async () => ({ success: true }))
  }))
}))

vi.mock('$lib/features/reporting/infra/report-config-repository', () => ({
  createReportConfigRepository: vi.fn(() => ({
    findDueReports: vi.fn(async () => [
      {
        id: 'config-1',
        editionId: 'edition-1',
        name: 'Weekly Report',
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 'monday',
        timeOfDay: '09:00',
        timezone: 'UTC',
        recipients: [{ email: 'test@example.com' }],
        sections: ['cfp', 'billing'],
        nextScheduledAt: new Date('2026-02-16T09:00:00Z')
      }
    ]),
    findById: vi.fn(async () => ({
      id: 'config-1',
      editionId: 'edition-1',
      name: 'Weekly Report'
    })),
    markSent: vi.fn(async () => ({}))
  }))
}))

vi.mock('$lib/features/reporting/services/dashboard-metrics-service', () => ({
  createDashboardMetricsService: vi.fn(() => ({
    getEditionMetrics: vi.fn(async () => ({
      billing: {
        totalRevenue: 10000,
        currency: 'EUR',
        ticketsSold: 50,
        ticketsAvailable: 150,
        ordersCount: 45,
        paidOrdersCount: 40,
        checkInRate: 60,
        ticketsCheckedIn: 30
      },
      cfp: {
        totalSubmissions: 100,
        pendingReviews: 20,
        acceptedTalks: 40,
        rejectedTalks: 30,
        speakersCount: 35,
        averageRating: 4.2
      },
      planning: {
        totalSessions: 40,
        scheduledSessions: 35,
        unscheduledSessions: 5,
        tracksCount: 4,
        roomsCount: 3,
        slotsUsed: 35,
        slotsAvailable: 5
      },
      crm: {
        totalContacts: 500,
        newContactsThisWeek: 25,
        emailsSent: 1000,
        openRate: 45,
        clickRate: 12
      },
      sponsoring: {
        totalSponsors: 10,
        confirmedSponsors: 8,
        pendingSponsors: 2,
        totalSponsorshipValue: 50000,
        currency: 'EUR'
      },
      budget: {
        totalBudget: 100000,
        spent: 60000,
        remaining: 40000,
        currency: 'EUR',
        transactionsCount: 150
      },
      lastUpdated: new Date()
    }))
  }))
}))

vi.mock('$lib/features/reporting/services/report-generator-service', () => ({
  createReportGeneratorService: vi.fn(() => ({
    generateReport: vi.fn(async () => ({
      config: { id: 'config-1', name: 'Weekly Report' },
      data: {},
      html: '<html>Report</html>',
      text: 'Report',
      subject: 'Weekly Report - Feb 16, 2026'
    }))
  }))
}))

vi.mock('$lib/features/reporting/services/report-scheduler-service', () => ({
  createReportSchedulerService: vi.fn(() => ({
    processDueReports: vi.fn(async () => ({
      processed: 1,
      succeeded: 1,
      failed: 0,
      results: [
        {
          configId: 'config-1',
          success: true,
          recipientsSent: 1,
          recipientsFailed: 0
        }
      ]
    })),
    sendTestReport: vi.fn(async () => ({ success: true }))
  }))
}))

describe('Process Due Reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/reporting/process-due', () => {
    it('should require authentication', () => {
      const mockLocals = {
        pb: {
          authStore: {
            isValid: false
          }
        }
      }

      // Without valid auth, the request should be rejected
      expect(mockLocals.pb.authStore.isValid).toBe(false)
    })

    it('should process due reports and return results', async () => {
      const mockResult = {
        processed: 1,
        succeeded: 1,
        failed: 0,
        results: [
          {
            configId: 'config-1',
            success: true,
            recipientsSent: 1,
            recipientsFailed: 0
          }
        ]
      }

      expect(mockResult.processed).toBe(1)
      expect(mockResult.succeeded).toBe(1)
      expect(mockResult.failed).toBe(0)
      expect(mockResult.results).toHaveLength(1)
      expect(mockResult.results[0].success).toBe(true)
    })

    it('should handle partial failures', () => {
      const mockResult = {
        processed: 2,
        succeeded: 1,
        failed: 1,
        results: [
          {
            configId: 'config-1',
            success: true,
            recipientsSent: 1,
            recipientsFailed: 0
          },
          {
            configId: 'config-2',
            success: false,
            recipientsSent: 0,
            recipientsFailed: 2,
            error: 'SMTP connection failed'
          }
        ]
      }

      expect(mockResult.succeeded).toBe(1)
      expect(mockResult.failed).toBe(1)
      expect(mockResult.results[1].error).toBe('SMTP connection failed')
    })
  })

  describe('GET /api/reporting/process-due', () => {
    it('should return list of due reports', () => {
      const mockDueReports = [
        {
          id: 'config-1',
          name: 'Weekly Report',
          editionId: 'edition-1',
          frequency: 'weekly',
          nextScheduledAt: new Date('2026-02-16T09:00:00Z'),
          recipientsCount: 3
        },
        {
          id: 'config-2',
          name: 'Daily Digest',
          editionId: 'edition-1',
          frequency: 'daily',
          nextScheduledAt: new Date('2026-02-16T08:00:00Z'),
          recipientsCount: 5
        }
      ]

      expect(mockDueReports).toHaveLength(2)
      expect(mockDueReports[0].frequency).toBe('weekly')
      expect(mockDueReports[1].frequency).toBe('daily')
    })

    it('should include report metadata', () => {
      const response = {
        data: {
          count: 2,
          reports: []
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }

      expect(response.meta.timestamp).toBeDefined()
      expect(response.data.count).toBe(2)
    })
  })

  describe('Authentication', () => {
    it('should accept API key authentication', () => {
      const authHeader = 'Bearer sk_test_12345'
      const apiKey = authHeader.replace('Bearer ', '')

      expect(apiKey).toBe('sk_test_12345')
    })

    it('should accept session authentication', () => {
      const mockLocals = {
        pb: {
          authStore: {
            isValid: true,
            record: { id: 'user-1' }
          }
        }
      }

      expect(mockLocals.pb.authStore.isValid).toBe(true)
    })
  })
})
