import type { EmailService } from '$lib/features/cfp/services/email-service'
import type PocketBase from 'pocketbase'
import type { ReportConfig } from '../domain/report-config'
import { createReportConfigRepository } from '../infra/report-config-repository'
import type { ReportGeneratorService } from './report-generator-service'

export interface ReportSchedulerDependencies {
  pb: PocketBase
  emailService: EmailService
  reportGenerator: ReportGeneratorService
}

export interface SendReportResult {
  success: boolean
  configId: string
  recipientsSent: number
  recipientsFailed: number
  error?: string
}

export interface ProcessDueReportsResult {
  processed: number
  succeeded: number
  failed: number
  results: SendReportResult[]
}

/**
 * Creates a report scheduler service
 */
export const createReportSchedulerService = (deps: ReportSchedulerDependencies) => {
  const { pb, emailService, reportGenerator } = deps
  const configRepo = createReportConfigRepository(pb)

  /**
   * Send a report to all configured recipients
   */
  async function sendReport(config: ReportConfig): Promise<SendReportResult> {
    const result: SendReportResult = {
      success: false,
      configId: config.id,
      recipientsSent: 0,
      recipientsFailed: 0
    }

    try {
      const report = await reportGenerator.generateReport(config)

      for (const recipient of config.recipients) {
        const emailResult = await emailService.send({
          to: recipient.email,
          subject: report.subject,
          html: report.html,
          text: report.text
        })

        if (emailResult.success) {
          result.recipientsSent++
        } else {
          result.recipientsFailed++
        }
      }

      if (result.recipientsSent > 0) {
        await configRepo.markSent(config.id)
        result.success = true
      } else {
        result.error = 'Failed to send to any recipients'
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error)
    }

    return result
  }

  /**
   * Process all due reports
   */
  async function processDueReports(beforeDate?: Date): Promise<ProcessDueReportsResult> {
    const dueConfigs = await configRepo.findDueReports(beforeDate)

    const results: SendReportResult[] = []
    let succeeded = 0
    let failed = 0

    for (const config of dueConfigs) {
      const result = await sendReport(config)
      results.push(result)

      if (result.success) {
        succeeded++
      } else {
        failed++
      }
    }

    return {
      processed: dueConfigs.length,
      succeeded,
      failed,
      results
    }
  }

  /**
   * Send a test report immediately
   */
  async function sendTestReport(
    configId: string,
    testEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    const config = await configRepo.findById(configId)
    if (!config) {
      return { success: false, error: 'Report configuration not found' }
    }

    try {
      const report = await reportGenerator.generateReport(config)

      const result = await emailService.send({
        to: testEmail,
        subject: `[TEST] ${report.subject}`,
        html: report.html,
        text: report.text
      })

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Get next scheduled reports
   */
  async function getUpcomingReports(editionId: string, limit = 10): Promise<ReportConfig[]> {
    const configs = await configRepo.findByEdition(editionId, { enabledOnly: true })

    return configs
      .filter((c) => c.nextScheduledAt)
      .sort((a, b) => {
        const aTime = a.nextScheduledAt?.getTime() ?? 0
        const bTime = b.nextScheduledAt?.getTime() ?? 0
        return aTime - bTime
      })
      .slice(0, limit)
  }

  /**
   * Enable or disable a report configuration
   */
  async function setReportEnabled(
    configId: string,
    enabled: boolean
  ): Promise<ReportConfig | null> {
    const config = await configRepo.findById(configId)
    if (!config) return null

    return configRepo.update(configId, { enabled })
  }

  return {
    sendReport,
    processDueReports,
    sendTestReport,
    getUpcomingReports,
    setReportEnabled
  }
}

export type ReportSchedulerService = ReturnType<typeof createReportSchedulerService>
