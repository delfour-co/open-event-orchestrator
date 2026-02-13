<script lang="ts">
import { browser } from '$app/environment'
import { Button } from '$lib/components/ui/button'
import { scheduleCacheService } from '$lib/features/planning/services/schedule-cache-service'
import { Calendar, Clock, DoorOpen, Heart, Layers, MapPin, Star, User } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

// View state
let currentView = $state<'schedule' | 'favorites'>('schedule')
let selectedDay = $state<string>('')
let selectedTrackId = $state<string | null>(null)

// Favorites state
let favorites = $state<Set<string>>(new Set())
let isLoadingFavorites = $state(true)

// Cache state
let cacheError = $state<string | null>(null)

// Session type styling
const sessionTypeStyles: Record<string, { bg: string; text: string; label: string }> = {
  talk: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-200',
    label: 'Talk'
  },
  workshop: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-200',
    label: 'Workshop'
  },
  keynote: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-200',
    label: 'Keynote'
  },
  panel: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-200',
    label: 'Panel'
  },
  break: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'Break'
  },
  lunch: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-200',
    label: 'Lunch'
  },
  networking: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-800 dark:text-pink-200',
    label: 'Networking'
  },
  registration: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    text: 'text-slate-700 dark:text-slate-300',
    label: 'Registration'
  },
  other: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'Other'
  }
}

// Initialize on mount
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

  // Load favorites
  loadFavorites()

  // Cache schedule for offline
  cacheSchedule()
})

async function loadFavorites(): Promise<void> {
  if (!browser) return
  isLoadingFavorites = true
  try {
    const favList = await scheduleCacheService.getFavorites(data.edition.slug)
    favorites = new Set(favList)
  } catch (err) {
    console.error('Failed to load favorites:', err)
  } finally {
    isLoadingFavorites = false
  }
}

async function cacheSchedule(): Promise<void> {
  if (!browser) return
  cacheError = null
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
    cacheError = err instanceof Error ? err.message : 'Failed to cache schedule'
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

// Helper functions
function toDate(date: string): Date {
  return new Date(date)
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(toDate(date))
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(toDate(date))
}

// Get unique dates from slots
const uniqueDates = $derived(() => {
  const dates = new Set<string>()
  for (const slot of data.slots) {
    dates.add(slot.date.split('T')[0])
  }
  return Array.from(dates).sort()
})

// Get sessions for the selected day with slot/room info
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

      return {
        session,
        slot,
        room,
        track,
        talk
      }
    })
    .sort((a, b) => {
      if (!a.slot || !b.slot) return 0
      return a.slot.startTime.localeCompare(b.slot.startTime)
    })
})

// Get favorited sessions
const favoriteSessions = $derived(() => {
  return data.sessions
    .filter((session) => favorites.has(session.id))
    .map((session) => {
      const slot = data.slots.find((s) => s.id === session.slotId)
      const room = slot ? data.rooms.find((r) => r.id === slot.roomId) : undefined
      const track = session.trackId ? data.tracks.find((t) => t.id === session.trackId) : undefined
      const talk = session.talkId ? data.talks.find((t) => t.id === session.talkId) : undefined

      return {
        session,
        slot,
        room,
        track,
        talk
      }
    })
    .sort((a, b) => {
      if (!a.slot || !b.slot) return 0
      const dateCompare = a.slot.date.localeCompare(b.slot.date)
      if (dateCompare !== 0) return dateCompare
      return a.slot.startTime.localeCompare(b.slot.startTime)
    })
})

function getSessionTypeStyle(type: string): { bg: string; text: string; label: string } {
  return sessionTypeStyles[type] || sessionTypeStyles.other
}

function formatSpeakers(
  speakers: Array<{ firstName: string; lastName: string; company?: string }>
): string {
  return speakers
    .map((s) => {
      const name = `${s.firstName} ${s.lastName}`
      return s.company ? `${name} (${s.company})` : name
    })
    .join(', ')
}
</script>

<svelte:head>
  <title>{data.edition.name} | Event Schedule</title>
  <meta name="description" content="View the schedule and build your personal agenda for {data.edition.name}" />
</svelte:head>

<div class="flex min-h-[calc(100vh-2.5rem)] flex-col">
  <!-- Header -->
  <header class="border-b bg-background px-4 py-4">
    <div class="text-center">
      <h1 class="text-xl font-bold" data-testid="edition-name">{data.edition.name}</h1>
      <p class="mt-1 text-sm text-muted-foreground">{data.event.name}</p>
    </div>

    <!-- Event Info -->
    <div class="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
      <div class="flex items-center gap-1">
        <Calendar class="h-4 w-4" />
        <span>
          {formatShortDate(data.edition.startDate)}
          {#if data.edition.endDate !== data.edition.startDate}
            - {formatShortDate(data.edition.endDate)}
          {/if}
        </span>
      </div>
      {#if data.edition.venue || data.edition.city}
        <div class="flex items-center gap-1">
          <MapPin class="h-4 w-4" />
          <span>
            {[data.edition.venue, data.edition.city].filter(Boolean).join(', ')}
          </span>
        </div>
      {/if}
    </div>
  </header>

  <!-- View Toggle -->
  <div class="flex border-b bg-muted/30">
    <button
      type="button"
      class="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors {currentView === 'schedule' ? 'border-b-2 border-primary bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}"
      onclick={() => (currentView = 'schedule')}
      data-testid="schedule-tab"
    >
      <Calendar class="h-4 w-4" />
      Schedule
    </button>
    <button
      type="button"
      class="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors {currentView === 'favorites' ? 'border-b-2 border-primary bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}"
      onclick={() => (currentView = 'favorites')}
      data-testid="favorites-tab"
    >
      <Star class="h-4 w-4" />
      My Agenda
      {#if favorites.size > 0}
        <span class="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {favorites.size}
        </span>
      {/if}
    </button>
  </div>

  <!-- Schedule View -->
  {#if currentView === 'schedule'}
    <!-- Day Selector -->
    {#if uniqueDates().length > 0}
      <div class="flex gap-2 overflow-x-auto border-b bg-background px-4 py-2">
        {#each uniqueDates() as dateStr}
          <button
            type="button"
            class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors {selectedDay === dateStr ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}"
            onclick={() => (selectedDay = dateStr)}
            data-testid="day-selector-{dateStr}"
          >
            {formatShortDate(dateStr)}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Track Filter -->
    {#if data.tracks.length > 0}
      <div class="flex gap-2 overflow-x-auto border-b bg-background px-4 py-2">
        <button
          type="button"
          class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors {selectedTrackId === null ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}"
          onclick={() => (selectedTrackId = null)}
        >
          All Tracks
        </button>
        {#each data.tracks as track}
          <button
            type="button"
            class="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors {selectedTrackId === track.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}"
            onclick={() => (selectedTrackId = track.id)}
          >
            <span class="h-2 w-2 rounded-full" style="background-color: {track.color}"></span>
            {track.name}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Session List -->
    <div class="flex-1 overflow-y-auto">
      {#if data.slots.length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <Calendar class="h-12 w-12 text-muted-foreground" />
          <h3 class="mt-4 text-lg font-semibold">Schedule Coming Soon</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            The schedule for this event is not yet available.
          </p>
        </div>
      {:else if sessionsForDay().length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <Layers class="h-12 w-12 text-muted-foreground" />
          <h3 class="mt-4 text-lg font-semibold">No Sessions</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            No sessions match your current filters.
          </p>
        </div>
      {:else}
        <div class="divide-y">
          {#each sessionsForDay() as { session, slot, room, track, talk }}
            {@const typeStyle = getSessionTypeStyle(session.type)}
            <div class="relative p-4 {typeStyle.bg}" data-testid="session-card-{session.id}">
              <!-- Favorite Button -->
              <button
                type="button"
                class="absolute right-3 top-3 rounded-full p-2 transition-colors {favorites.has(session.id) ? 'bg-red-100 text-red-600' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}"
                onclick={() => toggleFavorite(session.id)}
                aria-label={favorites.has(session.id) ? 'Remove from favorites' : 'Add to favorites'}
                data-testid="favorite-button-{session.id}"
              >
                <Heart class="h-5 w-5 {favorites.has(session.id) ? 'fill-current' : ''}" />
              </button>

              <!-- Time & Room -->
              <div class="mb-2 flex flex-wrap items-center gap-3 pr-12 text-sm text-muted-foreground">
                {#if slot}
                  <span class="flex items-center gap-1 font-mono">
                    <Clock class="h-3.5 w-3.5" />
                    {slot.startTime} - {slot.endTime}
                  </span>
                {/if}
                {#if room}
                  <span class="flex items-center gap-1">
                    <DoorOpen class="h-3.5 w-3.5" />
                    {room.name}
                  </span>
                {/if}
              </div>

              <!-- Type Badge -->
              <span class="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium {typeStyle.bg} {typeStyle.text}">
                {typeStyle.label}
              </span>

              <!-- Title -->
              <h3 class="font-semibold leading-tight">{session.title}</h3>

              <!-- Track -->
              {#if track}
                <div class="mt-2 flex items-center gap-1.5 text-xs">
                  <span class="h-2 w-2 rounded-full" style="background-color: {track.color}"></span>
                  <span class="text-muted-foreground">{track.name}</span>
                </div>
              {/if}

              <!-- Speakers -->
              {#if talk && talk.speakers.length > 0}
                <div class="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <User class="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formatSpeakers(talk.speakers)}</span>
                </div>
              {/if}

              <!-- Description (if available and short) -->
              {#if session.description && session.description.length <= 150}
                <p class="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {session.description}
                </p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Favorites View -->
  {#if currentView === 'favorites'}
    <div class="flex-1 overflow-y-auto">
      {#if isLoadingFavorites}
        <div class="flex items-center justify-center py-12">
          <svg class="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      {:else if favoriteSessions().length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center px-6">
          <Star class="h-12 w-12 text-muted-foreground" />
          <h3 class="mt-4 text-lg font-semibold">No Favorites Yet</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            Tap the heart icon on sessions to add them to your personal agenda.
          </p>
          <Button
            variant="outline"
            class="mt-4"
            onclick={() => (currentView = 'schedule')}
          >
            Browse Schedule
          </Button>
        </div>
      {:else}
        <!-- Group by date -->
        {@const sessionsByDate = favoriteSessions().reduce<Record<string, ReturnType<typeof favoriteSessions>>>((acc, item) => {
          if (!item.slot) return acc
          const date = item.slot.date.split('T')[0]
          if (!acc[date]) acc[date] = []
          acc[date].push(item)
          return acc
        }, {})}

        <div class="divide-y">
          {#each Object.entries(sessionsByDate).sort(([a], [b]) => a.localeCompare(b)) as [date, sessions]}
            <div>
              <div class="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
                {formatDate(date)}
              </div>
              <div class="divide-y">
                {#each sessions as { session, slot, room, track, talk }}
                  {@const typeStyle = getSessionTypeStyle(session.type)}
                  <div class="relative p-4 {typeStyle.bg}">
                    <!-- Favorite Button -->
                    <button
                      type="button"
                      class="absolute right-3 top-3 rounded-full p-2 bg-red-100 text-red-600"
                      onclick={() => toggleFavorite(session.id)}
                      aria-label="Remove from favorites"
                    >
                      <Heart class="h-5 w-5 fill-current" />
                    </button>

                    <!-- Time & Room -->
                    <div class="mb-2 flex flex-wrap items-center gap-3 pr-12 text-sm text-muted-foreground">
                      {#if slot}
                        <span class="flex items-center gap-1 font-mono">
                          <Clock class="h-3.5 w-3.5" />
                          {slot.startTime} - {slot.endTime}
                        </span>
                      {/if}
                      {#if room}
                        <span class="flex items-center gap-1">
                          <DoorOpen class="h-3.5 w-3.5" />
                          {room.name}
                        </span>
                      {/if}
                    </div>

                    <!-- Type Badge -->
                    <span class="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium {typeStyle.bg} {typeStyle.text}">
                      {typeStyle.label}
                    </span>

                    <!-- Title -->
                    <h3 class="font-semibold leading-tight">{session.title}</h3>

                    <!-- Track -->
                    {#if track}
                      <div class="mt-2 flex items-center gap-1.5 text-xs">
                        <span class="h-2 w-2 rounded-full" style="background-color: {track.color}"></span>
                        <span class="text-muted-foreground">{track.name}</span>
                      </div>
                    {/if}

                    <!-- Speakers -->
                    {#if talk && talk.speakers.length > 0}
                      <div class="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <User class="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{formatSpeakers(talk.speakers)}</span>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Cache Status (if error) -->
  {#if cacheError}
    <div class="border-t bg-amber-50 px-4 py-2 text-center text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
      Offline sync failed: {cacheError}
    </div>
  {/if}
</div>
