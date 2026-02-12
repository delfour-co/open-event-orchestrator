import { type CfpUserRole, canViewSpeakerInfo } from '$lib/features/cfp/domain'
import {
  createCategoryRepository,
  createCfpSettingsRepository,
  createFormatRepository
} from '$lib/features/cfp/infra'
import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ params, locals }) => {
  const categoryRepo = createCategoryRepository(locals.pb)
  const formatRepo = createFormatRepository(locals.pb)
  const cfpSettingsRepo = createCfpSettingsRepository(locals.pb)

  // Find edition by slug
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${params.editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const editionRecord = editions.items[0]

  const edition = {
    id: editionRecord.id as string,
    eventId: editionRecord.eventId as string,
    name: editionRecord.name as string,
    slug: editionRecord.slug as string,
    year: editionRecord.year as number,
    startDate: new Date(editionRecord.startDate as string),
    endDate: new Date(editionRecord.endDate as string),
    venue: editionRecord.venue as string | undefined,
    city: editionRecord.city as string | undefined,
    country: editionRecord.country as string | undefined,
    status: editionRecord.status as 'draft' | 'published' | 'archived'
  }

  const categories = await categoryRepo.findByEdition(edition.id)
  const formats = await formatRepo.findByEdition(edition.id)

  // Load CFP settings using repository
  const cfpSettings = await cfpSettingsRepo.findByEdition(edition.id)

  // Get user's role in the organization to determine if they can see speaker info in anonymous mode
  let userRole: CfpUserRole = null
  if (locals.user) {
    try {
      // Get organization from event
      const event = await locals.pb.collection('events').getOne(edition.eventId)
      const orgId = event.organizationId as string

      // Check if user is owner
      const org = await locals.pb.collection('organizations').getOne(orgId)
      if (org.ownerId === locals.user.id) {
        userRole = 'owner'
      } else {
        // Check membership
        const membership = await locals.pb
          .collection('organization_members')
          .getFirstListItem(`organizationId="${orgId}" && userId="${locals.user.id}"`)
        userRole = membership.role as CfpUserRole
      }
    } catch {
      // User is not a member
    }
  }

  // Use domain function to determine speaker visibility (without talk status at layout level)
  const canSeeSpeakerInfoBase = canViewSpeakerInfo(
    cfpSettings
      ? {
          anonymousReview: cfpSettings.anonymousReview,
          revealSpeakersAfterDecision: cfpSettings.revealSpeakersAfterDecision
        }
      : null,
    userRole
  )

  return {
    edition,
    categories,
    formats,
    cfpSettings: cfpSettings
      ? {
          anonymousReview: cfpSettings.anonymousReview,
          revealSpeakersAfterDecision: cfpSettings.revealSpeakersAfterDecision,
          allowCoSpeakers: cfpSettings.allowCoSpeakers,
          cfpOpenDate: cfpSettings.cfpOpenDate || null,
          cfpCloseDate: cfpSettings.cfpCloseDate || null,
          reviewMode: cfpSettings.reviewMode
        }
      : {
          anonymousReview: false,
          revealSpeakersAfterDecision: true,
          allowCoSpeakers: true,
          cfpOpenDate: null,
          cfpCloseDate: null,
          reviewMode: 'stars' as const
        },
    userRole,
    canSeeSpeakerInfo: canSeeSpeakerInfoBase
  }
}
