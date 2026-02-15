<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Card } from '$lib/components/ui/card'
import { Textarea } from '$lib/components/ui/textarea'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as Dialog from '$lib/components/ui/dialog'
import { RatingInput } from '$lib/features/feedback/ui'
import { scheduleCacheService } from '$lib/features/planning/services/schedule-cache-service'
import {
	Calendar,
	Clock,
	MapPin,
	Heart,
	MessageSquare,
	AlertCircle,
	Star,
	Filter,
	ChevronRight,
	Loader2,
	CheckCircle2,
	Ticket,
	QrCode,
	Mail
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
	data: PageData
}

const { data }: Props = $props()

// View state
let currentView = $state<'schedule' | 'favorites' | 'feedback' | 'ticket'>('schedule')
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

// Session rating dialog state
let showSessionRatingDialog = $state(false)
let ratingSessionId = $state<string | null>(null)
let ratingSessionTitle = $state<string>('')
let sessionRatingValue = $state<number | null>(null)
let sessionRatingComment = $state<string>('')
let isSubmittingSessionRating = $state(false)
let sessionRatingSuccess = $state(false)
let sessionRatingError = $state<string | null>(null)

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
		const isNowFavorite = await scheduleCacheService.toggleFavorite(
			sessionId,
			data.edition.slug
		)
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
	sessionRatingValue = null
	sessionRatingComment = ''
	sessionRatingSuccess = false
	sessionRatingError = null
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

// Load saved email on init
$effect(() => {
	if (browser && !ticketEmail) {
		const savedEmail = localStorage.getItem(`ticket_email_${data.edition.slug}`)
		if (savedEmail) {
			ticketEmail = savedEmail
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
			const track = session.trackId
				? data.tracks.find((t) => t.id === session.trackId)
				: undefined
			const talk = session.talkId
				? data.talks.find((t) => t.id === session.talkId)
				: undefined

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
			const track = session.trackId
				? data.tracks.find((t) => t.id === session.trackId)
				: undefined
			const talk = session.talkId
				? data.talks.find((t) => t.id === session.talkId)
				: undefined

			return { session, slot, room, track, talk }
		})
		.sort((a, b) => {
			if (!a.slot || !b.slot) return 0
			const dateCompare = a.slot.date.localeCompare(b.slot.date)
			if (dateCompare !== 0) return dateCompare
			return a.slot.startTime.localeCompare(b.slot.startTime)
		})
})

function getTypeColor(type: string): string {
	const colors: Record<string, string> = {
		talk: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
		workshop:
			'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
		keynote: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
		panel: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
		break: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
		other: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400'
	}
	return colors[type] || colors.other
}

function formatSpeakers(speakers: Array<{ firstName: string; lastName: string }>): string {
	return speakers.map((s) => `${s.firstName} ${s.lastName}`).join(', ')
}
</script>

<svelte:head>
	<title>{data.edition.name} - Attendee App</title>
	<meta
		name="description"
		content="View the schedule and build your agenda for {data.edition.name}"
	/>
</svelte:head>

<div class="flex min-h-screen flex-col bg-background">
	<!-- Minimalist Header -->
	<header class="border-b bg-card">
		<div class="mx-auto max-w-4xl px-4 py-6">
			<h1 class="text-2xl font-bold tracking-tight">{data.edition.name}</h1>
			<div class="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

	<!-- Navigation Tabs -->
	<nav class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
		<div class="mx-auto flex max-w-4xl">
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {currentView === 'schedule' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => (currentView = 'schedule')}
			>
				<Calendar class="h-4 w-4" />
				Schedule
			</button>
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {currentView === 'favorites' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => (currentView = 'favorites')}
			>
				<Heart class="h-4 w-4" />
				My Agenda
				{#if favorites.size > 0}
					<Badge variant="secondary" class="ml-1">{favorites.size}</Badge>
				{/if}
			</button>
			{#if data.feedbackSettings?.eventFeedbackEnabled}
				<button
					type="button"
					class="flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {currentView === 'feedback' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
					onclick={() => (currentView = 'feedback')}
				>
					<MessageSquare class="h-4 w-4" />
					Feedback
				</button>
			{/if}
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {currentView === 'ticket' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => (currentView = 'ticket')}
			>
				<Ticket class="h-4 w-4" />
				My Ticket
			</button>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="flex-1">
		{#if currentView === 'schedule'}
			<div class="mx-auto max-w-4xl">
				<!-- Day Selector -->
				{#if uniqueDates().length > 0}
					<div class="sticky top-[49px] z-10 border-b bg-background/95 backdrop-blur">
						<div class="flex gap-2 overflow-x-auto px-4 py-3">
							{#each uniqueDates() as dateStr}
								<button
									type="button"
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
								All
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
							<h3 class="mt-4 text-lg font-semibold">No sessions</h3>
							<p class="mt-2 text-sm text-muted-foreground">
								No sessions scheduled for this day.
							</p>
						</Card>
					{:else}
						{#each sessionsForDay() as { session, slot, room, track, talk }}
							<Card class="group relative overflow-hidden transition-shadow hover:shadow-md">
								<div class="p-4">
									<!-- Time & Room -->
									<div class="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
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
										<Badge variant="secondary" class="{getTypeColor(session.type)} shrink-0">
											{session.type}
										</Badge>
									</div>

									<!-- Track & Actions Row -->
									<div class="mt-2 flex items-center justify-between">
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
										<div class="flex items-center gap-2">
											{#if data.feedbackSettings?.sessionRatingEnabled}
												<button
													type="button"
													class="rounded-full p-1.5 transition-colors hover:bg-muted"
													onclick={() => openSessionRatingDialog(session.id, session.title)}
													title="Rate session"
												>
													<Star class="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
												</button>
											{/if}
											<button
												type="button"
												class="rounded-full p-1.5 transition-colors hover:bg-muted"
												onclick={() => toggleFavorite(session.id)}
												title={favorites.has(session.id) ? 'Remove from agenda' : 'Add to agenda'}
											>
												<Heart
													class="h-4 w-4 {favorites.has(session.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}"
												/>
											</button>
										</div>
									</div>
								</div>
							</Card>
						{/each}
					{/if}
				</div>
			</div>
		{:else if currentView === 'favorites'}
			<div class="mx-auto max-w-4xl p-4">
				{#if favoriteSessions().length === 0}
					<Card class="p-12 text-center">
						<Heart class="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 class="mt-4 text-lg font-semibold">No favorites yet</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							Save sessions to build your personal agenda.
						</p>
						<Button class="mt-4" onclick={() => (currentView = 'schedule')}>
							Browse Schedule
						</Button>
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
											<div class="flex items-start justify-between gap-2">
												<div class="flex-1">
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
													<h3 class="mt-2 font-semibold">{session.title}</h3>
													{#if talk?.speakers && talk.speakers.length > 0}
														<p class="mt-1 text-sm text-muted-foreground">
															{formatSpeakers(talk.speakers)}
														</p>
													{/if}
													<div class="mt-2 flex items-center gap-2">
														<Badge variant="secondary" class="{getTypeColor(session.type)}">
															{session.type}
														</Badge>
														{#if data.feedbackSettings?.sessionRatingEnabled}
															<button
																type="button"
																class="rounded-full p-1 transition-colors hover:bg-muted"
																onclick={() => openSessionRatingDialog(session.id, session.title)}
																title="Rate session"
															>
																<Star class="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
															</button>
														{/if}
													</div>
												</div>
												<button
													type="button"
													class="shrink-0 rounded-full p-1.5 transition-colors hover:bg-muted"
													onclick={() => toggleFavorite(session.id)}
													title="Remove from agenda"
												>
													<Heart class="h-4 w-4 fill-red-500 text-red-500" />
												</button>
											</div>
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
									<h3 class="font-semibold">General Feedback</h3>
									<p class="mt-1 text-sm text-muted-foreground">
										Share your thoughts about the event
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
									<h3 class="font-semibold">Report a Problem</h3>
									<p class="mt-1 text-sm text-muted-foreground">
										Let us know about any issues at the event
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
									<h3 class="font-semibold">Find Your Ticket</h3>
									<p class="text-sm text-muted-foreground">
										Enter the email used for your ticket purchase
									</p>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="ticket-email">Email Address</Label>
								<div class="flex gap-2">
									<Input
										id="ticket-email"
										type="email"
										placeholder="your@email.com"
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
						<h3 class="mt-4 text-lg font-semibold">No tickets found</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							No tickets were found for {ticketEmail}
						</p>
						<Button class="mt-4" variant="outline" onclick={resetTicketLookup}>
							Try Another Email
						</Button>
					</Card>
				{:else}
					<!-- Ticket Results -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<p class="text-sm text-muted-foreground">
								{ticketResults.length} ticket{ticketResults.length > 1 ? 's' : ''} found for {ticketEmail}
							</p>
							<Button variant="ghost" size="sm" onclick={resetTicketLookup}>
								Change Email
							</Button>
						</div>

						{#each ticketResults as ticket}
							<Card class="overflow-hidden">
								<div class="bg-primary p-4 text-primary-foreground">
									<div class="flex items-center justify-between">
										<div>
											<p class="text-xs opacity-80">Ticket #{ticket.ticketNumber}</p>
											<p class="text-lg font-bold">
												{ticket.attendeeFirstName} {ticket.attendeeLastName}
											</p>
										</div>
										<div class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
											{ticket.status === 'valid' ? 'Valid' : ticket.status === 'used' ? 'Checked In' : ticket.status}
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
											<p class="text-muted-foreground">Event</p>
											<p class="font-medium">{data.edition.name}</p>
										</div>
										<div>
											<p class="text-muted-foreground">Date</p>
											<p class="font-medium">{formatDate(data.edition.startDate)}</p>
										</div>
										{#if data.edition.venue}
											<div class="col-span-2">
												<p class="text-muted-foreground">Venue</p>
												<p class="font-medium">{data.edition.venue}</p>
											</div>
										{/if}
									</div>

									{#if ticket.qrCode && ticket.status === 'valid'}
										<div class="flex flex-col items-center border-t pt-4">
											<QrCode class="h-6 w-6 text-muted-foreground mb-2" />
											<p class="text-xs text-muted-foreground mb-2">Show this at check-in</p>
											<div class="bg-white p-4 rounded-lg">
												<img
													src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodeURIComponent(ticket.qrCode)}"
													alt="Ticket QR Code"
													class="h-48 w-48"
												/>
											</div>
											<p class="mt-2 font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</p>
										</div>
									{/if}

									{#if ticket.checkedInAt}
										<div class="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
											<CheckCircle2 class="mr-2 inline h-4 w-4" />
											Checked in on {new Date(ticket.checkedInAt).toLocaleString()}
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
</div>

<!-- Session Rating Dialog -->
{#if showSessionRatingDialog && data.feedbackSettings?.sessionRatingMode}
	<Dialog.Content class="max-w-md" onClose={closeSessionRatingDialog}>
		<Dialog.Header>
			<Dialog.Title>Rate Session</Dialog.Title>
			<Dialog.Description>
				{ratingSessionTitle}
			</Dialog.Description>
		</Dialog.Header>

		{#if sessionRatingSuccess}
			<div class="flex flex-col items-center py-8">
				<CheckCircle2 class="h-12 w-12 text-green-500" />
				<p class="mt-4 font-medium">Thank you for your feedback!</p>
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
						Comment
						{#if data.feedbackSettings.sessionCommentRequired}
							<span class="text-destructive">*</span>
						{/if}
					</Label>
					<Textarea
						id="session-comment"
						placeholder="Share your thoughts about this session..."
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
					Cancel
				</Button>
				<Button
					onclick={submitSessionRating}
					disabled={sessionRatingValue === null || isSubmittingSessionRating || (data.feedbackSettings.sessionCommentRequired && !sessionRatingComment.trim())}
				>
					{#if isSubmittingSessionRating}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Submitting...
					{:else}
						Submit Rating
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
				{eventFeedbackType === 'general' ? 'General Feedback' : 'Report a Problem'}
			</Dialog.Title>
			<Dialog.Description>
				{eventFeedbackType === 'general'
					? 'Share your thoughts about the event'
					: 'Let us know about any issues you encountered'}
			</Dialog.Description>
		</Dialog.Header>

		{#if eventFeedbackSuccess}
			<div class="flex flex-col items-center py-8">
				<CheckCircle2 class="h-12 w-12 text-green-500" />
				<p class="mt-4 font-medium">Thank you for your feedback!</p>
				<p class="mt-1 text-sm text-muted-foreground">We appreciate you taking the time.</p>
			</div>
		{:else}
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<Label for="feedback-subject">Subject (optional)</Label>
					<Input
						id="feedback-subject"
						placeholder={eventFeedbackType === 'general' ? 'What is your feedback about?' : 'Brief description of the issue'}
						bind:value={eventFeedbackSubject}
						maxlength={200}
					/>
				</div>

				<div class="space-y-2">
					<Label for="feedback-message">
						Message <span class="text-destructive">*</span>
					</Label>
					<Textarea
						id="feedback-message"
						placeholder={eventFeedbackType === 'general' ? 'Share your thoughts...' : 'Please describe the problem in detail...'}
						bind:value={eventFeedbackMessage}
						rows={5}
						maxlength={5000}
					/>
					<p class="text-xs text-muted-foreground">
						{eventFeedbackMessage.length}/5000 characters
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
					Cancel
				</Button>
				<Button
					onclick={submitEventFeedback}
					disabled={!eventFeedbackMessage.trim() || isSubmittingEventFeedback}
				>
					{#if isSubmittingEventFeedback}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Submitting...
					{:else}
						Submit Feedback
					{/if}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
{/if}
