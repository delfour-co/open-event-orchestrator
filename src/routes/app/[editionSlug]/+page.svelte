<script lang="ts">
import { browser } from '$app/environment'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card } from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { RatingInput } from '$lib/features/feedback/ui'
import { scheduleCacheService } from '$lib/features/planning/services/schedule-cache-service'
import * as m from '$lib/paraglide/messages'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  QrCode,
  Sun,
  Ticket,
  Users
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
// Session feedback button shown if feedback tab enabled AND session ratings enabled
const showSessionFeedback =
  (data.appSettings?.showFeedbackTab ?? true) &&
  (data.feedbackSettings?.sessionRatingEnabled ?? false)
// Event feedback forms (General Feedback / Report a Problem) shown only if event feedback enabled
const showEventFeedback = data.feedbackSettings?.eventFeedbackEnabled ?? false

// Determine initial view - always start with schedule (it's always enabled)
function getInitialView(): 'schedule' | 'speakers' | 'favorites' | 'feedback' | 'ticket' {
  return 'schedule'
}

// View state
let currentView = $state<'schedule' | 'speakers' | 'favorites' | 'feedback' | 'ticket'>(
  getInitialView()
)
let selectedDay = $state<string>('')
let selectedTrackId = $state<string | null>(null)

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

// Get sessions for selected day
const sessionsForDay = $derived(() => {
  const daySlots = data.slots.filter((s) => s.date.split('T')[0] === selectedDay)
  const daySlotIds = new Set(daySlots.map((s) => s.id))

  return data.sessions
    .filter((session) => {
      if (!daySlotIds.has(session.slotId)) return false
      if (selectedTrackId && session.trackId !== selectedTrackId) return false
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
    .filter((session) => favorites.has(session.id))
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
</script>

<svelte:head>
	<title>{data.appSettings?.title || data.edition.name} - {m.app_title_suffix()}</title>
	<meta
		name="description"
		content={m.app_meta_description({ title: data.appSettings?.title || data.edition.name })}
	/>
</svelte:head>

<div class="flex min-h-screen flex-col bg-background" style={customStyles()}>
	<!-- Header -->
	<header class="relative border-b bg-card overflow-hidden">
		{#if data.appSettings?.headerImageUrl}
			<div class="absolute inset-0">
				<img
					src={data.appSettings.headerImageUrl}
					alt=""
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
							alt="Logo"
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
				<!-- Theme Toggle -->
				<Button onclick={toggleTheme} variant="ghost" size="icon" class="shrink-0">
					{#if currentTheme === 'dark'}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
					<span class="sr-only">{m.app_toggle_theme()}</span>
				</Button>
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
		</div>
	</header>

	
	<!-- Main Content -->
	<main class="flex-1 pb-20">
		{#if currentView === 'schedule'}
			<div class="mx-auto max-w-4xl">
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

				<!-- Track Filter -->
				{#if data.tracks.length > 1}
					<div class="border-b bg-muted/30 px-4 py-2">
						<div class="flex flex-wrap items-center gap-2">
							<Filter class="h-4 w-4 text-muted-foreground" />
							<button
								type="button"
								class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTrackId === null ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}"
								onclick={() => (selectedTrackId = null)}
							>
								{m.app_filter_all()}
							</button>
							{#each data.tracks as track}
								<button
									type="button"
									class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedTrackId === track.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}"
									onclick={() => (selectedTrackId = track.id)}
								>
									<span
										class="h-2 w-2 rounded-full"
										style="background-color: {track.color}"
									></span>
									{track.name}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Session List -->
				<div class="space-y-2 p-4">
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
							<Card data-testid="session-card-{session.id}" class="group relative overflow-hidden transition-shadow hover:shadow-md">
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
												<span class="flex items-center gap-1">
													<MapPin class="h-3 w-3" />
													{room.name}
												</span>
											{/if}
										</div>
										{#if showFavorites}
											<button
												type="button"
												data-testid="favorite-button-{session.id}"
												class="rounded-full p-1.5 transition-colors hover:bg-muted"
												onclick={() => toggleFavorite(session.id)}
												title={favorites.has(session.id) ? m.app_favorite_remove() : m.app_favorite_add()}
											>
												<Heart
													class="h-4 w-4 {favorites.has(session.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}"
												/>
											</button>
										{/if}
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
							</Card>
						{/each}
					{/if}
				</div>
			</div>
		{:else if currentView === 'speakers'}
			<div class="mx-auto max-w-4xl p-4">
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
				{#if favoriteSessions().length === 0}
					<Card class="p-12 text-center">
						<Heart class="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 class="mt-4 text-lg font-semibold">{m.app_favorites_empty_title()}</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							{m.app_favorites_empty_description()}
						</p>
					</Card>
				{:else}
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
									{#each sessions as { session, slot, room, talk }}
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
												<button
													type="button"
													class="rounded-full p-1.5 transition-colors hover:bg-muted"
													onclick={() => toggleFavorite(session.id)}
													title={m.app_favorite_remove_agenda()}
												>
													<Heart class="h-4 w-4 fill-red-500 text-red-500" />
												</button>
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
			<div class="mx-auto max-w-2xl p-4">
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
									<Button onclick={lookupTickets} disabled={isLoadingTickets || !ticketEmail.trim()}>
										{#if isLoadingTickets}
											<Loader2 class="h-4 w-4 animate-spin" />
										{:else}
											<Mail class="h-4 w-4" />
										{/if}
									</Button>
								</div>
							</div>

							{#if ticketError}
								<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
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
		{/if}
	</main>

	<!-- Bottom Navigation -->
	<nav class="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-area-bottom">
		<div class="mx-auto flex max-w-4xl">
			<button
				type="button"
				data-testid="schedule-tab"
				class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'schedule' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (currentView = 'schedule')}
			>
				<Calendar class="h-5 w-5" />
				<span>{m.app_nav_schedule()}</span>
			</button>
			{#if showFavorites}
				<button
					type="button"
					data-testid="favorites-tab"
					class="relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'favorites' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentView = 'favorites')}
				>
					<Heart class="h-5 w-5" />
					<span>{m.app_nav_favorites()}</span>
					{#if favorites.size > 0}
						<span class="absolute right-1/4 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{favorites.size}</span>
					{/if}
				</button>
			{/if}
			{#if showSpeakers}
				<button
					type="button"
					data-testid="speakers-tab"
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'speakers' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentView = 'speakers')}
				>
					<Users class="h-5 w-5" />
					<span>{m.app_nav_speakers()}</span>
				</button>
			{/if}
			{#if showTickets}
				<button
					type="button"
					data-testid="tickets-tab"
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'ticket' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentView = 'ticket')}
				>
					<Ticket class="h-5 w-5" />
					<span>{m.app_nav_my_ticket()}</span>
				</button>
			{/if}
			{#if showFeedback}
				<button
					type="button"
					data-testid="feedback-tab"
					class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {currentView === 'feedback' ? 'text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentView = 'feedback')}
				>
					<MessageSquare class="h-5 w-5" />
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
					<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
						<AlertCircle class="mr-2 inline h-4 w-4" />
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
					<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
						<AlertCircle class="mr-2 inline h-4 w-4" />
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
