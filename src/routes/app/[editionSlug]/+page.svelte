<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Card } from '$lib/components/ui/card'
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
	ChevronRight
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
	data: PageData
}

const { data }: Props = $props()

// View state
let currentView = $state<'schedule' | 'favorites' | 'feedback'>('schedule')
let selectedDay = $state<string>('')
let selectedTrackId = $state<string | null>(null)

// Favorites state
let favorites = $state<Set<string>>(new Set())

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
													onclick={() => {
														// TODO: Open feedback dialog for session.id
													}}
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
													<div class="mt-2">
														<Badge variant="secondary" class="{getTypeColor(session.type)}">
															{session.type}
														</Badge>
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
					<Card class="p-6">
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

					<Card class="p-6">
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
				</div>

				{#if data.feedbackSettings?.feedbackIntroText}
					<p class="mt-6 text-center text-sm text-muted-foreground">
						{data.feedbackSettings.feedbackIntroText}
					</p>
				{/if}
			</div>
		{/if}
	</main>
</div>
