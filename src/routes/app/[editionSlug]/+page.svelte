<script lang="ts">
import { browser } from '$app/environment'
import { goto, invalidateAll } from '$app/navigation'
import { page } from '$app/stores'
import { formatDate as sharedFormatDate } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Dialog from '$lib/components/ui/dialog'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { notesService, reminderService } from '$lib/features/app/services'
import { AppSearchDialog, BadgeScannerView, VenueMap } from '$lib/features/app/ui'
import { RatingInput } from '$lib/features/feedback/ui'
import type { IcalEventInfo, IcalSession } from '$lib/features/planning/domain/ical-export'
import { scheduleCacheService } from '$lib/features/planning/services/schedule-cache-service'
import * as m from '$lib/paraglide/messages'
import { isOnline } from '$lib/stores/connectivity'
import { reducedMotion, toggleReducedMotion } from '$lib/stores/reduced-motion'
import { AlertCircle, CheckCircle2, Loader2, Star } from 'lucide-svelte'
import type { PageData } from './$types'
import {
  AppBottomNav,
  AppFavorites,
  AppFeedback,
  AppHeader,
  AppSchedule,
  AppSpeakers,
  AppTicket
} from './components'

interface Props {
  data: PageData
}

const { data }: Props = $props()

// Check if tabs are enabled (default to true if no settings)
// Schedule is always enabled - no toggle for it
const showSpeakers = data.appSettings?.showSpeakersTab ?? true
// Feedback tab shows if showFeedbackTab is enabled AND either event feedback or session ratings are enabled
const showFeedback =
  (data.appSettings?.showFeedbackTab ?? true) &&
  ((data.feedbackSettings?.eventFeedbackEnabled ?? false) ||
    (data.feedbackSettings?.sessionRatingEnabled ?? false))
const showTickets = data.appSettings?.showTicketsTab ?? true
const showFavorites = data.appSettings?.showFavoritesTab ?? true
const showNetworking = data.appSettings?.showNetworkingTab ?? false
// Session feedback button shown if feedback tab enabled AND session ratings enabled
const showSessionFeedback =
  (data.appSettings?.showFeedbackTab ?? true) &&
  (data.feedbackSettings?.sessionRatingEnabled ?? false)
// Event feedback forms (General Feedback / Report a Problem) shown only if event feedback enabled
const showEventFeedback = data.feedbackSettings?.eventFeedbackEnabled ?? false

// Determine initial view - always start with schedule (it's always enabled)
function getInitialView():
  | 'schedule'
  | 'speakers'
  | 'favorites'
  | 'feedback'
  | 'ticket'
  | 'networking' {
  return 'schedule'
}

// Search dialog state
let showSearchDialog = $state(false)

// Venue map state
let showVenueMap = $state(false)
let mapSelectedRoomId = $state<string | null>(null)

function openVenueMap(roomId?: string): void {
  mapSelectedRoomId = roomId ?? null
  showVenueMap = true
}

function closeVenueMap(): void {
  showVenueMap = false
  mapSelectedRoomId = null
}

function handleMapSelectSession(sessionId: string): void {
  closeVenueMap()
  const session = data.sessions.find((s) => s.id === sessionId)
  if (session) {
    const slot = data.slots.find((s) => s.id === session.slotId)
    if (slot) {
      selectedDay = slot.date.split('T')[0]
    }
  }
  currentView = 'schedule'
  highlightedSessionId = sessionId
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-testid="session-card-${sessionId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
  setTimeout(() => {
    highlightedSessionId = null
  }, 3000)
}

// View state
let currentView = $state<
  'schedule' | 'speakers' | 'favorites' | 'feedback' | 'ticket' | 'networking'
>(getInitialView())
let selectedDay = $state<string>('')

// Advanced filters state
let selectedTrackIds = $state<Set<string>>(new Set())
let selectedTypes = $state<Set<string>>(new Set())
let selectedRoomIds = $state<Set<string>>(new Set())
let showFilterPanel = $state(false)

// Derive available session types from data
const availableSessionTypes = $derived(() => {
  const types = new Set<string>()
  for (const session of data.sessions) {
    if (session.type && session.type !== 'break' && session.type !== 'other') {
      types.add(session.type)
    }
  }
  return Array.from(types).sort()
})

// Total active filter count
const activeFilterCount = $derived(
  selectedTrackIds.size + selectedTypes.size + selectedRoomIds.size
)

// Read filters from URL on mount
$effect(() => {
  if (!browser) return
  const unsubscribe = page.subscribe(($page) => {
    const params = $page.url.searchParams
    const tracksParam = params.get('tracks')
    const typesParam = params.get('types')
    const roomsParam = params.get('rooms')

    selectedTrackIds = tracksParam ? new Set(tracksParam.split(',').filter(Boolean)) : new Set()
    selectedTypes = typesParam ? new Set(typesParam.split(',').filter(Boolean)) : new Set()
    selectedRoomIds = roomsParam ? new Set(roomsParam.split(',').filter(Boolean)) : new Set()
  })
  return unsubscribe
})

function applyFilters(filters: {
  trackIds: Set<string>
  types: Set<string>
  roomIds: Set<string>
}): void {
  if (!browser) return
  const url = new URL(window.location.href)

  if (filters.trackIds.size > 0) {
    url.searchParams.set('tracks', Array.from(filters.trackIds).join(','))
  } else {
    url.searchParams.delete('tracks')
  }
  if (filters.types.size > 0) {
    url.searchParams.set('types', Array.from(filters.types).join(','))
  } else {
    url.searchParams.delete('types')
  }
  if (filters.roomIds.size > 0) {
    url.searchParams.set('rooms', Array.from(filters.roomIds).join(','))
  } else {
    url.searchParams.delete('rooms')
  }

  goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true })
}

// Favorites state
let favorites = $state<Set<string>>(new Set())

// Ticket lookup state
interface TicketInfo {
  id: string
  ticketNumber: string
  status: string
  attendeeFirstName: string
  attendeeLastName: string
  attendeeEmail: string
  qrCode?: string
  checkedInAt?: string
  ticketType: { name: string; description?: string } | null
  order: { orderNumber: string; status: string } | null
}
let ticketEmail = $state<string>('')
let ticketResults = $state<TicketInfo[]>([])
let isLoadingTickets = $state(false)
let ticketError = $state<string | null>(null)
let ticketLookupDone = $state(false)
let expandedQrCode = $state<{ qrCode: string; ticketNumber: string } | null>(null)

// Deep link / shared session highlight state
let highlightedSessionId = $state<string | null>(null)

// Session rating dialog state
let showSessionRatingDialog = $state(false)
let ratingSessionId = $state<string | null>(null)
let ratingSessionTitle = $state<string>('')
let sessionRatingValue = $state<number | null>(null)
let sessionRatingComment = $state<string>('')
let isSubmittingSessionRating = $state(false)
let sessionRatingSuccess = $state(false)
let sessionRatingError = $state<string | null>(null)
let isEditingFeedback = $state(false)

// Track user's existing feedback for sessions
interface UserFeedback {
  id: string
  sessionId: string
  numericValue: number
  comment?: string
}
let userFeedback = $state<Map<string, UserFeedback>>(new Map())

// Event feedback dialog state
let showEventFeedbackDialog = $state(false)
let eventFeedbackType = $state<'general' | 'problem'>('general')
let eventFeedbackRating = $state<number>(0)
let eventFeedbackMessage = $state<string>('')
let isSubmittingEventFeedback = $state(false)
let eventFeedbackSuccess = $state(false)
let eventFeedbackError = $state<string | null>(null)

// Personal notes state
let expandedNoteSessionId = $state<string | null>(null)
let sessionNotesVersion = $state(0)

function toggleNoteEditor(sessionId: string): void {
  expandedNoteSessionId = expandedNoteSessionId === sessionId ? null : sessionId
}

function sessionHasNote(sessionId: string): boolean {
  // track reactive dependency
  void sessionNotesVersion
  return browser ? notesService.hasNote(sessionId) : false
}

function handleNoteSaved(): void {
  sessionNotesVersion++
}

function exportAllNotes(): void {
  if (!browser) return
  const sessionTitleMap = new Map<string, string>()
  for (const session of data.sessions) {
    sessionTitleMap.set(session.id, session.title)
  }
  const content = notesService.exportNotes(sessionTitleMap)
  if (!content) return

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `notes-${data.edition.slug}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// Offline / connectivity state
let online = $state(browser ? navigator.onLine : true)
let lastSyncTime = $state<number | null>(null)
let isSyncing = $state(false)

const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Generate anonymous user ID for feedback
function getAnonymousUserId(): string {
  if (!browser) return ''
  const key = `feedback_user_${data.edition.slug}`
  let userId = localStorage.getItem(key)
  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem(key, userId)
  }
  return userId
}

// Initialize
$effect(() => {
  if (!browser) return

  // Set initial day
  if (data.slots.length > 0 && !selectedDay) {
    const dates = new Set<string>()
    for (const slot of data.slots) {
      dates.add(slot.date.split('T')[0])
    }
    const sorted = Array.from(dates).sort()
    selectedDay = sorted[0] || ''
  }

  loadFavorites()
  cacheSchedule()
  loadUserFeedback()
  syncRemindersToServiceWorker()

  // Deep link support: read ?session= param and scroll to that session
  const sessionParam = new URLSearchParams(window.location.search).get('session')
  if (sessionParam) {
    const session = data.sessions.find((s) => s.id === sessionParam)
    if (session) {
      const slot = data.slots.find((s) => s.id === session.slotId)
      if (slot) {
        selectedDay = slot.date.split('T')[0]
      }
      highlightedSessionId = sessionParam
      // Scroll to the session card after DOM update (use setTimeout to ensure render is complete)
      setTimeout(() => {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-testid="session-card-${sessionParam}"]`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })
      }, 100)
      // Clear highlight after a few seconds
      setTimeout(() => {
        highlightedSessionId = null
      }, 5000)
    }
  }
})

async function loadFavorites(): Promise<void> {
  if (!browser) return
  try {
    const favList = await scheduleCacheService.getFavorites(data.edition.slug)
    favorites = new Set(favList)
  } catch (err) {
    console.error('Failed to load favorites:', err)
  }
}

function syncRemindersToServiceWorker(): void {
  if (!browser || !('serviceWorker' in navigator)) return
  const reminders = reminderService.getEnabledReminders()
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.active) {
      registration.active.postMessage({
        type: 'SYNC_REMINDERS',
        reminders
      })
    }
  })
}

function buildSessionStartTime(slot: { date: string; startTime: string } | undefined): string {
  if (!slot) return ''
  const dateStr = slot.date.split('T')[0]
  return `${dateStr}T${slot.startTime}`
}

async function loadUserFeedback(): Promise<void> {
  if (!browser) return
  const userId = getAnonymousUserId()
  if (!userId) return

  try {
    const response = await fetch(
      `/api/feedback/session?userId=${encodeURIComponent(userId)}&editionId=${encodeURIComponent(data.edition.id)}`
    )
    const result = await response.json()

    if (result.success && result.feedback) {
      const feedbackMap = new Map<string, UserFeedback>()
      for (const f of result.feedback) {
        feedbackMap.set(f.sessionId, {
          id: f.id,
          sessionId: f.sessionId,
          numericValue: f.numericValue,
          comment: f.comment
        })
      }
      userFeedback = feedbackMap
    }
  } catch (err) {
    console.error('Failed to load user feedback:', err)
  }
}

async function cacheSchedule(): Promise<void> {
  if (!browser) return
  try {
    await scheduleCacheService.cacheSchedule({
      editionSlug: data.edition.slug,
      edition: data.edition,
      event: data.event,
      rooms: data.rooms,
      tracks: data.tracks,
      slots: data.slots,
      sessions: data.sessions,
      talks: data.talks
    })
  } catch (err) {
    console.error('Failed to cache schedule:', err)
  }
}

// Connectivity tracking and auto-sync
$effect(() => {
  if (!browser) return

  const handleOnline = (): void => {
    online = true
    syncData()
  }
  const handleOffline = (): void => {
    online = false
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Also subscribe to the connectivity store
  const unsubscribe = isOnline.subscribe((value) => {
    online = value
  })

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    unsubscribe()
  }
})

// Load cache stats on mount
$effect(() => {
  if (!browser) return
  loadCacheStats()
})

async function loadCacheStats(): Promise<void> {
  if (!browser) return
  try {
    const stats = await scheduleCacheService.getCacheStats(data.edition.slug)
    if (stats.lastUpdated) {
      lastSyncTime = stats.lastUpdated

      // Auto-sync if cache is older than 24h and we're online
      if (online && Date.now() - stats.lastUpdated > ONE_DAY_MS) {
        syncData()
      }
    }
  } catch {
    // Ignore errors
  }
}

async function syncData(): Promise<void> {
  if (!browser || !online || isSyncing) return
  isSyncing = true
  try {
    // Fetch fresh data in background — existing data stays visible
    await invalidateAll()
    // Cache the fresh data for offline use
    await cacheSchedule()
    lastSyncTime = Date.now()
  } catch (err) {
    console.error('Sync failed:', err)
  } finally {
    isSyncing = false
  }
}

function formatLastSync(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

async function toggleFavorite(sessionId: string): Promise<void> {
  if (!browser) return
  try {
    const isNowFavorite = await scheduleCacheService.toggleFavorite(sessionId, data.edition.slug)
    if (isNowFavorite) {
      favorites = new Set([...favorites, sessionId])
    } else {
      const newFavorites = new Set(favorites)
      newFavorites.delete(sessionId)
      favorites = newFavorites
    }
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
  }
}

// Session rating functions
function openSessionRatingDialog(sessionId: string, sessionTitle: string): void {
  ratingSessionId = sessionId
  ratingSessionTitle = sessionTitle
  sessionRatingSuccess = false
  sessionRatingError = null

  // Check if user already has feedback for this session
  const existingFeedback = userFeedback.get(sessionId)
  if (existingFeedback) {
    isEditingFeedback = true
    sessionRatingValue = existingFeedback.numericValue
    sessionRatingComment = existingFeedback.comment || ''
  } else {
    isEditingFeedback = false
    sessionRatingValue = null
    sessionRatingComment = ''
  }

  showSessionRatingDialog = true
}

function closeSessionRatingDialog(): void {
  showSessionRatingDialog = false
  ratingSessionId = null
  ratingSessionTitle = ''
  sessionRatingValue = null
  sessionRatingComment = ''
  sessionRatingSuccess = false
  sessionRatingError = null
  isEditingFeedback = false
}

async function submitSessionRating(): Promise<void> {
  if (!ratingSessionId || sessionRatingValue === null) return

  isSubmittingSessionRating = true
  sessionRatingError = null

  try {
    const response = await fetch('/api/feedback/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: ratingSessionId,
        editionId: data.edition.id,
        userId: getAnonymousUserId(),
        numericValue: sessionRatingValue,
        comment: sessionRatingComment.trim() || undefined
      })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      sessionRatingError = result.error || 'Failed to submit rating'
      return
    }

    // Update local feedback state
    const newFeedback = new Map(userFeedback)
    newFeedback.set(ratingSessionId, {
      id: result.feedback.id,
      sessionId: ratingSessionId,
      numericValue: sessionRatingValue,
      comment: sessionRatingComment.trim() || undefined
    })
    userFeedback = newFeedback

    sessionRatingSuccess = true
    setTimeout(() => {
      closeSessionRatingDialog()
    }, 1500)
  } catch (err) {
    console.error('Failed to submit session rating:', err)
    sessionRatingError = 'Failed to submit rating. Please try again.'
  } finally {
    isSubmittingSessionRating = false
  }
}

// Event feedback functions
function openEventFeedbackDialog(type: 'general' | 'problem'): void {
  eventFeedbackType = type
  eventFeedbackRating = 0
  eventFeedbackMessage = ''
  eventFeedbackSuccess = false
  eventFeedbackError = null
  showEventFeedbackDialog = true
}

function closeEventFeedbackDialog(): void {
  showEventFeedbackDialog = false
  eventFeedbackRating = 0
  eventFeedbackMessage = ''
  eventFeedbackSuccess = false
  eventFeedbackError = null
}

async function submitEventFeedback(): Promise<void> {
  if (!eventFeedbackMessage.trim()) return

  isSubmittingEventFeedback = true
  eventFeedbackError = null

  try {
    const response = await fetch('/api/feedback/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editionId: data.edition.id,
        userId: getAnonymousUserId(),
        feedbackType: eventFeedbackType,
        numericValue: eventFeedbackRating > 0 ? eventFeedbackRating : null,
        message: eventFeedbackMessage.trim()
      })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      eventFeedbackError = result.error || 'Failed to submit feedback'
      return
    }

    eventFeedbackSuccess = true
    setTimeout(() => {
      closeEventFeedbackDialog()
    }, 1500)
  } catch (err) {
    console.error('Failed to submit event feedback:', err)
    eventFeedbackError = 'Failed to submit feedback. Please try again.'
  } finally {
    isSubmittingEventFeedback = false
  }
}

// Ticket lookup functions
async function lookupTickets(): Promise<void> {
  if (!ticketEmail.trim()) return

  isLoadingTickets = true
  ticketError = null
  ticketResults = []

  try {
    const response = await fetch('/api/tickets/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ticketEmail.trim().toLowerCase(),
        editionId: data.edition.id
      })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      ticketError = result.error || 'Failed to find tickets'
      return
    }

    ticketResults = result.tickets
    ticketLookupDone = true

    // Save email for convenience
    if (browser) {
      localStorage.setItem(`ticket_email_${data.edition.slug}`, ticketEmail.trim().toLowerCase())
    }
  } catch (err) {
    console.error('Failed to lookup tickets:', err)
    ticketError = 'Failed to lookup tickets. Please try again.'
  } finally {
    isLoadingTickets = false
  }
}

function resetTicketLookup(): void {
  ticketResults = []
  ticketLookupDone = false
  ticketError = null
}

// Load saved email on init and auto-lookup
$effect(() => {
  if (browser && !ticketEmail && !ticketLookupDone) {
    const savedEmail = localStorage.getItem(`ticket_email_${data.edition.slug}`)
    if (savedEmail) {
      ticketEmail = savedEmail
      // Auto-lookup tickets with saved email
      lookupTickets()
    }
  }
})

// Helper functions
function formatTime(time: string): string {
  return time.slice(0, 5) // HH:MM
}

function formatDate(date: string): string {
  return sharedFormatDate(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

// Get unique dates
const uniqueDates = $derived(() => {
  const dates = new Set<string>()
  for (const slot of data.slots) {
    dates.add(slot.date.split('T')[0])
  }
  return Array.from(dates).sort()
})

// Check if a session matches the current advanced filters
function matchesFilters(session: { trackId?: string; type: string; slotId: string }): boolean {
  if (selectedTrackIds.size > 0 && (!session.trackId || !selectedTrackIds.has(session.trackId)))
    return false
  if (selectedTypes.size > 0 && !selectedTypes.has(session.type)) return false
  if (selectedRoomIds.size > 0) {
    const slot = data.slots.find((s) => s.id === session.slotId)
    if (slot && !selectedRoomIds.has(slot.roomId)) return false
  }
  return true
}

// Get sessions for selected day
const sessionsForDay = $derived(() => {
  const daySlots = data.slots.filter((s) => s.date.split('T')[0] === selectedDay)
  const daySlotIds = new Set(daySlots.map((s) => s.id))

  return data.sessions
    .filter((session) => {
      if (!daySlotIds.has(session.slotId)) return false
      if (!matchesFilters(session)) return false
      return true
    })
    .map((session) => {
      const slot = data.slots.find((s) => s.id === session.slotId)
      const room = slot ? data.rooms.find((r) => r.id === slot.roomId) : undefined
      const track = session.trackId ? data.tracks.find((t) => t.id === session.trackId) : undefined
      const talk = session.talkId ? data.talks.find((t) => t.id === session.talkId) : undefined

      return { session, slot, room, track, talk }
    })
    .sort((a, b) => {
      if (!a.slot || !b.slot) return 0
      return a.slot.startTime.localeCompare(b.slot.startTime)
    })
})

// Get favorite sessions
const favoriteSessions = $derived(() => {
  return data.sessions
    .filter((session) => favorites.has(session.id) && matchesFilters(session))
    .map((session) => {
      const slot = data.slots.find((s) => s.id === session.slotId)
      const room = slot ? data.rooms.find((r) => r.id === slot.roomId) : undefined
      const track = session.trackId ? data.tracks.find((t) => t.id === session.trackId) : undefined
      const talk = session.talkId ? data.talks.find((t) => t.id === session.talkId) : undefined

      return { session, slot, room, track, talk }
    })
    .sort((a, b) => {
      if (!a.slot || !b.slot) return 0
      const dateCompare = a.slot.date.localeCompare(b.slot.date)
      if (dateCompare !== 0) return dateCompare
      return a.slot.startTime.localeCompare(b.slot.startTime)
    })
})

// Calendar export helpers
function toIcalSession(
  session: { id: string; title: string; description?: string },
  slot: { date: string; startTime: string; endTime: string } | undefined,
  room: { name: string; floor?: string } | undefined,
  track: { name: string; color?: string } | undefined,
  talk: { speakers: Array<{ firstName: string; lastName: string }> } | undefined
): IcalSession {
  const dateStr = slot?.date?.split('T')[0] ?? ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return {
    id: session.id,
    title: session.title,
    description: session.description,
    date: new Date(year, month - 1, day),
    startTime: slot?.startTime ?? '00:00',
    endTime: slot?.endTime ?? '00:00',
    roomName: room?.name,
    roomFloor: room?.floor,
    trackName: track?.name,
    trackColor: track?.color,
    speakerNames: talk?.speakers.map((s) => `${s.firstName} ${s.lastName}`)
  }
}

const calendarEventInfo: IcalEventInfo = {
  eventName: data.event.name,
  eventSlug: data.event.id,
  editionName: data.edition.name,
  editionSlug: data.edition.slug,
  location:
    [data.edition.venue, data.edition.city, data.edition.country].filter(Boolean).join(', ') ||
    undefined,
  timezone: 'Europe/Paris',
  organizerEmail: 'noreply@example.com',
  organizerName: data.event.name,
  baseUrl: browser ? window.location.origin : ''
}

// Get unique speakers from all talks with session info
const uniqueSpeakers = $derived(() => {
  const speakerMap = new Map<
    string,
    {
      id: string
      firstName: string
      lastName: string
      company?: string
      bio?: string
      photoUrl?: string
      talks: Array<{
        id: string
        title: string
        date?: string
        startTime?: string
        endTime?: string
        roomName?: string
      }>
    }
  >()

  for (const talk of data.talks) {
    // Find session for this talk
    const session = data.sessions.find((s) => s.talkId === talk.id)
    const slot = session ? data.slots.find((s) => s.id === session.slotId) : undefined
    const room = slot ? data.rooms.find((r) => r.id === slot.roomId) : undefined

    for (const speaker of talk.speakers) {
      if (!speakerMap.has(speaker.id)) {
        speakerMap.set(speaker.id, {
          ...speaker,
          talks: []
        })
      }
      speakerMap.get(speaker.id)?.talks.push({
        id: talk.id,
        title: talk.title,
        date: slot?.date,
        startTime: slot?.startTime,
        endTime: slot?.endTime,
        roomName: room?.name
      })
    }
  }

  // Sort speakers by name, and their talks by date/time
  return Array.from(speakerMap.values())
    .map((speaker) => ({
      ...speaker,
      talks: speaker.talks.sort((a, b) => {
        if (!a.date || !b.date) return 0
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return (a.startTime || '').localeCompare(b.startTime || '')
      })
    }))
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
})

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    talk: 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400',
    workshop: 'border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400',
    keynote: 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400',
    panel: 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400',
    break: 'border-gray-400 text-gray-500 dark:border-gray-500 dark:text-gray-400',
    other: 'border-gray-400 text-gray-500 dark:border-gray-500 dark:text-gray-400'
  }
  return colors[type] || colors.other
}

function formatSpeakers(speakers: Array<{ firstName: string; lastName: string }>): string {
  return speakers.map((s) => `${s.firstName} ${s.lastName}`).join(', ')
}

// Custom color styles from app settings, falling back to event branding
const customStyles = $derived(() => {
  const primary = data.appSettings?.primaryColor || data.eventBranding?.primaryColor
  const accent = data.appSettings?.accentColor
  if (!primary && !accent) return undefined
  let style = ''
  if (primary) style += `--color-primary: ${primary}; --color-primary-foreground: white; `
  if (accent) style += `--color-accent: ${accent};`
  return style
})

// Effective logo and header image: appSettings overrides event branding
const effectiveLogoUrl = $derived(data.appSettings?.logoUrl || data.eventBranding?.logoUrl)
const effectiveHeaderImageUrl = $derived(
  data.appSettings?.headerImageUrl || data.eventBranding?.bannerUrl
)

// Theme toggle state
let currentTheme = $state<'light' | 'dark' | 'system'>('system')

// Initialize theme from localStorage
$effect(() => {
  if (!browser) return
  try {
    const stored = localStorage.getItem('theme')
    if (stored) {
      currentTheme = JSON.parse(stored) as 'light' | 'dark' | 'system'
    }
    applyTheme(currentTheme)
  } catch {
    // Ignore errors
  }
})

function applyTheme(value: 'light' | 'dark' | 'system'): void {
  if (!browser) return
  const isDark =
    value === 'dark' ||
    (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

function toggleTheme(): void {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', JSON.stringify(currentTheme))
  applyTheme(currentTheme)
}

// Reduced motion state
let currentReducedMotion = $state<'system' | 'on' | 'off'>('system')

$effect(() => {
  if (!browser) return
  const unsubscribe = reducedMotion.subscribe((value) => {
    currentReducedMotion = value
  })
  return unsubscribe
})

function handleToggleReducedMotion(): void {
  toggleReducedMotion()
}

// Expanded session state for keyboard accessibility
let expandedSessionId = $state<string | null>(null)

function toggleSessionExpanded(sessionId: string): void {
  expandedSessionId = expandedSessionId === sessionId ? null : sessionId
}

function handleSessionKeydown(event: KeyboardEvent, sessionId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleSessionExpanded(sessionId)
  }
}

// Focus management: move focus to content area when switching tabs
function switchView(view: typeof currentView): void {
  currentView = view
  if (browser) {
    // Allow DOM to update, then focus the main content area
    requestAnimationFrame(() => {
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.focus()
      }
    })
  }
}

// Handle Escape key for QR code overlay
function handleQrOverlayKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    expandedQrCode = null
  }
}

function handleSearchSelectSession(sessionId: string): void {
  const session = data.sessions.find((s) => s.id === sessionId)
  if (session) {
    const slot = data.slots.find((s) => s.id === session.slotId)
    if (slot) {
      selectedDay = slot.date.split('T')[0]
    }
  }
  currentView = 'schedule'
  showSearchDialog = false
}

function handleSearchSelectSpeaker(_speakerId: string): void {
  currentView = 'speakers'
  showSearchDialog = false
}
</script>

<svelte:head>
	<title>{data.appSettings?.title || data.edition.name} - {m.app_title_suffix()}</title>
	<meta
		name="description"
		content={m.app_meta_description({ title: data.appSettings?.title || data.edition.name })}
	/>
	<!-- Open Graph metadata for social sharing -->
	<meta property="og:title" content="{data.appSettings?.title || data.edition.name} - {m.app_title_suffix()}" />
	<meta property="og:description" content={m.app_meta_description({ title: data.appSettings?.title || data.edition.name })} />
	<meta property="og:type" content="website" />
	{#if effectiveLogoUrl}
		<meta property="og:image" content={effectiveLogoUrl} />
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col bg-background" style={customStyles()}>
	<!-- Skip to content link for keyboard users -->
	<a
		href="#main-content"
		class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
	>
		{m.app_skip_to_content()}
	</a>

	<!-- Header -->
	<AppHeader
		editionName={data.edition.name}
		appTitle={data.appSettings?.title}
		appSubtitle={data.appSettings?.subtitle}
		logoUrl={effectiveLogoUrl}
		headerImageUrl={effectiveHeaderImageUrl}
		startDate={data.edition.startDate}
		venue={data.edition.venue}
		{online}
		{isSyncing}
		{lastSyncTime}
		{currentTheme}
		{currentReducedMotion}
		{formatLastSync}
		onSearch={() => (showSearchDialog = true)}
		onExportNotes={exportAllNotes}
		onToggleReducedMotion={handleToggleReducedMotion}
		onToggleTheme={toggleTheme}
		onSyncData={syncData}
		{formatDate}
	/>


	<!-- Main Content -->
	<main id="main-content" tabindex="-1" class="flex-1 pb-20 outline-none" aria-label={m.app_main_content()}>
		{#if currentView === 'schedule'}
			<AppSchedule
				uniqueDates={uniqueDates()}
				{selectedDay}
				sessionsForDay={sessionsForDay()}
				{favorites}
				{showFavorites}
				{showSessionFeedback}
				{showFilterPanel}
				{activeFilterCount}
				tracks={data.tracks}
				rooms={data.rooms}
				sessionTypes={availableSessionTypes()}
				{selectedTrackIds}
				{selectedTypes}
				{selectedRoomIds}
				{expandedSessionId}
				{highlightedSessionId}
				{expandedNoteSessionId}
				{userFeedback}
				{calendarEventInfo}
				editionSlug={data.edition.slug}
				{formatDate}
				{formatTime}
				{getTypeColor}
				{formatSpeakers}
				{toIcalSession}
				{buildSessionStartTime}
				{sessionHasNote}
				onSelectDay={(day) => (selectedDay = day)}
				onToggleFavorite={toggleFavorite}
				onToggleSessionExpanded={toggleSessionExpanded}
				onHandleSessionKeydown={handleSessionKeydown}
				onOpenVenueMap={openVenueMap}
				onOpenFilterPanel={() => (showFilterPanel = true)}
				onCloseFilterPanel={() => (showFilterPanel = false)}
				onApplyFilters={applyFilters}
				onOpenSessionRating={openSessionRatingDialog}
				onToggleNoteEditor={toggleNoteEditor}
				onNoteSaved={handleNoteSaved}
				onSyncReminders={syncRemindersToServiceWorker}
			/>
		{:else if currentView === 'speakers'}
			<AppSpeakers
				speakers={uniqueSpeakers()}
				{formatDate}
				{formatTime}
			/>
		{:else if currentView === 'favorites'}
			<AppFavorites
				favoriteSessions={favoriteSessions()}
				{userFeedback}
				{showSessionFeedback}
				{calendarEventInfo}
				editionSlug={data.edition.slug}
				{formatDate}
				{formatTime}
				{getTypeColor}
				{formatSpeakers}
				{toIcalSession}
				{buildSessionStartTime}
				onToggleFavorite={toggleFavorite}
				onOpenSessionRating={openSessionRatingDialog}
				onSyncReminders={syncRemindersToServiceWorker}
			/>
		{:else if currentView === 'feedback'}
			<AppFeedback
				{showEventFeedback}
				{showSessionFeedback}
				feedbackIntroText={data.feedbackSettings?.feedbackIntroText}
				onOpenEventFeedback={openEventFeedbackDialog}
			/>
		{:else if currentView === 'ticket'}
			<AppTicket
				{ticketEmail}
				{ticketResults}
				{isLoadingTickets}
				{ticketError}
				{ticketLookupDone}
				{expandedQrCode}
				editionName={data.edition.name}
				startDate={data.edition.startDate}
				venue={data.edition.venue}
				{formatDate}
				onLookupTickets={lookupTickets}
				onResetTicketLookup={resetTicketLookup}
				onExpandQrCode={(qr) => expandedQrCode = qr}
				onEmailChange={(email) => ticketEmail = email}
			/>
		{:else if currentView === 'networking'}
			<BadgeScannerView editionSlug={data.edition.slug} />
		{/if}
	</main>

	<!-- Bottom Navigation -->
	<AppBottomNav
		{currentView}
		{showSpeakers}
		{showFavorites}
		{showTickets}
		{showNetworking}
		{showFeedback}
		favoritesCount={favorites.size}
		onSwitchView={switchView}
	/>
</div>

<!-- Session Rating Dialog -->
{#if showSessionRatingDialog && data.feedbackSettings?.sessionRatingMode}
	<Dialog.Content class="max-w-md" onClose={closeSessionRatingDialog}>
		<Dialog.Header>
			<Dialog.Title>{isEditingFeedback ? m.app_feedback_edit_title() : m.app_feedback_rate_session()}</Dialog.Title>
			<Dialog.Description>
				{ratingSessionTitle}
			</Dialog.Description>
		</Dialog.Header>

		{#if sessionRatingSuccess}
			<div class="flex flex-col items-center py-8">
				<CheckCircle2 class="h-12 w-12 text-green-500" />
				<p class="mt-4 font-medium">
					{isEditingFeedback ? m.app_feedback_updated() : m.app_feedback_thank_you()}
				</p>
			</div>
		{:else}
			<div class="space-y-6 py-4">
				<RatingInput
					mode={data.feedbackSettings.sessionRatingMode}
					value={sessionRatingValue}
					onValueChange={(v) => (sessionRatingValue = v)}
				/>

				<div class="space-y-2">
					<Label for="session-comment">
						{m.app_feedback_comment()}
						{#if data.feedbackSettings.sessionCommentRequired}
							<span class="text-destructive">*</span>
						{/if}
					</Label>
					<Textarea
						id="session-comment"
						placeholder={m.app_feedback_comment_placeholder()}
						bind:value={sessionRatingComment}
						rows={3}
					/>
				</div>

				{#if sessionRatingError}
					<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
						<AlertCircle class="mr-2 inline h-4 w-4" aria-hidden="true" />
						{sessionRatingError}
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Button variant="outline" onclick={closeSessionRatingDialog}>
					{m.action_cancel()}
				</Button>
				<Button
					onclick={submitSessionRating}
					disabled={sessionRatingValue === null || isSubmittingSessionRating || (data.feedbackSettings.sessionCommentRequired && !sessionRatingComment.trim())}
				>
					{#if isSubmittingSessionRating}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{isEditingFeedback ? m.app_feedback_updating() : m.app_feedback_submitting()}
					{:else}
						{isEditingFeedback ? m.app_feedback_update() : m.app_feedback_submit()}
					{/if}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
{/if}

<!-- Event Feedback Dialog -->
{#if showEventFeedbackDialog}
	<Dialog.Content class="max-w-md" onClose={closeEventFeedbackDialog}>
		<Dialog.Header>
			<Dialog.Title>
				{eventFeedbackType === 'general' ? m.app_feedback_general() : m.app_feedback_problem()}
			</Dialog.Title>
			<Dialog.Description>
				{eventFeedbackType === 'general'
					? m.app_feedback_general_description()
					: m.app_feedback_dialog_description_problem()}
			</Dialog.Description>
		</Dialog.Header>

		{#if eventFeedbackSuccess}
			<div class="flex flex-col items-center py-8">
				<CheckCircle2 class="h-12 w-12 text-green-500" />
				<p class="mt-4 font-medium">{m.app_feedback_thank_you()}</p>
				<p class="mt-1 text-sm text-muted-foreground">{m.app_feedback_thank_you_time()}</p>
			</div>
		{:else}
			<div class="space-y-4 py-4">
				{#if eventFeedbackType === 'general'}
					<!-- Star rating for general feedback -->
					<div class="space-y-2">
						<Label>{m.app_feedback_rating()}</Label>
						<div class="flex justify-center gap-1">
							{#each [1, 2, 3, 4, 5] as star}
								<button
									type="button"
									onclick={() => (eventFeedbackRating = eventFeedbackRating === star ? 0 : star)}
									class="p-1 transition-transform hover:scale-110"
									aria-label="{star}/5"
								>
									<Star
										class="h-8 w-8 {star <= eventFeedbackRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}"
									/>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="feedback-message">
						{m.app_feedback_message()} <span class="text-destructive">*</span>
					</Label>
					<Textarea
						id="feedback-message"
						placeholder={eventFeedbackType === 'general' ? m.app_feedback_message_placeholder_general() : m.app_feedback_message_placeholder_problem()}
						bind:value={eventFeedbackMessage}
						rows={5}
						maxlength={5000}
					/>
					<p class="text-xs text-muted-foreground">
						{m.app_feedback_characters({ count: eventFeedbackMessage.length })}
					</p>
				</div>

				{#if eventFeedbackError}
					<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
						<AlertCircle class="mr-2 inline h-4 w-4" aria-hidden="true" />
						{eventFeedbackError}
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Button variant="outline" onclick={closeEventFeedbackDialog}>
					{m.action_cancel()}
				</Button>
				<Button
					onclick={submitEventFeedback}
					disabled={!eventFeedbackMessage.trim() || isSubmittingEventFeedback}
				>
					{#if isSubmittingEventFeedback}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{m.app_feedback_submitting()}
					{:else}
						{m.app_feedback_submit()}
					{/if}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
{/if}

<!-- Fullscreen QR Code Overlay -->
{#if expandedQrCode}
	<button
		type="button"
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
		onclick={() => expandedQrCode = null}
		onkeydown={handleQrOverlayKeydown}
		aria-label={m.app_qr_code_close()}
	>
		<div class="flex flex-col items-center">
			<div class="bg-white p-6 rounded-2xl">
				<img
					src={expandedQrCode.qrCode}
					alt={m.app_qr_code_alt()}
					class="w-72 h-72 sm:w-80 sm:h-80"
				/>
			</div>
			<p class="mt-4 font-mono text-lg text-white">{expandedQrCode.ticketNumber}</p>
			<p class="mt-2 text-sm text-white/70">{m.app_ticket_qr_tap_close()}</p>
		</div>
	</button>
{/if}

<!-- Search Dialog -->
<AppSearchDialog
	open={showSearchDialog}
	sessions={data.sessions}
	talks={data.talks}
	slots={data.slots}
	rooms={data.rooms}
	tracks={data.tracks}
	onClose={() => (showSearchDialog = false)}
	onSelectSession={handleSearchSelectSession}
	onSelectSpeaker={handleSearchSelectSpeaker}
/>

<!-- Venue Map -->
{#if showVenueMap}
	<VenueMap
		rooms={data.rooms}
		sessions={data.sessions}
		slots={data.slots}
		tracks={data.tracks}
		floorAmenities={data.appSettings?.floorAmenities ?? []}
		selectedRoomId={mapSelectedRoomId}
		editionSlug={data.edition.slug}
		onClose={closeVenueMap}
		onSelectSession={handleMapSelectSession}
	/>
{/if}
