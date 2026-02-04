<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowLeft, Calendar, Clock, DoorOpen, Layers, Plus } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let activeTab = $state<'schedule' | 'rooms' | 'tracks' | 'slots'>('schedule')

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// Get unique dates from slots
const uniqueDates = $derived(() => {
  const dates = new Set<string>()
  for (const slot of data.slots) {
    dates.add(slot.date.toISOString().split('T')[0])
  }
  return Array.from(dates).sort()
})

// Group slots by room and date for the schedule grid
const slotsByRoomAndDate = $derived(() => {
  const grouped: Record<string, Record<string, typeof data.slots>> = {}
  for (const room of data.rooms) {
    grouped[room.id] = {}
    for (const dateStr of uniqueDates()) {
      grouped[room.id][dateStr] = data.slots.filter(
        (s) => s.roomId === room.id && s.date.toISOString().split('T')[0] === dateStr
      )
    }
  }
  return grouped
})

// Get session for a slot
const getSessionForSlot = (slotId: string) => {
  return data.sessions.find((s) => s.slotId === slotId)
}

// Get track color for a session
const getTrackColor = (trackId: string | undefined) => {
  if (!trackId) return '#6b7280'
  const track = data.tracks.find((t) => t.id === trackId)
  return track?.color || '#6b7280'
}
</script>

<svelte:head>
  <title>Planning - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/planning">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
      <p class="text-muted-foreground">
        {formatDate(data.edition.startDate)} - {formatDate(data.edition.endDate)}
      </p>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="flex gap-2 border-b pb-2">
    <Button
      variant={activeTab === 'schedule' ? 'default' : 'ghost'}
      onclick={() => (activeTab = 'schedule')}
      class="flex items-center gap-2"
    >
      <Calendar class="h-4 w-4" />
      Schedule
    </Button>
    <Button
      variant={activeTab === 'rooms' ? 'default' : 'ghost'}
      onclick={() => (activeTab = 'rooms')}
      class="flex items-center gap-2"
    >
      <DoorOpen class="h-4 w-4" />
      Rooms ({data.rooms.length})
    </Button>
    <Button
      variant={activeTab === 'tracks' ? 'default' : 'ghost'}
      onclick={() => (activeTab = 'tracks')}
      class="flex items-center gap-2"
    >
      <Layers class="h-4 w-4" />
      Tracks ({data.tracks.length})
    </Button>
    <Button
      variant={activeTab === 'slots' ? 'default' : 'ghost'}
      onclick={() => (activeTab = 'slots')}
      class="flex items-center gap-2"
    >
      <Clock class="h-4 w-4" />
      Slots ({data.slots.length})
    </Button>
  </div>

  <!-- Schedule Tab -->
  {#if activeTab === 'schedule'}
    {#if data.rooms.length === 0}
      <Card.Root>
        <Card.Content class="flex flex-col items-center justify-center py-12">
          <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 class="text-lg font-semibold">No rooms configured</h3>
          <p class="text-sm text-muted-foreground">
            Go to the Rooms tab to add rooms before creating your schedule.
          </p>
        </Card.Content>
      </Card.Root>
    {:else if data.slots.length === 0}
      <Card.Root>
        <Card.Content class="flex flex-col items-center justify-center py-12">
          <Clock class="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 class="text-lg font-semibold">No time slots configured</h3>
          <p class="text-sm text-muted-foreground">
            Go to the Slots tab to add time slots and start building your schedule.
          </p>
        </Card.Content>
      </Card.Root>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="border bg-muted p-2 text-left font-medium">Room</th>
              {#each uniqueDates() as dateStr}
                <th class="border bg-muted p-2 text-center font-medium">
                  {formatDate(new Date(dateStr))}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each data.rooms as room}
              <tr>
                <td class="border p-2 font-medium">
                  {room.name}
                  {#if room.capacity}
                    <span class="text-xs text-muted-foreground">({room.capacity})</span>
                  {/if}
                </td>
                {#each uniqueDates() as dateStr}
                  <td class="border p-2">
                    <div class="flex flex-col gap-1">
                      {#each slotsByRoomAndDate()[room.id][dateStr] || [] as slot}
                        {@const session = getSessionForSlot(slot.id)}
                        <div
                          class="rounded p-1 text-xs"
                          style="background-color: {session
                            ? getTrackColor(session.trackId)
                            : '#f3f4f6'}20; border-left: 3px solid {session
                            ? getTrackColor(session.trackId)
                            : '#d1d5db'}"
                        >
                          <div class="font-medium">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          {#if session}
                            <div class="truncate">{session.title}</div>
                          {:else}
                            <div class="italic text-muted-foreground">Empty</div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}

  <!-- Rooms Tab -->
  {#if activeTab === 'rooms'}
    <div class="space-y-4">
      <div class="flex justify-end">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {#if data.rooms.length === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No rooms yet</h3>
            <p class="text-sm text-muted-foreground">Add your first room to get started.</p>
          </Card.Content>
        </Card.Root>
      {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each data.rooms as room}
            <Card.Root>
              <Card.Header>
                <Card.Title>{room.name}</Card.Title>
                {#if room.floor}
                  <Card.Description>Floor: {room.floor}</Card.Description>
                {/if}
              </Card.Header>
              <Card.Content>
                {#if room.capacity}
                  <p class="text-sm text-muted-foreground">Capacity: {room.capacity}</p>
                {/if}
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Tracks Tab -->
  {#if activeTab === 'tracks'}
    <div class="space-y-4">
      <div class="flex justify-end">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          Add Track
        </Button>
      </div>

      {#if data.tracks.length === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <Layers class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No tracks yet</h3>
            <p class="text-sm text-muted-foreground">
              Create tracks to organize your sessions by topic.
            </p>
          </Card.Content>
        </Card.Root>
      {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each data.tracks as track}
            <Card.Root>
              <Card.Header>
                <div class="flex items-center gap-3">
                  <div class="h-4 w-4 rounded-full" style="background-color: {track.color}"></div>
                  <Card.Title>{track.name}</Card.Title>
                </div>
              </Card.Header>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Slots Tab -->
  {#if activeTab === 'slots'}
    <div class="space-y-4">
      <div class="flex justify-end">
        <Button>
          <Plus class="mr-2 h-4 w-4" />
          Add Slot
        </Button>
      </div>

      {#if data.slots.length === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <Clock class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No time slots yet</h3>
            <p class="text-sm text-muted-foreground">
              Create time slots to define when sessions can occur.
            </p>
          </Card.Content>
        </Card.Root>
      {:else}
        <div class="space-y-2">
          {#each data.slots as slot}
            {@const room = data.rooms.find((r) => r.id === slot.roomId)}
            <Card.Root>
              <Card.Content class="flex items-center justify-between py-3">
                <div class="flex items-center gap-4">
                  <div class="font-mono text-sm">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {formatDate(slot.date)}
                  </div>
                  <div class="text-sm">
                    {room?.name || 'Unknown room'}
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
