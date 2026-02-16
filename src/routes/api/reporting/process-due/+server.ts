import { createSmtpEmailService } from '$lib/features/cfp/services/email-service'
import { createReportConfigRepository } from '$lib/features/reporting/infra/report-config-repository'
import { createDashboardMetricsService } from '$lib/features/reporting/services/dashboard-metrics-service'
import { createReportGeneratorService } from '$lib/features/reporting/services/report-generator-service'
import { createReportSchedulerService } from '$lib/features/reporting/services/report-scheduler-service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Process Due Reports
 * POST /api/reporting/process-due
 *
 * This endpoint should be called by a cron job or scheduler
 * to process all reports that are due to be sent.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
  // Optional: Add API key authentication for cron jobs
  const authHeader = request.headers.get('Authorization')
  const apiKey = authHeader?.replace('Bearer ', '')

  // In production, you would validate the API key here
  // For now, we require authentication via PocketBase session
  if (!locals.pb.authStore.isValid && !apiKey) {
    return json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const emailService = createSmtpEmailService({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      from: process.env.SMTP_FROM || 'noreply@example.com'
    })
    const metricsService = createDashboardMetricsService(locals.pb)

    const reportGenerator = createReportGeneratorService({
      pb: locals.pb,
      fetchMetrics: (editionId: string) => metricsService.getEditionMetrics(editionId)
    })

    const schedulerService = createReportSchedulerService({
      pb: locals.pb,
      emailService,
      reportGenerator
    })

    const result = await schedulerService.processDueReports()

    return json({
      success: true,
      data: {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        results: result.results.map((r) => ({
          configId: r.configId,
          success: r.success,
          recipientsSent: r.recipientsSent,
          recipientsFailed: r.recipientsFailed,
          error: r.error
        }))
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Error processing due reports:', err)
    return json(
      {
        error: 'Failed to process due reports',
        message: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    )
  }
}

/**
 * Get Due Reports Info
 * GET /api/reporting/process-due
 *
 * Returns information about reports that are due to be sent.
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.pb.authStore.isValid) {
    return json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const reportConfigRepo = createReportConfigRepository(locals.pb)
    const dueReports = await reportConfigRepo.findDueReports()

    return json({
      data: {
        count: dueReports.length,
        reports: dueReports.map((config) => ({
          id: config.id,
          name: config.name,
          editionId: config.editionId,
          frequency: config.frequency,
          nextScheduledAt: config.nextScheduledAt?.toISOString(),
          recipientsCount: config.recipients.length
        }))
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Error fetching due reports:', err)
    return json(
      {
        error: 'Failed to fetch due reports',
        message: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    )
  }
}
