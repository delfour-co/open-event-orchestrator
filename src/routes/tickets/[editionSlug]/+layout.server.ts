import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ params, locals }) => {
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${params.editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const editionRecord = editions.items[0]

  if (editionRecord.status !== 'published') {
    throw error(404, 'Tickets not available')
  }

  const edition = {
    id: editionRecord.id as string,
    name: editionRecord.name as string,
    slug: editionRecord.slug as string,
    startDate: new Date(editionRecord.startDate as string),
    endDate: new Date(editionRecord.endDate as string),
    venue: editionRecord.venue as string | undefined,
    city: editionRecord.city as string | undefined,
    termsOfSale: (editionRecord.termsOfSale as string) || '',
    codeOfConduct: (editionRecord.codeOfConduct as string) || '',
    privacyPolicy: (editionRecord.privacyPolicy as string) || ''
  }

  // Load active ticket types
  const ticketTypeRecords = await locals.pb.collection('ticket_types').getFullList({
    filter: `editionId = "${edition.id}" && isActive = true`,
    sort: 'order,price'
  })

  const ticketTypes = ticketTypeRecords.map((tt) => ({
    id: tt.id as string,
    name: tt.name as string,
    description: (tt.description as string) || '',
    price: tt.price as number,
    currency: ((tt.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
    quantity: tt.quantity as number,
    quantitySold: (tt.quantitySold as number) || 0,
    salesStartDate: tt.salesStartDate ? new Date(tt.salesStartDate as string) : undefined,
    salesEndDate: tt.salesEndDate ? new Date(tt.salesEndDate as string) : undefined
  }))

  return {
    edition,
    ticketTypes
  }
}
