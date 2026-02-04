import type { TalkStatus } from '$lib/features/cfp/domain'
import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { canChangeTalkStatus, canExportData } from '$lib/server/permissions'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, url, locals }) => {
  const { edition, categories, formats } = await parent()

  const talkRepo = createTalkRepository(locals.pb)
  const speakerRepo = createSpeakerRepository(locals.pb)

  // Get filter params
  const statusFilter = url.searchParams.get('status')
  const categoryFilter = url.searchParams.get('category')
  const formatFilter = url.searchParams.get('format')
  const search = url.searchParams.get('search')
  const page = Number.parseInt(url.searchParams.get('page') || '1', 10)
  const perPage = 20

  // Build filters
  const filters: {
    editionId: string
    status?: TalkStatus | TalkStatus[]
    categoryId?: string
    formatId?: string
  } = {
    editionId: edition.id
  }

  if (statusFilter && statusFilter !== 'all') {
    filters.status = statusFilter as TalkStatus
  }
  if (categoryFilter && categoryFilter !== 'all') {
    filters.categoryId = categoryFilter
  }
  if (formatFilter && formatFilter !== 'all') {
    filters.formatId = formatFilter
  }

  // Get talks with filters
  const talks = await talkRepo.findByFilters(filters, { page, perPage })

  // Get speaker data for all talks
  const speakerIds = [...new Set(talks.flatMap((t) => t.speakerIds))]
  const speakers = await speakerRepo.findByIds(speakerIds)
  const speakerMap = new Map(speakers.map((s) => [s.id, s]))

  // Apply search filter (client-side for now, could be optimized with PocketBase search)
  let filteredTalks = talks
  if (search) {
    const searchLower = search.toLowerCase()
    filteredTalks = talks.filter((talk) => {
      const titleMatch = talk.title.toLowerCase().includes(searchLower)
      const speakerMatch = talk.speakerIds.some((id) => {
        const speaker = speakerMap.get(id)
        if (!speaker) return false
        return (
          speaker.firstName.toLowerCase().includes(searchLower) ||
          speaker.lastName.toLowerCase().includes(searchLower) ||
          speaker.email.toLowerCase().includes(searchLower)
        )
      })
      return titleMatch || speakerMatch
    })
  }

  // Get counts by status
  const statusCounts = await talkRepo.countByEdition(edition.id)

  // Map talks with speaker data
  const talksWithSpeakers = filteredTalks.map((talk) => ({
    ...talk,
    speakers: talk.speakerIds.map((id) => speakerMap.get(id)).filter(Boolean),
    category: categories.find((c) => c.id === talk.categoryId),
    format: formats.find((f) => f.id === talk.formatId)
  }))

  const userRole = locals.user?.role as string | undefined

  return {
    edition,
    categories,
    formats,
    talks: talksWithSpeakers,
    statusCounts,
    filters: {
      status: statusFilter || 'all',
      category: categoryFilter || 'all',
      format: formatFilter || 'all',
      search: search || ''
    },
    pagination: {
      page,
      perPage,
      total: filteredTalks.length
    },
    permissions: {
      canChangeStatus: canChangeTalkStatus(userRole),
      canExport: canExportData(userRole)
    }
  }
}

export const actions: Actions = {
  updateStatus: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canChangeTalkStatus(userRole)) {
      return fail(403, { error: 'You do not have permission to change talk status' })
    }

    const formData = await request.formData()
    const talkIds = formData.getAll('talkIds') as string[]
    const newStatus = formData.get('status') as TalkStatus

    if (!talkIds.length || !newStatus) {
      return fail(400, { error: 'Missing talk IDs or status' })
    }

    const talkRepo = createTalkRepository(locals.pb)

    try {
      await Promise.all(talkIds.map((id) => talkRepo.updateStatus(id, newStatus)))
      return { success: true, message: `Updated ${talkIds.length} talk(s) to ${newStatus}` }
    } catch (err) {
      console.error('Failed to update talks:', err)
      return fail(500, { error: 'Failed to update talks' })
    }
  },

  export: async ({ locals, url }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canExportData(userRole)) {
      return fail(403, { error: 'You do not have permission to export data' })
    }

    const editionSlug = url.pathname.split('/')[3]

    // Find edition
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    const talkRepo = createTalkRepository(locals.pb)
    const speakerRepo = createSpeakerRepository(locals.pb)

    const talks = await talkRepo.findByFilters({ editionId })
    const speakerIds = [...new Set(talks.flatMap((t) => t.speakerIds))]
    const speakers = await speakerRepo.findByIds(speakerIds)
    const speakerMap = new Map(speakers.map((s) => [s.id, s]))

    // Build CSV
    const headers = [
      'Title',
      'Abstract',
      'Status',
      'Language',
      'Level',
      'Speaker Names',
      'Speaker Emails',
      'Submitted At'
    ]

    const rows = talks.map((talk) => {
      const talkSpeakers = talk.speakerIds.map((id) => speakerMap.get(id)).filter(Boolean)
      return [
        `"${talk.title.replace(/"/g, '""')}"`,
        `"${talk.abstract.replace(/"/g, '""')}"`,
        talk.status,
        talk.language,
        talk.level || '',
        `"${talkSpeakers.map((s) => `${s?.firstName} ${s?.lastName}`).join(', ')}"`,
        `"${talkSpeakers.map((s) => s?.email).join(', ')}"`,
        talk.submittedAt?.toISOString() || ''
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return { csv, filename: `cfp-export-${editionSlug}.csv` }
  }
}
