import type PocketBase from 'pocketbase'
import type { EditionMetrics } from '../domain/metrics'
import type { ReportConfig } from '../domain/report-config'
import type { ReportData } from '../domain/report-data'
import { dashboardCacheService } from './dashboard-cache-service'

export interface ReportGeneratorDependencies {
  pb: PocketBase
  fetchMetrics: (editionId: string) => Promise<EditionMetrics>
}

export interface GeneratedReport {
  config: ReportConfig
  data: ReportData
  html: string
  text: string
  subject: string
}

/**
 * Creates a report generator service
 */
export const createReportGeneratorService = (deps: ReportGeneratorDependencies) => {
  const { pb, fetchMetrics } = deps

  /**
   * Generate report data for an edition
   */
  async function generateReportData(
    config: ReportConfig,
    editionName: string,
    eventName: string
  ): Promise<ReportData> {
    const metrics = await dashboardCacheService.getOrFetch(config.editionId, () =>
      fetchMetrics(config.editionId)
    )

    const now = new Date()
    const periodEnd = new Date(now)
    const periodStart = new Date(now)

    switch (config.frequency) {
      case 'daily':
        periodStart.setDate(periodStart.getDate() - 1)
        break
      case 'weekly':
        periodStart.setDate(periodStart.getDate() - 7)
        break
      case 'monthly':
        periodStart.setMonth(periodStart.getMonth() - 1)
        break
    }

    const reportData: ReportData = {
      editionId: config.editionId,
      editionName,
      eventName,
      generatedAt: now,
      period: {
        start: periodStart,
        end: periodEnd
      }
    }

    for (const section of config.sections) {
      switch (section) {
        case 'cfp':
          reportData.cfp = {
            totalSubmissions: metrics.cfp.totalSubmissions,
            pendingReviews: metrics.cfp.pendingReviews,
            acceptedTalks: metrics.cfp.acceptedTalks,
            rejectedTalks: metrics.cfp.rejectedTalks,
            acceptanceRate:
              metrics.cfp.totalSubmissions > 0
                ? (metrics.cfp.acceptedTalks / metrics.cfp.totalSubmissions) * 100
                : 0,
            averageReviewsPerTalk: metrics.cfp.averageRating,
            submissionsByCategory: []
          }
          break

        case 'billing':
          reportData.billing = {
            totalOrders: metrics.billing.ordersCount,
            paidOrders: metrics.billing.paidOrdersCount,
            totalRevenue: metrics.billing.totalRevenue,
            currency: metrics.billing.currency,
            ticketsSold: metrics.billing.ticketsSold,
            ticketsRemaining: metrics.billing.ticketsAvailable,
            capacityPercentage:
              metrics.billing.ticketsAvailable > 0
                ? (metrics.billing.ticketsSold /
                    (metrics.billing.ticketsSold + metrics.billing.ticketsAvailable)) *
                  100
                : 0,
            revenueByTicketType: []
          }
          break

        case 'planning':
          reportData.planning = {
            totalSessions: metrics.planning.totalSessions,
            scheduledSessions: metrics.planning.scheduledSessions,
            unscheduledSessions: metrics.planning.unscheduledSessions,
            totalRooms: metrics.planning.roomsCount,
            roomOccupancy:
              metrics.planning.slotsAvailable > 0
                ? (metrics.planning.slotsUsed / metrics.planning.slotsAvailable) * 100
                : 0,
            conflictsDetected: 0,
            sessionsByTrack: []
          }
          break

        case 'crm':
          reportData.crm = {
            totalContacts: metrics.crm.totalContacts,
            newContactsThisWeek: metrics.crm.newContactsThisWeek,
            activeCampaigns: 0,
            averageOpenRate: metrics.crm.openRate,
            averageClickRate: metrics.crm.clickRate,
            contactsBySegment: []
          }
          break

        case 'budget':
          reportData.budget = {
            totalBudget: metrics.budget.totalBudget,
            totalSpent: metrics.budget.spent,
            totalRevenue: metrics.billing.totalRevenue,
            balance: metrics.budget.remaining,
            currency: metrics.budget.currency,
            budgetUtilization:
              metrics.budget.totalBudget > 0
                ? (metrics.budget.spent / metrics.budget.totalBudget) * 100
                : 0,
            expensesByCategory: []
          }
          break

        case 'sponsoring':
          reportData.sponsoring = {
            totalSponsors: metrics.sponsoring.totalSponsors,
            confirmedSponsors: metrics.sponsoring.confirmedSponsors,
            pendingSponsors: metrics.sponsoring.pendingSponsors,
            totalRevenue: metrics.sponsoring.totalSponsorshipValue,
            revenueTarget: 0,
            revenueProgress: 0,
            currency: metrics.sponsoring.currency,
            sponsorsByPackage: []
          }
          break
      }
    }

    return reportData
  }

  /**
   * Generate a complete report
   */
  async function generateReport(config: ReportConfig): Promise<GeneratedReport> {
    const edition = await pb.collection('editions').getOne(config.editionId, {
      expand: 'eventId'
    })

    const editionName = edition.name as string
    const eventName = (edition.expand?.eventId as Record<string, unknown>)?.name as string

    const data = await generateReportData(config, editionName, eventName)

    const subject = `${config.name} - ${editionName} (${formatDate(data.period.start)} - ${formatDate(data.period.end)})`

    const html = generateHtmlReport(data, config)
    const text = generateTextReport(data, config)

    return {
      config,
      data,
      html,
      text,
      subject
    }
  }

  return {
    generateReportData,
    generateReport
  }
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatCurrency = (cents: number, currency: string): string => {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

const formatPercentage = (value: number): string => {
  return `${Math.round(value * 10) / 10}%`
}

/**
 * Generate HTML report content
 */
export const generateHtmlReport = (data: ReportData, config: ReportConfig): string => {
  const sections: string[] = []

  if (data.cfp) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 16px;">
          CFP (Call for Papers)
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Submissions</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.cfp.totalSubmissions}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Pending Reviews</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.cfp.pendingReviews}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Accepted Talks</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">${data.cfp.acceptedTalks}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Rejected Talks</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #dc2626;">${data.cfp.rejectedTalks}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Acceptance Rate</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatPercentage(data.cfp.acceptanceRate)}</td>
          </tr>
        </table>
      </div>
    `)
  }

  if (data.billing) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 8px; margin-bottom: 16px;">
          Billing (Tickets)
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Revenue</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(data.billing.totalRevenue, data.billing.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Paid Orders</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.billing.paidOrders} / ${data.billing.totalOrders}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Tickets Sold</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.billing.ticketsSold}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Tickets Remaining</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.billing.ticketsRemaining}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Capacity Filled</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatPercentage(data.billing.capacityPercentage)}</td>
          </tr>
        </table>
      </div>
    `)
  }

  if (data.planning) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h2 style="color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px; margin-bottom: 16px;">
          Planning (Sessions)
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Sessions</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.planning.totalSessions}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Scheduled</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">${data.planning.scheduledSessions}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Unscheduled</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #f59e0b;">${data.planning.unscheduledSessions}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Rooms</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.planning.totalRooms}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Room Occupancy</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatPercentage(data.planning.roomOccupancy)}</td>
          </tr>
        </table>
      </div>
    `)
  }

  if (data.crm) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-bottom: 16px;">
          CRM (Contacts)
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Contacts</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.crm.totalContacts}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">New This Week</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">${data.crm.newContactsThisWeek}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Average Open Rate</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatPercentage(data.crm.averageOpenRate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Average Click Rate</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatPercentage(data.crm.averageClickRate)}</td>
          </tr>
        </table>
      </div>
    `)
  }

  if (data.budget) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px; margin-bottom: 16px;">
          Budget
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Budget</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatCurrency(data.budget.totalBudget, data.budget.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Spent</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #dc2626;">${formatCurrency(data.budget.totalSpent, data.budget.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Revenue</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(data.budget.totalRevenue, data.budget.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Balance</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: ${data.budget.balance >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(data.budget.balance, data.budget.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Budget Utilization</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatPercentage(data.budget.budgetUtilization)}</td>
          </tr>
        </table>
      </div>
    `)
  }

  if (data.sponsoring) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h2 style="color: #ec4899; border-bottom: 2px solid #ec4899; padding-bottom: 8px; margin-bottom: 16px;">
          Sponsoring
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Total Sponsors</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${data.sponsoring.totalSponsors}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Confirmed</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">${data.sponsoring.confirmedSponsors}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Pending</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #f59e0b;">${data.sponsoring.pendingSponsors}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Total Revenue</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #16a34a;">${formatCurrency(data.sponsoring.totalRevenue, data.sponsoring.currency)}</td>
          </tr>
        </table>
      </div>
    `)
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.name}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: #1f2937; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">${config.name}</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">
      ${data.eventName} - ${data.editionName}
    </p>
    <p style="margin: 4px 0 0 0; opacity: 0.7; font-size: 12px;">
      Period: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}
    </p>
  </div>

  <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px;">
    ${sections.join('')}

    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
      <p>This report was automatically generated on ${formatDate(data.generatedAt)}</p>
      <p>Open Event Orchestrator</p>
    </div>
  </div>
</body>
</html>
`
}

/**
 * Generate plain text report content
 */
export const generateTextReport = (data: ReportData, config: ReportConfig): string => {
  const lines: string[] = [
    `${config.name}`,
    `${'='.repeat(config.name.length)}`,
    '',
    `${data.eventName} - ${data.editionName}`,
    `Period: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`,
    ''
  ]

  if (data.cfp) {
    lines.push(
      '--- CFP (Call for Papers) ---',
      `Total Submissions: ${data.cfp.totalSubmissions}`,
      `Pending Reviews: ${data.cfp.pendingReviews}`,
      `Accepted Talks: ${data.cfp.acceptedTalks}`,
      `Rejected Talks: ${data.cfp.rejectedTalks}`,
      `Acceptance Rate: ${formatPercentage(data.cfp.acceptanceRate)}`,
      ''
    )
  }

  if (data.billing) {
    lines.push(
      '--- Billing (Tickets) ---',
      `Total Revenue: ${formatCurrency(data.billing.totalRevenue, data.billing.currency)}`,
      `Paid Orders: ${data.billing.paidOrders} / ${data.billing.totalOrders}`,
      `Tickets Sold: ${data.billing.ticketsSold}`,
      `Tickets Remaining: ${data.billing.ticketsRemaining}`,
      `Capacity Filled: ${formatPercentage(data.billing.capacityPercentage)}`,
      ''
    )
  }

  if (data.planning) {
    lines.push(
      '--- Planning (Sessions) ---',
      `Total Sessions: ${data.planning.totalSessions}`,
      `Scheduled: ${data.planning.scheduledSessions}`,
      `Unscheduled: ${data.planning.unscheduledSessions}`,
      `Rooms: ${data.planning.totalRooms}`,
      `Room Occupancy: ${formatPercentage(data.planning.roomOccupancy)}`,
      ''
    )
  }

  if (data.crm) {
    lines.push(
      '--- CRM (Contacts) ---',
      `Total Contacts: ${data.crm.totalContacts}`,
      `New This Week: ${data.crm.newContactsThisWeek}`,
      `Average Open Rate: ${formatPercentage(data.crm.averageOpenRate)}`,
      `Average Click Rate: ${formatPercentage(data.crm.averageClickRate)}`,
      ''
    )
  }

  if (data.budget) {
    lines.push(
      '--- Budget ---',
      `Total Budget: ${formatCurrency(data.budget.totalBudget, data.budget.currency)}`,
      `Total Spent: ${formatCurrency(data.budget.totalSpent, data.budget.currency)}`,
      `Revenue: ${formatCurrency(data.budget.totalRevenue, data.budget.currency)}`,
      `Balance: ${formatCurrency(data.budget.balance, data.budget.currency)}`,
      `Budget Utilization: ${formatPercentage(data.budget.budgetUtilization)}`,
      ''
    )
  }

  if (data.sponsoring) {
    lines.push(
      '--- Sponsoring ---',
      `Total Sponsors: ${data.sponsoring.totalSponsors}`,
      `Confirmed: ${data.sponsoring.confirmedSponsors}`,
      `Pending: ${data.sponsoring.pendingSponsors}`,
      `Total Revenue: ${formatCurrency(data.sponsoring.totalRevenue, data.sponsoring.currency)}`,
      ''
    )
  }

  lines.push(
    '---',
    `Report generated on ${formatDate(data.generatedAt)}`,
    'Open Event Orchestrator'
  )

  return lines.join('\n')
}

export type ReportGeneratorService = ReturnType<typeof createReportGeneratorService>
