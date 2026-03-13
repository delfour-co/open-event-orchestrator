<script lang="ts">
import { browser } from '$app/environment'
import { goto, invalidateAll } from '$app/navigation'
import { page } from '$app/stores'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card } from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { notesService, reminderService } from '$lib/features/app/services'
import {
  AddToCalendarMenu,
  AppFilterPanel,
  AppSearchDialog,
  BadgeScannerView,
  ReminderButton,
  SessionNoteEditor,
  SessionShareButton,
  VenueMap
} from '$lib/features/app/ui'
import { RatingInput } from '$lib/features/feedback/ui'
import type { IcalEventInfo, IcalSession } from '$lib/features/planning/domain/ical-export'
import { scheduleCacheService } from '$lib/features/planning/services/schedule-cache-service'
import * as m from '$lib/paraglide/messages'
import { isOnline } from '$lib/stores/connectivity'
import { isMotionReduced, reducedMotion, toggleReducedMotion } from '$lib/stores/reduced-motion'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileDown,
  Filter,
  Heart,
  Loader2,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Moon,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  StickyNote,
  Sun,
  Ticket,
  Users,
  Wifi,
  WifiOff,
  Zap,
  ZapOff
} from 'lucide-svelte'
import type { PageData } from './$types'

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
let eventFeedbackSubject = $state<string>('')
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
  eventFeedbackSubject = ''
  eventFeedbackMessage = ''
  eventFeedbackSuccess = false
  eventFeedbackError = null
  showEventFeedbackDialog = true
}

function closeEventFeedbackDialog(): void {
  showEventFeedbackDialog = false
  eventFeedbackSubject = ''
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
        subject: eventFeedbackSubject.trim() || undefined,
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
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
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

// Custom color styles from app settings
const customStyles = $derived(() => {
  const primary = data.appSettings?.primaryColor
  const accent = data.appSettings?.accentColor
  if (!primary && !accent) return undefined
  let style = ''
  if (primary) style += `--color-primary: ${primary}; --color-primary-foreground: white; `
  if (accent) style += `--color-accent: ${accent};`
  return style
})

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
  // applyReducedMotion is handled by the layout subscription
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
	{#if data.appSettings?.logoUrl}
		<meta property="og:image" content={data.appSettings.logoUrl} />
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
	<header class="relative border-b bg-card overflow-hidden">
		{#if data.appSettings?.headerImageUrl}
			<div class="absolute inset-0">
				<img
					src={data.appSettings.headerImageUrl}
					alt=""
					aria-hidden="true"
					class="h-full w-full object-cover opacity-20"
				/>
				<div class="absolute inset-0 bg-gradient-to-b from-transparent to-card"></div>
			</div>
		{/if}
		<div class="relative mx-auto max-w-4xl px-4 py-6">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-4">
					{#if data.appSettings?.logoUrl}
						<img
							src={data.appSettings.logoUrl}
							alt="{data.appSettings?.title || data.edition.name} logo"
							class="h-12 w-12 rounded-lg object-contain"
						/>
					{/if}
					<div>
						<h1 data-testid="edition-name" class="text-2xl font-bold tracking-tight">{data.appSettings?.title || data.edition.name}</h1>
						{#if data.appSettings?.subtitle}
							<p class="text-sm text-muted-foreground">{data.appSettings.subtitle}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<!-- Search Button -->
					<Button onclick={() => (showSearchDialog = true)} variant="ghost" size="icon" class="shrink-0" title={m.app_search_button()} data-testid="search-button">
						<Search class="h-5 w-5" />
						<span class="sr-only">{m.app_search_button()}</span>
					</Button>
					<!-- Export Notes Button -->
					<Button onclick={exportAllNotes} variant="ghost" size="icon" class="shrink-0" title={m.app_notes_export()} data-testid="export-notes-button">
						<FileDown class="h-5 w-5" />
						<span class="sr-only">{m.app_notes_export()}</span>
					</Button>
					<!-- Reduced Motion Toggle -->
					<Button onclick={handleToggleReducedMotion} variant="ghost" size="icon" class="shrink-0" title={m.app_toggle_reduced_motion()}>
						{#if isMotionReduced(currentReducedMotion)}
							<ZapOff class="h-5 w-5" />
						{:else}
							<Zap class="h-5 w-5" />
						{/if}
						<span class="sr-only">{m.app_toggle_reduced_motion()}</span>
					</Button>
					<!-- Theme Toggle -->
					<Button onclick={toggleTheme} variant="ghost" size="icon" class="shrink-0" title={m.app_toggle_theme()}>
						{#if currentTheme === 'dark'}
							<Sun class="h-5 w-5" />
						{:else}
							<Moon class="h-5 w-5" />
						{/if}
						<span class="sr-only">{m.app_toggle_theme()}</span>
					</Button>
				</div>
			</div>
			<div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
				<div class="flex items-center gap-1.5">
					<Calendar class="h-4 w-4" />
					<span>{formatDate(data.edition.startDate)}</span>
				</div>
				{#if data.edition.venue}
					<div class="flex items-center gap-1.5">
						<MapPin class="h-4 w-4" />
						<span>{data.edition.venue}</span>
					</div>
				{/if}
			</div>
			<!-- Sync status -->
			<div class="mt-3 flex flex-wrap items-center gap-3 text-xs">
				{#if online}
					<div class="flex items-center gap-1.5 text-green-600 dark:text-green-400">
						<Wifi class="h-3.5 w-3.5" />
						<span>{m.app_online()}</span>
					</div>
				{:else}
					<div class="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
						<WifiOff class="h-3.5 w-3.5" />
						<span class="font-medium">{m.app_cached()}</span>
					</div>
				{/if}
				{#if lastSyncTime}
					<span class="text-muted-foreground">
						{m.app_last_sync({ time: formatLastSync(lastSyncTime) })}
					</span>
				{/if}
				{#if online}
					<button
						type="button"
						class="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
						onclick={syncData}
						disabled={isSyncing}
					>
						<RefreshCw class="h-3 w-3 {isSyncing ? 'animate-spin' : ''}" />
						<span>{m.app_sync_now()}</span>
					</button>
				{/if}
			</div>
		</div>
	</header>

	
	<!-- Main Content -->
	<main id="main-content" tabindex="-1" class="flex-1 pb-20 outline-none" aria-label={m.app_main_content()}>
		{#if currentView === 'schedule'}
			<div class="mx-auto max-w-4xl">
				<h2 class="sr-only">{m.app_schedule_heading()}</h2>
				<!-- Day Selector -->
				{#if uniqueDates().length > 0}
					<div class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
						<div class="flex gap-2 overflow-x-auto px-4 py-3">
							{#each uniqueDates() as dateStr}
								<button
									type="button"
									data-testid="day-selector-{dateStr}"
									class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors {selectedDay === dateStr ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}"
									onclick={() => (selectedDay = dateStr)}
								>
									{formatDate(dateStr)}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Advanced Filters Button -->
				<div class="border-b bg-muted/30 px-4 py-2" role="group" aria-label={m.app_filter_sessions()}>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							class="h-8 gap-1.5 text-xs"
							onclick={() => (showFilterPanel = true)}
							data-testid="open-filters-button"
						>
							<Filter class="h-3.5 w-3.5" />
							{m.app_filter_title()}
							{#if activeFilterCount > 0}
								<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
									{activeFilterCount}
								</span>
							{/if}
						</Button>
						{#if activeFilterCount > 0}
							<Button
								variant="ghost"
								size="sm"
								class="h-8 text-xs text-muted-foreground"
								onclick={() => applyFilters({ trackIds: new Set(), types: new Set(), roomIds: new Set() })}
							>
								{m.app_filter_clear_all()}
							</Button>
						{/if}
						{#if data.rooms.length > 0}
							<Button
								variant="outline"
								size="sm"
								class="h-8 gap-1.5 text-xs ml-auto"
								onclick={() => openVenueMap()}
								data-testid="open-map-button"
							>
								<MapIcon class="h-3.5 w-3.5" />
								{m.app_map_button()}
							</Button>
						{/if}
					</div>
				</div>

				<!-- Session List -->
				<div class="space-y-2 p-4" aria-live="polite">
					{#if sessionsForDay().length === 0}
						<Card class="p-12 text-center">
							<Calendar class="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 class="mt-4 text-lg font-semibold">{m.app_schedule_empty_title()}</h3>
							<p class="mt-2 text-sm text-muted-foreground">
								{m.app_schedule_empty_description()}
							</p>
						</Card>
					{:else}
						{#each sessionsForDay() as { session, slot, room, track, talk }}
							{@const isExpanded = expandedSessionId === session.id}
							<Card
								data-testid="session-card-{session.id}"
								class="group relative overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/50 {highlightedSessionId === session.id ? 'ring-2 ring-primary ring-offset-2' : ''}"
								tabindex={0}
								role="button"
								aria-expanded={isExpanded}
								aria-label="{session.title} — {isExpanded ? m.app_collapse_session() : m.app_expand_session()}"
								onkeydown={(e: KeyboardEvent) => handleSessionKeydown(e, session.id)}
								onclick={() => toggleSessionExpanded(session.id)}
							>
								<div class="p-4">
									<!-- Time, Room & Favorite -->
									<div class="mb-2 flex items-center justify-between">
										<div class="flex items-center gap-3 text-xs text-muted-foreground">
											{#if slot}
												<span class="flex items-center gap-1 font-mono">
													<Clock class="h-3 w-3" />
													{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
												</span>
											{/if}
											{#if room}
												<button
													type="button"
													class="flex items-center gap-1 hover:text-primary hover:underline"
													onclick={(e) => { e.stopPropagation(); openVenueMap(room.id) }}
													aria-label="{room.name} - {m.app_map_title()}"
													data-testid="room-link-{room.id}"
												>
													<MapPin class="h-3 w-3" />
													{room.name}
												</button>
											{/if}
										</div>
										<!-- Stop propagation on interactive children so card click/keydown doesn't fire -->
										<div class="flex items-center gap-0.5" onclick={(e: MouseEvent) => e.stopPropagation()} onkeydown={(e: KeyboardEvent) => e.stopPropagation()} role="presentation">
											<AddToCalendarMenu
												sessions={[toIcalSession(session, slot, room, track, talk)]}
												eventInfo={calendarEventInfo}
												mode="single"
											/>
											<SessionShareButton
												sessionTitle={session.title}
												sessionUrl={browser ? `${window.location.origin}/app/${data.edition.slug}?session=${session.id}` : ''}
											/>
											{#if showFavorites}
												<button
													type="button"
													data-testid="favorite-button-{session.id}"
													class="rounded-full p-1.5 transition-colors hover:bg-muted"
													onclick={() => toggleFavorite(session.id)}
													aria-label={favorites.has(session.id) ? m.app_favorite_remove() : m.app_favorite_add()}
													aria-pressed={favorites.has(session.id)}
												>
													<Heart
														class="h-4 w-4 {favorites.has(session.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}"
														aria-hidden="true"
													/>
												</button>
											{/if}
											<ReminderButton
												sessionId={session.id}
												sessionTitle={session.title}
												roomName={room?.name ?? ''}
												startTime={buildSessionStartTime(slot)}
												editionSlug={data.edition.slug}
												onReminderChange={() => syncRemindersToServiceWorker()}
											/>
											<button
												type="button"
												data-testid="note-button-{session.id}"
												class="rounded-full p-1.5 transition-colors hover:bg-muted"
												onclick={() => toggleNoteEditor(session.id)}
												aria-label={m.app_notes_indicator()}
												aria-pressed={expandedNoteSessionId === session.id}
											>
												<StickyNote
													class="h-4 w-4 {sessionHasNote(session.id) ? 'fill-amber-200 text-amber-600 dark:fill-amber-800 dark:text-amber-400' : 'text-muted-foreground hover:text-amber-500'}"
													aria-hidden="true"
												/>
											</button>
										</div>
									</div>

									<!-- Title & Type -->
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 space-y-1">
											<h3 class="font-semibold leading-snug">{session.title}</h3>
											{#if talk?.speakers && talk.speakers.length > 0}
												<p class="text-sm text-muted-foreground">
													{formatSpeakers(talk.speakers)}
												</p>
											{/if}
										</div>
										<Badge variant="outline" class="shrink-0 {getTypeColor(session.type)}">
											{session.type}
										</Badge>
									</div>

									<!-- Track & Feedback Row -->
									<div class="mt-3 flex items-center justify-between gap-2">
										{#if track}
											<div class="flex items-center gap-1.5 text-xs">
												<span
													class="h-2 w-2 rounded-full"
													style="background-color: {track.color}"
												></span>
												<span class="text-muted-foreground">{track.name}</span>
											</div>
										{:else}
											<div></div>
										{/if}
										<!-- Stop propagation on feedback button -->
										<div onclick={(e: MouseEvent) => e.stopPropagation()} onkeydown={(e: KeyboardEvent) => e.stopPropagation()} role="presentation">
											{#if showSessionFeedback}
												<Button
													variant="outline"
													size="sm"
													class="h-7 text-xs"
													onclick={() => openSessionRatingDialog(session.id, session.title)}
												>
													{#if userFeedback.has(session.id)}
														{m.app_feedback_modify()}
													{:else}
														{m.app_feedback_give()}
													{/if}
												</Button>
											{/if}
										</div>
									</div>

													{#if expandedNoteSessionId === session.id}
														<SessionNoteEditor
															sessionId={session.id}
															sessionTitle={session.title}
															onSaved={handleNoteSaved}
														/>
													{/if}
								</div>
							</Card>
						{/each}
					{/if}
				</div>
			</div>
		{:else if currentView === 'speakers'}
			<div class="mx-auto max-w-4xl p-4">
				<h2 class="sr-only">{m.app_speakers_heading()}</h2>
				{#if uniqueSpeakers().length === 0}
					<Card class="p-12 text-center">
						<Users class="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 class="mt-4 text-lg font-semibold">{m.app_speakers_empty_title()}</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							{m.app_speakers_empty_description()}
						</p>
					</Card>
				{:else}
					<div class="grid gap-4 sm:grid-cols-2">
						{#each uniqueSpeakers() as speaker}
							<Card class="p-4">
								<div class="flex gap-3">
									{#if speaker.photoUrl}
										<img
											src={speaker.photoUrl}
											alt="{speaker.firstName} {speaker.lastName}"
											class="h-14 w-14 shrink-0 rounded-full object-cover"
										/>
									{:else}
										<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
											<Users class="h-7 w-7 text-muted-foreground" />
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold">{speaker.firstName} {speaker.lastName}</h3>
										{#if speaker.company}
											<p class="text-sm text-muted-foreground">{speaker.company}</p>
										{/if}
									</div>
								</div>
								{#if speaker.talks.length > 0}
									<div class="mt-3 space-y-2 border-t pt-3">
										{#each speaker.talks as talk}
											<div class="rounded-md bg-muted/50 p-2">
												<p class="text-sm font-medium leading-snug">{talk.title}</p>
												{#if talk.startTime || talk.roomName}
													<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
														{#if talk.date && talk.startTime}
															<span class="flex items-center gap-1">
																<Clock class="h-3 w-3" />
																{formatDate(talk.date)} · {formatTime(talk.startTime)}{#if talk.endTime}-{formatTime(talk.endTime)}{/if}
															</span>
														{/if}
														{#if talk.roomName}
															<span class="flex items-center gap-1">
																<MapPin class="h-3 w-3" />
																{talk.roomName}
															</span>
														{/if}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</Card>
						{/each}
					</div>
				{/if}
			</div>
		{:else if currentView === 'favorites'}
			<div class="mx-auto max-w-4xl p-4">
				<h2 class="sr-only">{m.app_favorites_heading()}</h2>
				{#if favoriteSessions().length === 0}
					<Card class="p-12 text-center">
						<Heart class="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 class="mt-4 text-lg font-semibold">{m.app_favorites_empty_title()}</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							{m.app_favorites_empty_description()}
						</p>
					</Card>
				{:else}
					<div class="mb-4 flex justify-end">
						<AddToCalendarMenu
							sessions={favoriteSessions().map(({ session, slot, room, track, talk }) => toIcalSession(session, slot, room, track, talk))}
							eventInfo={calendarEventInfo}
							mode="bulk"
						/>
					</div>
					{@const sessionsByDate = favoriteSessions().reduce<
						Record<string, ReturnType<typeof favoriteSessions>>
					>((acc, item) => {
						if (!item.slot) return acc
						const date = item.slot.date.split('T')[0]
						if (!acc[date]) acc[date] = []
						acc[date].push(item)
						return acc
					}, {})}

					<div class="space-y-6">
						{#each Object.entries(sessionsByDate).sort(([a], [b]) => a.localeCompare(b)) as [date, sessions]}
							<div>
								<h2 class="mb-3 text-sm font-semibold text-muted-foreground">
									{formatDate(date)}
								</h2>
								<div class="space-y-2">
									{#each sessions as { session, slot, room, track, talk }}
										<Card class="p-4">
											<!-- Time, Room & Favorite -->
											<div class="mb-2 flex items-center justify-between">
												<div class="flex items-center gap-3 text-xs text-muted-foreground">
													{#if slot}
														<span class="flex items-center gap-1 font-mono">
															<Clock class="h-3 w-3" />
															{formatTime(slot.startTime)}
														</span>
													{/if}
													{#if room}
														<span class="flex items-center gap-1">
															<MapPin class="h-3 w-3" />
															{room.name}
														</span>
													{/if}
												</div>
												<div class="flex items-center gap-0.5">
													<AddToCalendarMenu
														sessions={[toIcalSession(session, slot, room, track, talk)]}
														eventInfo={calendarEventInfo}
														mode="single"
													/>
													<SessionShareButton
														sessionTitle={session.title}
														sessionUrl={browser ? `${window.location.origin}/app/${data.edition.slug}?session=${session.id}` : ''}
													/>
													<button
														type="button"
														class="rounded-full p-1.5 transition-colors hover:bg-muted"
														onclick={() => toggleFavorite(session.id)}
														aria-label={m.app_favorite_remove_agenda()}
													>
														<Heart class="h-4 w-4 fill-red-500 text-red-500" aria-hidden="true" />
													</button>
													<ReminderButton
														sessionId={session.id}
														sessionTitle={session.title}
														roomName={room?.name ?? ''}
														startTime={buildSessionStartTime(slot)}
														editionSlug={data.edition.slug}
														onReminderChange={() => syncRemindersToServiceWorker()}
													/>
												</div>
											</div>
											<!-- Title & Type -->
											<div class="flex items-start justify-between gap-2">
												<h3 class="font-semibold">{session.title}</h3>
												<Badge variant="outline" class="shrink-0 {getTypeColor(session.type)}">
													{session.type}
												</Badge>
											</div>
											{#if talk?.speakers && talk.speakers.length > 0}
												<p class="mt-1 text-sm text-muted-foreground">
													{formatSpeakers(talk.speakers)}
												</p>
											{/if}
											{#if showSessionFeedback}
												<div class="mt-3 flex justify-end">
													<Button
														variant="outline"
														size="sm"
														class="h-7 text-xs"
														onclick={() => openSessionRatingDialog(session.id, session.title)}
													>
														{#if userFeedback.has(session.id)}
															{m.app_feedback_modify()}
														{:else}
															{m.app_feedback_give()}
														{/if}
													</Button>
												</div>
											{/if}
										</Card>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else if currentView === 'feedback'}
			<div class="mx-auto max-w-2xl p-4">
				<h2 class="sr-only">{m.app_feedback_heading()}</h2>
				{#if showEventFeedback}
					<div class="space-y-4">
						<button
							type="button"
							class="w-full text-left"
							onclick={() => openEventFeedbackDialog('general')}
						>
							<Card class="p-6 transition-colors hover:bg-muted/50">
								<div class="flex items-start gap-3">
									<MessageSquare class="mt-0.5 h-5 w-5 text-primary" />
									<div class="flex-1">
										<h3 class="font-semibold">{m.app_feedback_general()}</h3>
										<p class="mt-1 text-sm text-muted-foreground">
											{m.app_feedback_general_description()}
										</p>
									</div>
									<ChevronRight class="h-5 w-5 text-muted-foreground" />
								</div>
							</Card>
						</button>

						<button
							type="button"
							class="w-full text-left"
							onclick={() => openEventFeedbackDialog('problem')}
						>
							<Card class="p-6 transition-colors hover:bg-muted/50">
								<div class="flex items-start gap-3">
									<AlertCircle class="mt-0.5 h-5 w-5 text-orange-600" />
									<div class="flex-1">
										<h3 class="font-semibold">{m.app_feedback_problem()}</h3>
										<p class="mt-1 text-sm text-muted-foreground">
											{m.app_feedback_problem_description()}
										</p>
									</div>
									<ChevronRight class="h-5 w-5 text-muted-foreground" />
								</div>
							</Card>
						</button>
					</div>

					{#if data.feedbackSettings?.feedbackIntroText}
						<p class="mt-6 text-center text-sm text-muted-foreground">
							{data.feedbackSettings.feedbackIntroText}
						</p>
					{/if}
				{:else if showSessionFeedback}
					<div class="text-center py-8">
						<MessageSquare class="mx-auto h-12 w-12 text-muted-foreground/50" />
						<h3 class="mt-4 text-lg font-medium">{m.app_feedback_session_title()}</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							{m.app_feedback_session_description()}
						</p>
					</div>
				{:else}
					<div class="text-center py-8">
						<MessageSquare class="mx-auto h-12 w-12 text-muted-foreground/50" />
						<h3 class="mt-4 text-lg font-medium">{m.app_feedback_unavailable_title()}</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							{m.app_feedback_unavailable_description()}
						</p>
					</div>
				{/if}
			</div>
		{:else if currentView === 'ticket'}
			<div class="mx-auto max-w-2xl p-4" aria-live="polite">
				<h2 class="sr-only">{m.app_ticket_heading()}</h2>
				{#if !ticketLookupDone}
					<!-- Ticket Lookup Form -->
					<Card class="p-6">
						<div class="space-y-4">
							<div class="flex items-center gap-3">
								<Ticket class="h-6 w-6 text-primary" />
								<div>
									<h3 class="font-semibold">{m.app_ticket_find_title()}</h3>
									<p class="text-sm text-muted-foreground">
										{m.app_ticket_find_description()}
									</p>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="ticket-email">{m.app_ticket_email_label()}</Label>
								<div class="flex gap-2">
									<Input
										id="ticket-email"
										type="email"
										placeholder={m.app_ticket_email_placeholder()}
										bind:value={ticketEmail}
										class="flex-1"
										onkeydown={(e) => e.key === 'Enter' && lookupTickets()}
									/>
									<Button onclick={lookupTickets} disabled={isLoadingTickets || !ticketEmail.trim()} aria-label={m.app_ticket_lookup_button()}>
										{#if isLoadingTickets}
											<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
										{:else}
											<Mail class="h-4 w-4" aria-hidden="true" />
										{/if}
									</Button>
								</div>
							</div>

							{#if ticketError}
								<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
									<AlertCircle class="mr-2 inline h-4 w-4" />
									{ticketError}
								</div>
							{/if}
						</div>
					</Card>
				{:else if ticketResults.length === 0}
					<!-- No Tickets Found -->
					<Card class="p-12 text-center">
						<Ticket class="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 class="mt-4 text-lg font-semibold">{m.app_ticket_not_found_title()}</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							{m.app_ticket_not_found_description({ email: ticketEmail })}
						</p>
						<Button class="mt-4" variant="outline" onclick={resetTicketLookup}>
							{m.app_ticket_try_another()}
						</Button>
					</Card>
				{:else}
					<!-- Ticket Results -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<p class="text-sm text-muted-foreground">
								{ticketResults.length === 1
									? m.app_ticket_found_one({ email: ticketEmail })
									: m.app_ticket_found_many({ count: ticketResults.length, email: ticketEmail })}
							</p>
							<Button variant="ghost" size="sm" onclick={resetTicketLookup}>
								{m.app_ticket_change_email()}
							</Button>
						</div>

						{#each ticketResults as ticket}
							<Card class="overflow-hidden">
								<div class="bg-primary p-4 text-primary-foreground">
									<div class="flex items-center justify-between">
										<div>
											<p class="text-xs opacity-80">{m.app_ticket_number({ number: ticket.ticketNumber })}</p>
											<p class="text-lg font-bold">
												{ticket.attendeeFirstName} {ticket.attendeeLastName}
											</p>
										</div>
										<div class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
											{ticket.status === 'valid' ? m.app_ticket_status_valid() : ticket.status === 'used' ? m.app_ticket_status_checked_in() : ticket.status}
										</div>
									</div>
								</div>

								<div class="p-4 space-y-4">
									{#if ticket.ticketType}
										<div>
											<p class="text-sm font-medium">{ticket.ticketType.name}</p>
											{#if ticket.ticketType.description}
												<p class="text-xs text-muted-foreground">{ticket.ticketType.description}</p>
											{/if}
										</div>
									{/if}

									<div class="grid grid-cols-2 gap-4 text-sm">
										<div>
											<p class="text-muted-foreground">{m.app_ticket_event()}</p>
											<p class="font-medium">{data.edition.name}</p>
										</div>
										<div>
											<p class="text-muted-foreground">{m.app_ticket_date()}</p>
											<p class="font-medium">{formatDate(data.edition.startDate)}</p>
										</div>
										{#if data.edition.venue}
											<div class="col-span-2">
												<p class="text-muted-foreground">{m.app_ticket_venue()}</p>
												<p class="font-medium">{data.edition.venue}</p>
											</div>
										{/if}
									</div>

									{#if ticket.qrCode && ticket.status === 'valid'}
										<div class="flex flex-col items-center border-t pt-4">
											<QrCode class="h-6 w-6 text-muted-foreground mb-2" />
											<p class="text-xs text-muted-foreground mb-2">{m.app_ticket_qr_tap_enlarge()}</p>
											<button
												type="button"
												class="bg-white p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
												onclick={() => expandedQrCode = { qrCode: ticket.qrCode!, ticketNumber: ticket.ticketNumber }}
												aria-label={m.app_qr_code_enlarge({ number: ticket.ticketNumber })}
											>
												<img
													src={ticket.qrCode}
													alt={m.app_qr_code_alt()}
													class="h-48 w-48"
												/>
											</button>
											<p class="mt-2 font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</p>
										</div>
									{/if}

									{#if ticket.checkedInAt}
										<div class="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
											<CheckCircle2 class="mr-2 inline h-4 w-4" />
											{m.app_ticket_checked_in_on({ date: new Date(ticket.checkedInAt).toLocaleString() })}
										</div>
									{/if}
								</div>
							</Card>
						{/each}
					</div>
				{/if}
			</div>
		{:else if currentView === 'networking'}
			<BadgeScannerView editionSlug={data.edition.slug} />
		{/if}
	</main>

	<!-- Bottom Navigation -->
	<nav class="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-area-bottom" aria-label={m.app_nav_label()}>
		<div class="mx-auto flex max-w-4xl">
			<button
				type="button"
				data-testid="schedule-tab"
				class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'schedule' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
				onclick={() => switchView('schedule')}
				aria-current={currentView === 'schedule' ? 'page' : undefined}
			>
				<Calendar class="h-5 w-5" aria-hidden="true" />
				<span>{m.app_nav_schedule()}</span>
			</button>
			{#if showFavorites}
				<button
					type="button"
					data-testid="favorites-tab"
					class="relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'favorites' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => switchView('favorites')}
					aria-current={currentView === 'favorites' ? 'page' : undefined}
				>
					<Heart class="h-5 w-5" aria-hidden="true" />
					<span>{m.app_nav_favorites()}</span>
					{#if favorites.size > 0}
						<span class="absolute right-1/4 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground" aria-hidden="true">{favorites.size}</span>
					{/if}
				</button>
			{/if}
			{#if showSpeakers}
				<button
					type="button"
					data-testid="speakers-tab"
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'speakers' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => switchView('speakers')}
					aria-current={currentView === 'speakers' ? 'page' : undefined}
				>
					<Users class="h-5 w-5" aria-hidden="true" />
					<span>{m.app_nav_speakers()}</span>
				</button>
			{/if}
			{#if showTickets}
				<button
					type="button"
					data-testid="tickets-tab"
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'ticket' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => switchView('ticket')}
					aria-current={currentView === 'ticket' ? 'page' : undefined}
				>
					<Ticket class="h-5 w-5" aria-hidden="true" />
					<span>{m.app_nav_my_ticket()}</span>
				</button>
			{/if}
			{#if showNetworking}
				<button
					type="button"
					data-testid="networking-tab"
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'networking' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => switchView('networking')}
					aria-current={currentView === 'networking' ? 'page' : undefined}
				>
					<ScanLine class="h-5 w-5" aria-hidden="true" />
					<span>{m.app_nav_networking()}</span>
				</button>
			{/if}
			{#if showFeedback}
				<button
					type="button"
					data-testid="feedback-tab"
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'feedback' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => switchView('feedback')}
					aria-current={currentView === 'feedback' ? 'page' : undefined}
				>
					<MessageSquare class="h-5 w-5" aria-hidden="true" />
					<span>{m.app_nav_feedback()}</span>
				</button>
			{/if}
		</div>
	</nav>
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
				<div class="space-y-2">
					<Label for="feedback-subject">{m.app_feedback_subject()}</Label>
					<Input
						id="feedback-subject"
						placeholder={eventFeedbackType === 'general' ? m.app_feedback_subject_placeholder_general() : m.app_feedback_subject_placeholder_problem()}
						bind:value={eventFeedbackSubject}
						maxlength={200}
					/>
				</div>

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

<!-- Advanced Filter Panel -->
<AppFilterPanel
  open={showFilterPanel}
  tracks={data.tracks}
  rooms={data.rooms}
  sessionTypes={availableSessionTypes()}
  {selectedTrackIds}
  {selectedTypes}
  {selectedRoomIds}
  onApply={applyFilters}
  onClose={() => (showFilterPanel = false)}
/>

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
