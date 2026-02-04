import { createCategoryRepository, createFormatRepository } from '$lib/features/cfp/infra'
import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export type CfpStatus = 'not_open_yet' | 'open' | 'closed'

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

  // Check if CFP is open (edition must be published)
  if (editionRecord.status !== 'published') {
    throw error(404, 'CFP not available')
  }

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

  // Load CFP settings for timeline
  let cfpSettings = null
  try {
    cfpSettings = await locals.pb
      .collection('cfp_settings')
      .getFirstListItem(`editionId="${edition.id}"`)
  } catch {
    // No settings exist yet
  }

  const now = new Date()
  const cfpOpenDate = cfpSettings?.cfpOpenDate ? new Date(cfpSettings.cfpOpenDate as string) : null
  const cfpCloseDate = cfpSettings?.cfpCloseDate
    ? new Date(cfpSettings.cfpCloseDate as string)
    : null

  // Determine CFP status
  let cfpStatus: CfpStatus = 'open'
  if (cfpOpenDate && now < cfpOpenDate) {
    cfpStatus = 'not_open_yet'
  } else if (cfpCloseDate && now > cfpCloseDate) {
    cfpStatus = 'closed'
  }

  return {
    edition,
    categories,
    formats,
    cfpOpenDate,
    cfpCloseDate,
    cfpStatus,
    introText: (cfpSettings?.introText as string) || null,
    allowCoSpeakers: cfpSettings?.allowCoSpeakers !== false,
    maxSubmissionsPerSpeaker: (cfpSettings?.maxSubmissionsPerSpeaker as number) || 3
  }
}
