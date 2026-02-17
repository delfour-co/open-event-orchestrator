import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get edition by slug
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

  // Get event info
  let eventName = 'Event'
  let eventSlug = ''
  try {
    const event = await locals.pb.collection('events').getOne(eventId)
    eventName = event.name as string
    eventSlug = event.slug as string
  } catch {
    // Event might not exist, continue with defaults
  }

  // Fetch thresholds
  const thresholdRecords = await locals.pb.collection('alert_thresholds').getFullList({
    filter: `editionId = "${editionId}"`,
    sort: '-created'
  })

  const thresholds = thresholdRecords.map((record) => ({
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    description: record.description as string | undefined,
    metricSource: record.metricSource as string,
    operator: record.operator as string,
    thresholdValue: record.thresholdValue as number,
    level: record.level as string,
    enabled: (record.enabled as boolean) ?? true,
    notifyByEmail: (record.notifyByEmail as boolean) ?? false,
    notifyInApp: (record.notifyInApp as boolean) ?? true,
    emailRecipients: parseEmailRecipients(record.emailRecipients),
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }))

  // Fetch alerts
  const alertRecords = await locals.pb.collection('alerts').getFullList({
    filter: `editionId = "${editionId}"`,
    sort: '-created'
  })

  const alerts = alertRecords.map((record) => ({
    id: record.id as string,
    editionId: record.editionId as string,
    thresholdId: record.thresholdId as string,
    title: record.title as string,
    message: record.message as string,
    level: record.level as string,
    metricSource: record.metricSource as string,
    currentValue: record.currentValue as number,
    thresholdValue: record.thresholdValue as number,
    status: (record.status as string) || 'active',
    acknowledgedBy: record.acknowledgedBy as string | undefined,
    acknowledgedAt: record.acknowledgedAt ? new Date(record.acknowledgedAt as string) : undefined,
    resolvedAt: record.resolvedAt ? new Date(record.resolvedAt as string) : undefined,
    dismissedBy: record.dismissedBy as string | undefined,
    dismissedAt: record.dismissedAt ? new Date(record.dismissedAt as string) : undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }))

  // Count alerts
  const alertCounts = {
    total: alerts.length,
    active: alerts.filter((a) => a.status === 'active' || a.status === 'acknowledged').length,
    byLevel: {
      info: alerts.filter((a) => a.level === 'info' && a.status === 'active').length,
      warning: alerts.filter((a) => a.level === 'warning' && a.status === 'active').length,
      critical: alerts.filter((a) => a.level === 'critical' && a.status === 'active').length
    }
  }

  // Fetch report configs count for nav badges
  const reportConfigs = await locals.pb
    .collection('report_configs')
    .getFullList({
      filter: `editionId = "${editionId}"`
    })
    .catch(() => [])

  const navBadges = {
    alerts: alertCounts.active,
    reports: reportConfigs.filter((r) => r.enabled).length
  }

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
    thresholds,
    alerts,
    alertCounts,
    navBadges
  }
}

function parseEmailRecipients(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return []
}

export const actions: Actions = {
  createThreshold: async ({ request, locals }) => {
    const formData = await request.formData()
    const jsonData = formData.get('data') as string

    try {
      const data = JSON.parse(jsonData)

      await locals.pb.collection('alert_thresholds').create({
        editionId: data.editionId,
        name: data.name,
        description: data.description || null,
        metricSource: data.metricSource,
        operator: data.operator,
        thresholdValue: Number(data.thresholdValue) || 0,
        level: data.level,
        enabled: data.enabled ?? true,
        notifyByEmail: data.notifyByEmail ?? false,
        notifyInApp: data.notifyInApp ?? true,
        emailRecipients: JSON.stringify(data.emailRecipients || [])
      })

      return { success: true, action: 'create' }
    } catch (err) {
      console.error('Failed to create threshold:', err)
      return fail(500, { error: 'Failed to create threshold' })
    }
  },

  updateThreshold: async ({ request, locals }) => {
    const formData = await request.formData()
    const jsonData = formData.get('data') as string
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Threshold ID is required' })
    }

    try {
      const data = JSON.parse(jsonData)
      const updateData: Record<string, unknown> = {
        name: data.name,
        description: data.description || null,
        metricSource: data.metricSource,
        operator: data.operator,
        thresholdValue: Number(data.thresholdValue),
        level: data.level,
        enabled: data.enabled ?? true,
        notifyByEmail: data.notifyByEmail ?? false,
        notifyInApp: data.notifyInApp ?? true,
        emailRecipients: JSON.stringify(data.emailRecipients || [])
      }

      await locals.pb.collection('alert_thresholds').update(id, updateData)

      return { success: true, action: 'update' }
    } catch (err) {
      console.error('Failed to update threshold:', err)
      return fail(500, { error: 'Failed to update threshold' })
    }
  },

  deleteThreshold: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Threshold ID is required' })
    }

    try {
      await locals.pb.collection('alert_thresholds').delete(id)
      return { success: true, action: 'delete' }
    } catch (err) {
      console.error('Failed to delete threshold:', err)
      return fail(500, { error: 'Failed to delete threshold' })
    }
  },

  toggleThreshold: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const enabled = formData.get('enabled') === 'true'

    if (!id) {
      return fail(400, { error: 'Threshold ID is required' })
    }

    try {
      await locals.pb.collection('alert_thresholds').update(id, { enabled })
      return { success: true, action: 'toggle' }
    } catch (err) {
      console.error('Failed to toggle threshold:', err)
      return fail(500, { error: 'Failed to toggle threshold' })
    }
  },

  acknowledgeAlert: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const userId = locals.pb.authStore.record?.id

    if (!id) {
      return fail(400, { error: 'Alert ID is required' })
    }

    try {
      await locals.pb.collection('alerts').update(id, {
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date().toISOString()
      })
      return { success: true, action: 'acknowledge' }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
      return fail(500, { error: 'Failed to acknowledge alert' })
    }
  },

  resolveAlert: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Alert ID is required' })
    }

    try {
      await locals.pb.collection('alerts').update(id, {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      })
      return { success: true, action: 'resolve' }
    } catch (err) {
      console.error('Failed to resolve alert:', err)
      return fail(500, { error: 'Failed to resolve alert' })
    }
  },

  dismissAlert: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const userId = locals.pb.authStore.record?.id

    if (!id) {
      return fail(400, { error: 'Alert ID is required' })
    }

    try {
      await locals.pb.collection('alerts').update(id, {
        status: 'dismissed',
        dismissedBy: userId,
        dismissedAt: new Date().toISOString()
      })
      return { success: true, action: 'dismiss' }
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
      return fail(500, { error: 'Failed to dismiss alert' })
    }
  }
}
