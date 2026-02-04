import { createCategoryRepository, createFormatRepository } from '$lib/features/cfp/infra'
import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ params, locals }) => {
  const categoryRepo = createCategoryRepository(locals.pb)
  const formatRepo = createFormatRepository(locals.pb)

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

  // Load CFP settings
  let cfpSettings = null
  try {
    cfpSettings = await locals.pb
      .collection('cfp_settings')
      .getFirstListItem(`editionId="${edition.id}"`)
  } catch {
    // No settings exist yet
  }

  // Get user's role in the organization to determine if they can see speaker info in anonymous mode
  let userRole: string | null = null
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
        userRole = membership.role as string
      }
    } catch {
      // User is not a member
    }
  }

  return {
    edition,
    categories,
    formats,
    cfpSettings: cfpSettings
      ? {
          anonymousReview: cfpSettings.anonymousReview as boolean,
          allowCoSpeakers: cfpSettings.allowCoSpeakers as boolean,
          cfpOpenDate: cfpSettings.cfpOpenDate ? new Date(cfpSettings.cfpOpenDate as string) : null,
          cfpCloseDate: cfpSettings.cfpCloseDate
            ? new Date(cfpSettings.cfpCloseDate as string)
            : null
        }
      : {
          anonymousReview: false,
          allowCoSpeakers: true,
          cfpOpenDate: null,
          cfpCloseDate: null
        },
    userRole,
    canSeeSpeakerInfo: !cfpSettings?.anonymousReview || userRole === 'owner' || userRole === 'admin'
  }
}
