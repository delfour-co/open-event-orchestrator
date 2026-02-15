import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const editions = await locals.pb.collection('editions').getFullList({
    sort: '-year',
    expand: 'eventId'
  })

  return {
    editions: editions.map((e) => {
      const event = e.expand?.eventId as Record<string, unknown> | undefined
      return {
        id: e.id as string,
        name: e.name as string,
        slug: e.slug as string,
        year: e.year as number,
        startDate: new Date(e.startDate as string),
        endDate: new Date(e.endDate as string),
        status: e.status as string,
        eventName: event?.name as string | undefined
      }
    })
  }
}
