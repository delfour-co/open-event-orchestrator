import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
  const selectedEditionId = url.searchParams.get('edition') || ''

  // Get all editions
  const editions = await locals.pb.collection('editions').getFullList({
    sort: '-year'
  })

  // Get talks count per edition
  const talks = await locals.pb.collection('talks').getFullList()

  // Get recent submissions (last 5)
  const recentTalks = await locals.pb.collection('talks').getList(1, 5, {
    sort: '-created',
    expand: 'speakerId'
  })

  // Calculate stats
  const selectedEdition = selectedEditionId
    ? editions.find((e) => e.id === selectedEditionId)
    : null

  const filteredTalks = selectedEditionId
    ? talks.filter((t) => t.editionId === selectedEditionId)
    : talks

  const stats = {
    totalTalks: filteredTalks.length,
    submittedTalks: filteredTalks.filter((t) => t.status === 'submitted').length,
    acceptedTalks: filteredTalks.filter((t) => t.status === 'accepted').length,
    rejectedTalks: filteredTalks.filter((t) => t.status === 'rejected').length,
    underReviewTalks: filteredTalks.filter((t) => t.status === 'under_review').length
  }

  return {
    editions: editions.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      slug: e.slug as string,
      year: e.year as number,
      status: e.status as string
    })),
    selectedEditionId,
    selectedEdition: selectedEdition
      ? {
          id: selectedEdition.id as string,
          name: selectedEdition.name as string
        }
      : null,
    stats,
    recentSubmissions: recentTalks.items.map((t) => ({
      id: t.id as string,
      title: t.title as string,
      status: t.status as string,
      createdAt: new Date(t.created as string),
      speakerName: t.expand?.speakerId
        ? `${(t.expand.speakerId as Record<string, unknown>).firstName} ${(t.expand.speakerId as Record<string, unknown>).lastName}`
        : 'Unknown'
    })),
    upcomingEditions: editions
      .filter((e) => new Date(e.startDate as string) > new Date())
      .slice(0, 3)
      .map((e) => ({
        id: e.id as string,
        name: e.name as string,
        slug: e.slug as string,
        startDate: new Date(e.startDate as string),
        status: e.status as string
      }))
  }
}
