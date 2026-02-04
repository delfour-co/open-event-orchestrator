<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Calendar, Clock, DoorOpen, Download, FileText, Layers, MapPin, User } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let scheduleView = $state<'by-room' | 'by-track'>('by-room')

// Compute initial selected day from data (SSR-safe)
const getInitialDay = () => {
  if (data.slots.length === 0) return ''
  const dates = new Set<string>()
  for (const slot of data.slots) {
    const d = slot.date instanceof Date ? slot.date : new Date(slot.date)
    dates.add(d.toISOString().split('T')[0])
  }
  const sorted = Array.from(dates).sort()
  return sorted[0] || ''
}
let selectedDay = $state<string>(getInitialDay())

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

// Helper to ensure we have a Date object (handles string serialization from server)
const toDate = (date: Date | string): Date => {
  return date instanceof Date ? date : new Date(date)
}

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(toDate(date))
}

const formatShortDate = (date: Date | string) => {
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
    dates.add(toDate(slot.date).toISOString().split('T')[0])
  }
  return Array.from(dates).sort()
})

// Get slots for the selected day, grouped by room
const slotsByRoom = $derived(() => {
  const grouped: Record<string, typeof data.slots> = {}
  for (const room of data.rooms) {
    grouped[room.id] = data.slots
      .filter(
        (s) => s.roomId === room.id && toDate(s.date).toISOString().split('T')[0] === selectedDay
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return grouped
})

// Get sessions grouped by track for the selected day
const sessionsByTrack = $derived(() => {
  const grouped: Record<
    string,
    Array<{
      session: (typeof data.sessions)[0]
      slot: (typeof data.slots)[0]
      room: (typeof data.rooms)[0] | undefined
    }>
  > = {}

  // Initialize with "No Track" group
  grouped['no-track'] = []

  // Initialize track groups
  for (const track of data.tracks) {
    grouped[track.id] = []
  }

  // Filter sessions for selected day
  const daySlotIds = new Set(
    data.slots
      .filter((s) => toDate(s.date).toISOString().split('T')[0] === selectedDay)
      .map((s) => s.id)
  )

  // Populate with sessions
  for (const session of data.sessions) {
    if (!daySlotIds.has(session.slotId)) continue

    const slot = data.slots.find((s) => s.id === session.slotId)
    if (!slot) continue

    const room = data.rooms.find((r) => r.id === slot.roomId)
    const trackId = session.trackId || 'no-track'

    if (grouped[trackId]) {
      grouped[trackId].push({ session, slot, room })
    }
  }

  // Sort each track's sessions by start time
  for (const trackId of Object.keys(grouped)) {
    grouped[trackId].sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
  }

  return grouped
})

// Helper functions
function getSessionForSlot(slotId: string) {
  return data.sessions.find((s) => s.slotId === slotId)
}

function getTrackColor(trackId: string | undefined) {
  if (!trackId) return '#6b7280'
  const track = data.tracks.find((t) => t.id === trackId)
  return track?.color || '#6b7280'
}

function getTrackName(trackId: string | undefined) {
  if (!trackId) return null
  const track = data.tracks.find((t) => t.id === trackId)
  return track?.name || null
}

function getTalkForSession(talkId: string | undefined) {
  if (!talkId) return null
  return data.talks.find((t) => t.id === talkId)
}

function getSessionTypeStyle(type: string) {
  return sessionTypeStyles[type] || sessionTypeStyles.other
}

function formatSpeakers(
  speakers: Array<{ firstName: string; lastName: string; company?: string }>
) {
  return speakers
    .map((s) => {
      const name = `${s.firstName} ${s.lastName}`
      return s.company ? `${name} (${s.company})` : name
    })
    .join(', ')
}
</script>

<svelte:head>
  <title>Schedule - {data.edition.name} | {data.event.name}</title>
  <meta name="description" content="View the schedule for {data.edition.name}" />
</svelte:head>

<div class="min-h-screen bg-muted/30">
  <!-- Header -->
  <header class="border-b bg-background">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <div class="flex items-center gap-4">
        <a href="/" class="text-xl font-bold">OEO</a>
        <span class="text-muted-foreground">/</span>
        <span class="font-medium">{data.edition.name}</span>
      </div>
      <nav class="flex items-center gap-4">
        <a href="/cfp/{data.edition.slug}" class="text-sm hover:underline">CFP</a>
      </nav>
    </div>
  </header>

  <!-- Content -->
  <main class="container mx-auto px-4 py-8">
    <div class="mx-auto max-w-6xl space-y-8">
      <!-- Hero Section -->
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight">{data.edition.name}</h1>
        <p class="mt-2 text-xl text-muted-foreground">Schedule</p>
      </div>

      <!-- Event Info -->
      <Card.Root>
        <Card.Content class="flex flex-wrap items-center justify-center gap-6 pt-6">
          <div class="flex items-center gap-2">
            <Calendar class="h-5 w-5 text-muted-foreground" />
            <span>
              {formatShortDate(data.edition.startDate)}
              {#if toDate(data.edition.endDate).getTime() !== toDate(data.edition.startDate).getTime()}
                - {formatShortDate(data.edition.endDate)}
              {/if}
            </span>
          </div>
          {#if data.edition.venue || data.edition.city}
            <div class="flex items-center gap-2">
              <MapPin class="h-5 w-5 text-muted-foreground" />
              <span>
                {[data.edition.venue, data.edition.city, data.edition.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Export Buttons -->
      <div class="flex flex-wrap items-center justify-center gap-3">
        <a href="/api/schedule/{data.edition.slug}/json" download="{data.edition.slug}-schedule.json">
          <Button variant="outline" size="sm" class="gap-2">
            <Download class="h-4 w-4" />
            JSON
          </Button>
        </a>
        <a href="/api/schedule/{data.edition.slug}/ical" download="{data.edition.slug}-schedule.ics">
          <Button variant="outline" size="sm" class="gap-2">
            <Calendar class="h-4 w-4" />
            iCal
          </Button>
        </a>
        <a href="/api/schedule/{data.edition.slug}/pdf" target="_blank">
          <Button variant="outline" size="sm" class="gap-2">
            <FileText class="h-4 w-4" />
            PDF
          </Button>
        </a>
      </div>

      <!-- No schedule message -->
      {#if data.slots.length === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <Calendar class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">Schedule Coming Soon</h3>
            <p class="text-sm text-muted-foreground">
              The schedule for this event is not yet available. Check back later!
            </p>
          </Card.Content>
        </Card.Root>
      {:else}
        <!-- Day Selector + View Toggle -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <!-- Day Selector (mobile-friendly tabs) -->
          <div class="flex flex-wrap gap-2">
            {#each uniqueDates() as dateStr}
              {@const date = new Date(dateStr)}
              <Button
                variant={selectedDay === dateStr ? 'default' : 'outline'}
                size="sm"
                onclick={() => (selectedDay = dateStr)}
              >
                {formatShortDate(date)}
              </Button>
            {/each}
          </div>

          <!-- View Toggle -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">View:</span>
            <div class="flex rounded-md border">
              <button
                type="button"
                class="flex items-center gap-1 px-3 py-1.5 text-sm transition-colors {scheduleView === 'by-room' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
                onclick={() => (scheduleView = 'by-room')}
              >
                <DoorOpen class="h-4 w-4" />
                <span class="hidden sm:inline">By Room</span>
              </button>
              <button
                type="button"
                class="flex items-center gap-1 px-3 py-1.5 text-sm transition-colors {scheduleView === 'by-track' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
                onclick={() => (scheduleView = 'by-track')}
              >
                <Layers class="h-4 w-4" />
                <span class="hidden sm:inline">By Track</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Day Header -->
        {#if selectedDay}
          <h2 class="text-2xl font-semibold">{formatDate(new Date(selectedDay))}</h2>
        {/if}

        <!-- By Room View -->
        {#if scheduleView === 'by-room'}
          <!-- Desktop: Grid layout -->
          <div class="hidden lg:block">
            <div class="overflow-x-auto">
              <div class="grid gap-4" style="grid-template-columns: repeat({data.rooms.length}, minmax(250px, 1fr))">
                <!-- Room Headers -->
                {#each data.rooms as room}
                  <div class="rounded-t-lg bg-primary px-4 py-3 text-center">
                    <h3 class="font-semibold text-primary-foreground">{room.name}</h3>
                    {#if room.capacity}
                      <p class="text-xs text-primary-foreground/70">{room.capacity} seats</p>
                    {/if}
                  </div>
                {/each}

                <!-- Room Sessions -->
                {#each data.rooms as room}
                  <div class="space-y-2">
                    {#each slotsByRoom()[room.id] || [] as slot}
                      {@const session = getSessionForSlot(slot.id)}
                      {@const talk = session ? getTalkForSession(session.talkId) : null}
                      {@const typeStyle = session ? getSessionTypeStyle(session.type) : null}

                      <div
                        class="rounded-lg border p-3 transition-shadow hover:shadow-md {session ? typeStyle?.bg : 'bg-muted/50'}"
                        style={session && session.trackId ? `border-left: 4px solid ${getTrackColor(session.trackId)}` : ''}
                      >
                        <!-- Time -->
                        <div class="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Clock class="h-3 w-3" />
                          {slot.startTime} - {slot.endTime}
                        </div>

                        {#if session}
                          <!-- Session Type Badge -->
                          <span class="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium {typeStyle?.bg} {typeStyle?.text}">
                            {typeStyle?.label}
                          </span>

                          <!-- Title -->
                          <h4 class="font-medium leading-tight">{session.title}</h4>

                          <!-- Track -->
                          {#if session.trackId}
                            {@const trackName = getTrackName(session.trackId)}
                            {#if trackName}
                              <div class="mt-1 flex items-center gap-1 text-xs">
                                <div
                                  class="h-2 w-2 rounded-full"
                                  style="background-color: {getTrackColor(session.trackId)}"
                                ></div>
                                <span class="text-muted-foreground">{trackName}</span>
                              </div>
                            {/if}
                          {/if}

                          <!-- Speakers -->
                          {#if talk && talk.speakers.length > 0}
                            <div class="mt-2 flex items-start gap-1 text-sm text-muted-foreground">
                              <User class="mt-0.5 h-3 w-3 shrink-0" />
                              <span>{formatSpeakers(talk.speakers)}</span>
                            </div>
                          {/if}
                        {:else}
                          <p class="text-sm italic text-muted-foreground">No session scheduled</p>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Mobile/Tablet: Stacked cards by room -->
          <div class="space-y-6 lg:hidden">
            {#each data.rooms as room}
              {@const roomSlots = slotsByRoom()[room.id] || []}
              {#if roomSlots.length > 0}
                <Card.Root>
                  <Card.Header class="pb-3">
                    <Card.Title class="flex items-center gap-2">
                      <DoorOpen class="h-5 w-5" />
                      {room.name}
                    </Card.Title>
                    {#if room.capacity}
                      <Card.Description>{room.capacity} seats</Card.Description>
                    {/if}
                  </Card.Header>
                  <Card.Content class="space-y-3">
                    {#each roomSlots as slot}
                      {@const session = getSessionForSlot(slot.id)}
                      {@const talk = session ? getTalkForSession(session.talkId) : null}
                      {@const typeStyle = session ? getSessionTypeStyle(session.type) : null}

                      <div
                        class="rounded-lg border p-3 {session ? typeStyle?.bg : 'bg-muted/50'}"
                        style={session && session.trackId ? `border-left: 4px solid ${getTrackColor(session.trackId)}` : ''}
                      >
                        <div class="mb-2 flex items-center justify-between">
                          <span class="flex items-center gap-1 text-sm font-medium">
                            <Clock class="h-4 w-4" />
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {#if session}
                            <span class="rounded-full px-2 py-0.5 text-xs font-medium {typeStyle?.bg} {typeStyle?.text}">
                              {typeStyle?.label}
                            </span>
                          {/if}
                        </div>

                        {#if session}
                          <h4 class="font-medium">{session.title}</h4>

                          {#if session.trackId}
                            {@const trackName = getTrackName(session.trackId)}
                            {#if trackName}
                              <div class="mt-1 flex items-center gap-1 text-xs">
                                <div
                                  class="h-2 w-2 rounded-full"
                                  style="background-color: {getTrackColor(session.trackId)}"
                                ></div>
                                <span class="text-muted-foreground">{trackName}</span>
                              </div>
                            {/if}
                          {/if}

                          {#if talk && talk.speakers.length > 0}
                            <div class="mt-2 flex items-start gap-1 text-sm text-muted-foreground">
                              <User class="mt-0.5 h-4 w-4 shrink-0" />
                              <span>{formatSpeakers(talk.speakers)}</span>
                            </div>
                          {/if}
                        {:else}
                          <p class="text-sm italic text-muted-foreground">No session scheduled</p>
                        {/if}
                      </div>
                    {/each}
                  </Card.Content>
                </Card.Root>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- By Track View -->
        {#if scheduleView === 'by-track'}
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each data.tracks as track}
              {@const trackSessions = sessionsByTrack()[track.id] || []}
              <Card.Root>
                <Card.Header class="pb-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="h-4 w-4 rounded-full"
                      style="background-color: {track.color}"
                    ></div>
                    <Card.Title class="text-lg">{track.name}</Card.Title>
                  </div>
                  <Card.Description>
                    {trackSessions.length} session{trackSessions.length !== 1 ? 's' : ''}
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  {#if trackSessions.length === 0}
                    <p class="text-sm italic text-muted-foreground">No sessions in this track</p>
                  {:else}
                    <div class="space-y-3">
                      {#each trackSessions as { session, slot, room }}
                        {@const talk = getTalkForSession(session.talkId)}
                        {@const typeStyle = getSessionTypeStyle(session.type)}

                        <div class="rounded-lg border p-3 transition-shadow hover:shadow-sm {typeStyle.bg}">
                          <div class="mb-2 flex flex-wrap items-center gap-2 text-xs">
                            <span class="flex items-center gap-1 font-mono text-muted-foreground">
                              <Clock class="h-3 w-3" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            {#if room}
                              <span class="flex items-center gap-1 text-muted-foreground">
                                <DoorOpen class="h-3 w-3" />
                                {room.name}
                              </span>
                            {/if}
                          </div>

                          <span class="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium {typeStyle.bg} {typeStyle.text}">
                            {typeStyle.label}
                          </span>

                          <h4 class="font-medium leading-tight">{session.title}</h4>

                          {#if talk && talk.speakers.length > 0}
                            <div class="mt-2 flex items-start gap-1 text-sm text-muted-foreground">
                              <User class="mt-0.5 h-3 w-3 shrink-0" />
                              <span>{formatSpeakers(talk.speakers)}</span>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </Card.Content>
              </Card.Root>
            {/each}

            <!-- No Track sessions -->
            {#if (sessionsByTrack()['no-track'] || []).length > 0}
              {@const noTrackSessions = sessionsByTrack()['no-track']}
              <Card.Root>
                <Card.Header class="pb-3">
                  <div class="flex items-center gap-2">
                    <div class="h-4 w-4 rounded-full bg-gray-400"></div>
                    <Card.Title class="text-lg">General</Card.Title>
                  </div>
                  <Card.Description>
                    {noTrackSessions.length} session{noTrackSessions.length !== 1 ? 's' : ''}
                  </Card.Description>
                </Card.Header>
                <Card.Content>
                  <div class="space-y-3">
                    {#each noTrackSessions as { session, slot, room }}
                      {@const talk = getTalkForSession(session.talkId)}
                      {@const typeStyle = getSessionTypeStyle(session.type)}

                      <div class="rounded-lg border p-3 transition-shadow hover:shadow-sm {typeStyle.bg}">
                        <div class="mb-2 flex flex-wrap items-center gap-2 text-xs">
                          <span class="flex items-center gap-1 font-mono text-muted-foreground">
                            <Clock class="h-3 w-3" />
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {#if room}
                            <span class="flex items-center gap-1 text-muted-foreground">
                              <DoorOpen class="h-3 w-3" />
                              {room.name}
                            </span>
                          {/if}
                        </div>

                        <span class="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium {typeStyle.bg} {typeStyle.text}">
                          {typeStyle.label}
                        </span>

                        <h4 class="font-medium leading-tight">{session.title}</h4>

                        {#if talk && talk.speakers.length > 0}
                          <div class="mt-2 flex items-start gap-1 text-sm text-muted-foreground">
                            <User class="mt-0.5 h-3 w-3 shrink-0" />
                            <span>{formatSpeakers(talk.speakers)}</span>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </Card.Content>
              </Card.Root>
            {/if}
          </div>
        {/if}

        <!-- Legend -->
        <Card.Root class="mt-8">
          <Card.Header>
            <Card.Title class="text-sm">Session Types</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="flex flex-wrap gap-3">
              {#each Object.entries(sessionTypeStyles) as [_type, style]}
                <div class="flex items-center gap-2">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium {style.bg} {style.text}">
                    {style.label}
                  </span>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Tracks Legend (if any tracks exist) -->
        {#if data.tracks.length > 0}
          <Card.Root>
            <Card.Header>
              <Card.Title class="text-sm">Tracks</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="flex flex-wrap gap-4">
                {#each data.tracks as track}
                  <div class="flex items-center gap-2">
                    <div
                      class="h-3 w-3 rounded-full"
                      style="background-color: {track.color}"
                    ></div>
                    <span class="text-sm">{track.name}</span>
                  </div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      {/if}
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t bg-background px-4 py-6">
    <div class="container mx-auto text-center text-sm text-muted-foreground">
      <p>Powered by Open Event Orchestrator</p>
    </div>
  </footer>
</div>
