import { createSmtpEmailService } from '$lib/features/cfp/services'
import { createReportConfigRepository } from '$lib/features/reporting/infra/report-config-repository'
import { createReportGeneratorService } from '$lib/features/reporting/services/report-generator-service'
import { createReportSchedulerService } from '$lib/features/reporting/services/report-scheduler-service'
import { getSmtpSettings } from '$lib/server/app-settings'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`,
    expand: 'eventId'
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string
  const eventId = edition.eventId as string

  let eventName = 'Event'
  let eventSlug = ''
  try {
    const event = await locals.pb.collection('events').getOne(eventId)
    eventName = event.name as string
    eventSlug = event.slug as string
  } catch {
    // Event might not exist, continue with defaults
  }

  const reportConfigRepo = createReportConfigRepository(locals.pb)
  const reportConfigs = await reportConfigRepo.findByEdition(editionId)

  return {
    event: {
      id: eventId,
      name: eventName,
      slug: eventSlug
    },
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    reportConfigs
  }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData()
    const jsonData = formData.get('data') as string

    try {
      const data = JSON.parse(jsonData)
      const reportConfigRepo = createReportConfigRepository(locals.pb)

      await reportConfigRepo.create({
        editionId: data.editionId,
        name: data.name,
        enabled: data.enabled ?? true,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        timeOfDay: data.timeOfDay,
        timezone: data.timezone || 'UTC',
        recipientRoles: data.recipientRoles || ['admin', 'organizer'],
        recipients: data.recipients || [],
        sections: data.sections
      })

      return { success: true, action: 'create' }
    } catch (err) {
      console.error('Failed to create report config:', err)
      return fail(500, { error: 'Failed to create report configuration' })
    }
  },

  update: async ({ request, locals }) => {
    const formData = await request.formData()
    const jsonData = formData.get('data') as string
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Report config ID is required' })
    }

    try {
      const data = JSON.parse(jsonData)
      const reportConfigRepo = createReportConfigRepository(locals.pb)

      await reportConfigRepo.update(id, {
        name: data.name,
        enabled: data.enabled,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        timeOfDay: data.timeOfDay,
        timezone: data.timezone,
        recipientRoles: data.recipientRoles,
        recipients: data.recipients || [],
        sections: data.sections
      })

      return { success: true, action: 'update' }
    } catch (err) {
      console.error('Failed to update report config:', err)
      return fail(500, { error: 'Failed to update report configuration' })
    }
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Report config ID is required' })
    }

    try {
      const reportConfigRepo = createReportConfigRepository(locals.pb)
      await reportConfigRepo.delete(id)
      return { success: true, action: 'delete' }
    } catch (err) {
      console.error('Failed to delete report config:', err)
      return fail(500, { error: 'Failed to delete report configuration' })
    }
  },

  toggle: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const enabled = formData.get('enabled') === 'true'

    if (!id) {
      return fail(400, { error: 'Report config ID is required' })
    }

    try {
      const reportConfigRepo = createReportConfigRepository(locals.pb)
      await reportConfigRepo.update(id, { enabled })
      return { success: true, action: 'toggle' }
    } catch (err) {
      console.error('Failed to toggle report config:', err)
      return fail(500, { error: 'Failed to toggle report configuration' })
    }
  },

  test: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const testEmail = formData.get('testEmail') as string

    if (!id) {
      return fail(400, { error: 'Report config ID is required' })
    }

    if (!testEmail) {
      return fail(400, { error: 'Test email is required' })
    }

    try {
      // Get SMTP settings
      const smtpSettings = await getSmtpSettings(locals.pb)
      if (!smtpSettings.smtpEnabled) {
        return fail(400, { error: 'SMTP is not configured. Please configure SMTP settings first.' })
      }

      // Create email service
      const emailService = createSmtpEmailService({
        host: smtpSettings.smtpHost,
        port: smtpSettings.smtpPort,
        user: smtpSettings.smtpUser || undefined,
        pass: smtpSettings.smtpPass || undefined,
        from: smtpSettings.smtpFrom
      })

      // Create report generator and scheduler
      const reportGenerator = createReportGeneratorService({
        pb: locals.pb,
        fetchMetrics: async (editionId: string) => {
          // Import dashboard metrics service dynamically
          const { createDashboardMetricsService } = await import(
            '$lib/features/reporting/services/dashboard-metrics-service'
          )
          const metricsService = createDashboardMetricsService(locals.pb)
          return metricsService.getEditionMetrics(editionId)
        }
      })

      const scheduler = createReportSchedulerService({
        pb: locals.pb,
        emailService,
        reportGenerator
      })

      // Send test report
      const result = await scheduler.sendTestReport(id, testEmail)

      if (result.success) {
        return { success: true, action: 'test', message: `Test report sent to ${testEmail}` }
      }
      return fail(500, { error: result.error || 'Failed to send test report' })
    } catch (err) {
      console.error('Failed to send test report:', err)
      return fail(500, { error: 'Failed to send test report' })
    }
  }
}
