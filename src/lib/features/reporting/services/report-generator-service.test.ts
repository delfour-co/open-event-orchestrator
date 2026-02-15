import { describe, expect, it, vi } from 'vitest'
import type { EditionMetrics } from '../domain/metrics'
import { createEmptyEditionMetrics } from '../domain/metrics'
import type { ReportConfig } from '../domain/report-config'
import {
  createReportGeneratorService,
  generateHtmlReport,
  generateTextReport
} from './report-generator-service'

const createMockPocketBase = () => ({
  collection: vi.fn().mockReturnValue({
    getOne: vi.fn().mockResolvedValue({
      name: 'Test Edition',
      expand: {
        eventId: { name: 'Test Event' }
      }
    })
  })
})

const createMockMetrics = (): EditionMetrics => ({
  ...createEmptyEditionMetrics(),
  billing: {
    totalRevenue: 150000,
    currency: 'EUR',
    ticketsSold: 50,
    ticketsAvailable: 100,
    ordersCount: 45,
    paidOrdersCount: 40,
    checkInRate: 0,
    ticketsCheckedIn: 0
  },
  cfp: {
    totalSubmissions: 100,
    pendingReviews: 20,
    acceptedTalks: 30,
    rejectedTalks: 50,
    speakersCount: 80,
    averageRating: 3.5
  }
})

const createMockConfig = (): ReportConfig => ({
  id: 'cfg-123',
  editionId: 'ed-456',
  name: 'Weekly Report',
  enabled: true,
  frequency: 'weekly',
  dayOfWeek: 'monday',
  timeOfDay: '09:00',
  timezone: 'Europe/Paris',
  recipients: [{ email: 'test@example.com', name: 'Test User' }],
  sections: ['cfp', 'billing'],
  createdAt: new Date(),
  updatedAt: new Date()
})

describe('createReportGeneratorService', () => {
  it('generates report with all selected sections', async () => {
    const mockPb = createMockPocketBase()
    const mockMetrics = createMockMetrics()
    const mockFetchMetrics = vi.fn().mockResolvedValue(mockMetrics)

    const service = createReportGeneratorService({
      pb: mockPb as never,
      fetchMetrics: mockFetchMetrics
    })

    const config = createMockConfig()
    const report = await service.generateReport(config)

    expect(report.config).toBe(config)
    expect(report.data.cfp).toBeDefined()
    expect(report.data.billing).toBeDefined()
    expect(report.data.planning).toBeUndefined()
    expect(report.subject).toContain('Weekly Report')
    expect(report.html).toContain('CFP')
    expect(report.html).toContain('Billing')
  })

  it('generates report data with correct period for weekly', async () => {
    const mockPb = createMockPocketBase()
    const mockMetrics = createMockMetrics()
    const mockFetchMetrics = vi.fn().mockResolvedValue(mockMetrics)

    const service = createReportGeneratorService({
      pb: mockPb as never,
      fetchMetrics: mockFetchMetrics
    })

    const config = createMockConfig()
    const data = await service.generateReportData(config, 'Test Edition', 'Test Event')

    const periodDays =
      (data.period.end.getTime() - data.period.start.getTime()) / (1000 * 60 * 60 * 24)
    expect(Math.round(periodDays)).toBe(7)
  })

  it('calculates CFP metrics correctly', async () => {
    const mockPb = createMockPocketBase()
    const mockMetrics = createMockMetrics()
    const mockFetchMetrics = vi.fn().mockResolvedValue(mockMetrics)

    const service = createReportGeneratorService({
      pb: mockPb as never,
      fetchMetrics: mockFetchMetrics
    })

    const config = createMockConfig()
    const data = await service.generateReportData(config, 'Test Edition', 'Test Event')

    expect(data.cfp?.totalSubmissions).toBe(100)
    expect(data.cfp?.acceptedTalks).toBe(30)
    expect(data.cfp?.acceptanceRate).toBe(30)
  })

  it('calculates billing capacity correctly', async () => {
    const mockPb = createMockPocketBase()
    const mockMetrics = createMockMetrics()
    const mockFetchMetrics = vi.fn().mockResolvedValue(mockMetrics)

    const service = createReportGeneratorService({
      pb: mockPb as never,
      fetchMetrics: mockFetchMetrics
    })

    const config = createMockConfig()
    const data = await service.generateReportData(config, 'Test Edition', 'Test Event')

    expect(data.billing?.ticketsSold).toBe(50)
    expect(data.billing?.ticketsRemaining).toBe(100)
    expect(Math.round(data.billing?.capacityPercentage ?? 0)).toBeCloseTo(33, 0)
  })
})

describe('generateHtmlReport', () => {
  it('generates valid HTML structure', () => {
    const config = createMockConfig()
    const data = {
      editionId: 'ed-123',
      editionName: 'Test Edition',
      eventName: 'Test Event',
      generatedAt: new Date(),
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-08')
      },
      cfp: {
        totalSubmissions: 100,
        pendingReviews: 20,
        acceptedTalks: 30,
        rejectedTalks: 50,
        acceptanceRate: 30,
        averageReviewsPerTalk: 3.5,
        submissionsByCategory: []
      }
    }

    const html = generateHtmlReport(data, config)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Weekly Report')
    expect(html).toContain('Test Event')
    expect(html).toContain('Test Edition')
    expect(html).toContain('CFP')
    expect(html).toContain('100')
    expect(html).toContain('30')
  })

  it('includes all requested sections', () => {
    const config = { ...createMockConfig(), sections: ['cfp', 'billing', 'planning'] as const }
    const data = {
      editionId: 'ed-123',
      editionName: 'Test Edition',
      eventName: 'Test Event',
      generatedAt: new Date(),
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-08')
      },
      cfp: {
        totalSubmissions: 100,
        pendingReviews: 20,
        acceptedTalks: 30,
        rejectedTalks: 50,
        acceptanceRate: 30,
        averageReviewsPerTalk: 3.5,
        submissionsByCategory: []
      },
      billing: {
        totalOrders: 50,
        paidOrders: 45,
        totalRevenue: 150000,
        currency: 'EUR',
        ticketsSold: 60,
        ticketsRemaining: 40,
        capacityPercentage: 60,
        revenueByTicketType: []
      },
      planning: {
        totalSessions: 30,
        scheduledSessions: 25,
        unscheduledSessions: 5,
        totalRooms: 4,
        roomOccupancy: 75,
        conflictsDetected: 2,
        sessionsByTrack: []
      }
    }

    const html = generateHtmlReport(data, config)

    expect(html).toContain('CFP')
    expect(html).toContain('Billing')
    expect(html).toContain('Planning')
  })
})

describe('generateTextReport', () => {
  it('generates plain text report', () => {
    const config = createMockConfig()
    const data = {
      editionId: 'ed-123',
      editionName: 'Test Edition',
      eventName: 'Test Event',
      generatedAt: new Date(),
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-08')
      },
      cfp: {
        totalSubmissions: 100,
        pendingReviews: 20,
        acceptedTalks: 30,
        rejectedTalks: 50,
        acceptanceRate: 30,
        averageReviewsPerTalk: 3.5,
        submissionsByCategory: []
      }
    }

    const text = generateTextReport(data, config)

    expect(text).toContain('Weekly Report')
    expect(text).toContain('Test Event')
    expect(text).toContain('CFP')
    expect(text).toContain('Total Submissions: 100')
    expect(text).toContain('Accepted Talks: 30')
    expect(text).not.toContain('<')
  })

  it('formats currency correctly', () => {
    const config = { ...createMockConfig(), sections: ['billing'] as const }
    const data = {
      editionId: 'ed-123',
      editionName: 'Test Edition',
      eventName: 'Test Event',
      generatedAt: new Date(),
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-08')
      },
      billing: {
        totalOrders: 50,
        paidOrders: 45,
        totalRevenue: 150000,
        currency: 'EUR',
        ticketsSold: 60,
        ticketsRemaining: 40,
        capacityPercentage: 60,
        revenueByTicketType: []
      }
    }

    const text = generateTextReport(data, config)

    expect(text).toContain('1500.00 EUR')
  })
})
