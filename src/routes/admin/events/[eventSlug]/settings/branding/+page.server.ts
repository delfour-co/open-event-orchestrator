import { writeAuditLog } from '$lib/server/audit-log-service'
import { validateImageFile } from '$lib/server/file-validation'
import { canAccessSettings } from '$lib/server/permissions'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  uploadLogo: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const logo = formData.get('logo') as File

    if (!logo || logo.size === 0) {
      return fail(400, { error: 'Logo file is required' })
    }

    const validation = validateImageFile(logo, { maxSizeMB: 5 })
    if (!validation.valid) {
      return fail(400, { error: validation.error })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      const uploadFormData = new FormData()
      uploadFormData.append('logo', logo)

      await locals.pb.collection('events').update(event.id, uploadFormData)

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_update',
        entityType: 'event',
        entityId: event.id,
        entityName: event.name as string,
        details: { field: 'branding', change: 'logo_upload' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Logo uploaded successfully' }
    } catch (e) {
      console.error('Failed to upload logo:', e)
      return fail(500, { error: 'Failed to upload logo' })
    }
  },

  removeLogo: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      await locals.pb.collection('events').update(event.id, { logo: null })

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_update',
        entityType: 'event',
        entityId: event.id,
        entityName: event.name as string,
        details: { field: 'branding', change: 'logo_remove' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Logo removed successfully' }
    } catch (e) {
      console.error('Failed to remove logo:', e)
      return fail(500, { error: 'Failed to remove logo' })
    }
  },

  uploadBanner: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const banner = formData.get('banner') as File

    if (!banner || banner.size === 0) {
      return fail(400, { error: 'Banner file is required' })
    }

    const validation = validateImageFile(banner, { maxSizeMB: 5 })
    if (!validation.valid) {
      return fail(400, { error: validation.error })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      const uploadFormData = new FormData()
      uploadFormData.append('banner', banner)

      await locals.pb.collection('events').update(event.id, uploadFormData)

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_update',
        entityType: 'event',
        entityId: event.id,
        entityName: event.name as string,
        details: { field: 'branding', change: 'banner_upload' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Banner uploaded successfully' }
    } catch (e) {
      console.error('Failed to upload banner:', e)
      return fail(500, { error: 'Failed to upload banner' })
    }
  },

  removeBanner: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      await locals.pb.collection('events').update(event.id, { banner: null })

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_update',
        entityType: 'event',
        entityId: event.id,
        entityName: event.name as string,
        details: { field: 'branding', change: 'banner_remove' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Banner removed successfully' }
    } catch (e) {
      console.error('Failed to remove banner:', e)
      return fail(500, { error: 'Failed to remove banner' })
    }
  },

  updateBranding: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const primaryColor = formData.get('primaryColor') as string
    const secondaryColor = formData.get('secondaryColor') as string

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      await locals.pb.collection('events').update(event.id, {
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null
      })

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_update',
        entityType: 'event',
        entityId: event.id,
        entityName: event.name as string,
        details: { field: 'branding', change: 'colors' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Branding updated successfully' }
    } catch (e) {
      console.error('Failed to update branding:', e)
      return fail(500, { error: 'Failed to update branding' })
    }
  }
}
