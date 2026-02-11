import { parseTrackingId } from '$lib/features/crm/domain'
import { createEmailEventRepository } from '$lib/features/crm/infra'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url, locals, request }) => {
  const { trackingId } = params
  const targetUrl = url.searchParams.get('url')
  const linkId = url.searchParams.get('linkId')

  // If no target URL, redirect to home
  if (!targetUrl) {
    redirect(302, '/')
  }

  // Parse tracking ID to get campaign and contact IDs
  const parsed = parseTrackingId(trackingId)

  if (parsed) {
    try {
      const emailEventRepository = createEmailEventRepository(locals.pb)

      // Extract metadata from request
      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
      const userAgent = request.headers.get('user-agent') || undefined

      // Record the click event
      await emailEventRepository.create({
        campaignId: parsed.campaignId,
        contactId: parsed.contactId,
        type: 'clicked',
        url: targetUrl,
        linkId: linkId || undefined,
        ipAddress,
        userAgent,
        timestamp: new Date()
      })
    } catch (error) {
      // Log error but don't fail the redirect
      console.error('Failed to record email click event:', error)
    }
  }

  // Always redirect to the target URL
  redirect(302, targetUrl)
}
