import { env } from '$env/dynamic/public'
import { AppSettingsRepository } from '$lib/features/app/infra'
import { FeedbackSettingsRepository } from '$lib/features/feedback/infra'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get the edition by slug
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]

  // Only show published editions on public app
  if (edition.status !== 'published') {
    throw error(404, 'Schedule not available')
  }

  const editionId = edition.id as string
  const eventId = edition.eventId as string | undefined

  // Validate eventId exists
  if (!eventId) {
    throw error(500, 'Edition has no associated event')
  }

  // Get the event for organization info and branding
  const event = await locals.pb.collection('events').getOne(eventId)

  // Build event-level branding (used as fallback when appSettings not set)
  let eventBranding: {
    logoUrl?: string
    bannerUrl?: string
    primaryColor?: string
    secondaryColor?: string
    hashtag?: string
  } = {}

  try {
    const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
    let logoUrl: string | undefined
    let bannerUrl: string | undefined

    if (event.logo) {
      logoUrl = `${pbUrl}/api/files/events/${eventId}/${event.logo}`
    }
    if (event.banner) {
      bannerUrl = `${pbUrl}/api/files/events/${eventId}/${event.banner}`
    }

    let primaryColor = (event.primaryColor as string) || undefined
    let secondaryColor = (event.secondaryColor as string) || undefined

    // Fall back to organization branding
    if (!logoUrl || !primaryColor || !secondaryColor) {
      try {
        const org = await locals.pb
          .collection('organizations')
          .getOne(event.organizationId as string)
        if (!logoUrl && org.logo) {
          logoUrl = `${pbUrl}/api/files/organizations/${org.id}/${org.logo}`
        }
        if (!primaryColor && org.primaryColor) {
          primaryColor = org.primaryColor as string
        }
        if (!secondaryColor && org.secondaryColor) {
          secondaryColor = org.secondaryColor as string
        }
      } catch {
        // Ignore org fetch errors
      }
    }

    eventBranding = {
      logoUrl,
      bannerUrl,
      primaryColor,
      secondaryColor,
      hashtag: (event.hashtag as string) || undefined
    }
  } catch {
    // Ignore branding errors
  }

  // Load feedback settings and app settings
  const feedbackSettingsRepo = new FeedbackSettingsRepository(locals.pb)
  const appSettingsRepo = new AppSettingsRepository(locals.pb)
  const [feedbackSettings, appSettings] = await Promise.all([
    feedbackSettingsRepo.getByEdition(editionId),
    appSettingsRepo.getByEdition(editionId)
  ])

  // Build file URLs for app settings
  let logoUrl: string | undefined
  let headerImageUrl: string | undefined
  if (appSettings) {
    logoUrl = appSettingsRepo.getFileUrl(appSettings, appSettings.logoFile)
    headerImageUrl = appSettingsRepo.getFileUrl(appSettings, appSettings.headerImage)
  }

  // Load rooms, tracks, slots, and sessions in parallel
  const [rooms, tracks, slots, sessions] = await Promise.all([
    locals.pb.collection('rooms').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'order,name'
    }),
    locals.pb.collection('tracks').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'order,name'
    }),
    locals.pb.collection('slots').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'date,startTime'
    }),
    locals.pb.collection('sessions').getFullList({
      filter: `editionId = "${editionId}"`
    })
  ])

  // Get talk IDs from sessions that have talks
  const talkIds = sessions.filter((s) => s.talkId).map((s) => s.talkId as string)

  // Load talks with speaker information if there are any
  let talks: Array<{
    id: string
    title: string
    abstract: string
    speakers: Array<{
      id: string
      firstName: string
      lastName: string
      company?: string
      bio?: string
      photoUrl?: string
    }>
  }> = []

  if (talkIds.length > 0) {
    const talkRecords = await locals.pb.collection('talks').getFullList({
      filter: talkIds.map((id) => `id = "${id}"`).join(' || '),
      expand: 'speakerIds'
    })

    talks = talkRecords.map((t) => {
      const expandedSpeakers = t.expand?.speakerIds as Array<Record<string, unknown>> | undefined
      return {
        id: t.id as string,
        title: t.title as string,
        abstract: t.abstract as string,
        speakers: expandedSpeakers
          ? expandedSpeakers.map((s) => ({
              id: s.id as string,
              firstName: s.firstName as string,
              lastName: s.lastName as string,
              company: s.company as string | undefined,
              bio: s.bio as string | undefined,
              photoUrl: s.photoUrl as string | undefined
            }))
          : []
      }
    })
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: edition.startDate as string,
      endDate: edition.endDate as string,
      venue: edition.venue as string | undefined,
      city: edition.city as string | undefined,
      country: edition.country as string | undefined
    },
    event: {
      id: event.id as string,
      name: event.name as string
    },
    appSettings: appSettings
      ? {
          title: appSettings.title,
          subtitle: appSettings.subtitle,
          logoUrl,
          headerImageUrl,
          primaryColor: appSettings.primaryColor,
          accentColor: appSettings.accentColor,
          showScheduleTab: appSettings.showScheduleTab,
          showSpeakersTab: appSettings.showSpeakersTab,
          showTicketsTab: appSettings.showTicketsTab,
          showFeedbackTab: appSettings.showFeedbackTab,
          showFavoritesTab: appSettings.showFavoritesTab,
          showNetworkingTab: appSettings.showNetworkingTab,
          floorAmenities: (appSettings.floorAmenities || []) as Array<{
            floor: string
            amenities: string[]
          }>
        }
      : null,
    feedbackSettings: feedbackSettings
      ? {
          sessionRatingEnabled: feedbackSettings.sessionRatingEnabled,
          sessionRatingMode: feedbackSettings.sessionRatingMode,
          sessionCommentRequired: feedbackSettings.sessionCommentRequired,
          eventFeedbackEnabled: feedbackSettings.eventFeedbackEnabled,
          feedbackIntroText: feedbackSettings.feedbackIntroText
        }
      : null,
    rooms: rooms.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      capacity: r.capacity as number | undefined,
      floor: r.floor as string | undefined,
      order: (r.order as number) || 0
    })),
    tracks: tracks.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      color: (t.color as string) || '#6b7280',
      order: (t.order as number) || 0
    })),
    slots: slots.map((s) => ({
      id: s.id as string,
      roomId: s.roomId as string,
      date: s.date as string,
      startTime: s.startTime as string,
      endTime: s.endTime as string
    })),
    sessions: sessions.map((s) => ({
      id: s.id as string,
      slotId: s.slotId as string,
      talkId: s.talkId as string | undefined,
      trackId: s.trackId as string | undefined,
      title: s.title as string,
      type: (s.type as string) || 'talk',
      description: s.description as string | undefined
    })),
    talks,
    eventBranding
  }
}
