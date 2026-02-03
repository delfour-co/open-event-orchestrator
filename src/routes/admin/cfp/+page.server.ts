import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // For now, get all published editions
  // In the future, this should be filtered by user's organizations
  const editions = await locals.pb.collection('editions').getFullList({
    filter: 'status = "published"',
    sort: '-year'
  })

  return {
    editions: editions.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      slug: e.slug as string,
      year: e.year as number,
      startDate: new Date(e.startDate as string),
      endDate: new Date(e.endDate as string),
      status: e.status as string
    }))
  }
}
