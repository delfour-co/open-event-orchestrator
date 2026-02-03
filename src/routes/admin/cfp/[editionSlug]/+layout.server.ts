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

  return {
    edition,
    categories,
    formats
  }
}
