<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  ArrowLeft,
  Calendar,
  Clock,
  DoorOpen,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let activeTab = $state<'schedule' | 'rooms' | 'tracks' | 'slots'>('schedule')
let showRoomForm = $state(false)
let showTrackForm = $state(false)
let showSlotForm = $state(false)
let isSubmitting = $state(false)
let selectedRoomId = $state('')

// Edit states
let editingRoom = $state<(typeof data.rooms)[0] | null>(null)
let editingTrack = $state<(typeof data.tracks)[0] | null>(null)
let editingSlot = $state<(typeof data.slots)[0] | null>(null)

// Equipment options
const equipmentOptions = [
  { value: 'projector', label: 'Projector' },
  { value: 'screen', label: 'Screen' },
  { value: 'microphone', label: 'Microphone' },
  { value: 'whiteboard', label: 'Whiteboard' },
  { value: 'video_recording', label: 'Video Recording' },
  { value: 'live_streaming', label: 'Live Streaming' },
  { value: 'power_outlets', label: 'Power Outlets' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' }
]

let selectedEquipment = $state<string[]>([])

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatDateInput = (date: Date) => {
  return date.toISOString().split('T')[0]
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

const getSessionForSlot = (slotId: string) => {
  return data.sessions.find((s) => s.slotId === slotId)
}

const getTrackColor = (trackId: string | undefined) => {
  if (!trackId) return '#6b7280'
  const track = data.tracks.find((t) => t.id === trackId)
  return track?.color || '#6b7280'
}

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (form.action === 'createRoom' || form.action === 'updateRoom') {
      showRoomForm = false
      editingRoom = null
      selectedEquipment = []
    }
    if (form.action === 'createTrack' || form.action === 'updateTrack') {
      showTrackForm = false
      editingTrack = null
    }
    if (form.action === 'createSlot' || form.action === 'updateSlot') {
      showSlotForm = false
      editingSlot = null
    }
    if (
      form.action === 'deleteRoom' ||
      form.action === 'deleteTrack' ||
      form.action === 'deleteSlot'
    ) {
      // Just close any open forms
    }
  }
})

function startEditRoom(room: (typeof data.rooms)[0]) {
  editingRoom = room
  selectedEquipment = [...room.equipment]
  showRoomForm = true
}

function startEditTrack(track: (typeof data.tracks)[0]) {
  editingTrack = track
  showTrackForm = true
}

function startEditSlot(slot: (typeof data.slots)[0]) {
  editingSlot = slot
  selectedRoomId = slot.roomId
  showSlotForm = true
}

function cancelRoomForm() {
  showRoomForm = false
  editingRoom = null
  selectedEquipment = []
}

function cancelTrackForm() {
  showTrackForm = false
  editingTrack = null
}

function cancelSlotForm() {
  showSlotForm = false
  editingSlot = null
}

function toggleEquipment(value: string) {
  if (selectedEquipment.includes(value)) {
    selectedEquipment = selectedEquipment.filter((e) => e !== value)
  } else {
    selectedEquipment = [...selectedEquipment, value]
  }
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
        {#if !showRoomForm}
          <Button onclick={() => { showRoomForm = true; editingRoom = null; selectedEquipment = [] }}>
            <Plus class="mr-2 h-4 w-4" />
            Add Room
          </Button>
        {/if}
      </div>

      <!-- Room Form -->
      {#if showRoomForm}
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>{editingRoom ? 'Edit Room' : 'Add Room'}</Card.Title>
              <Button variant="ghost" size="icon" onclick={cancelRoomForm}>
                <X class="h-4 w-4" />
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            {#if form?.error && (form?.action === 'createRoom' || form?.action === 'updateRoom')}
              <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {form.error}
              </div>
            {/if}
            <form
              method="POST"
              action={editingRoom ? '?/updateRoom' : '?/createRoom'}
              use:enhance={() => {
                isSubmitting = true
                return async ({ update }) => {
                  isSubmitting = false
                  await update()
                }
              }}
              class="space-y-4"
            >
              <input type="hidden" name="editionId" value={data.edition.id} />
              {#if editingRoom}
                <input type="hidden" name="id" value={editingRoom.id} />
              {/if}

              <div class="grid gap-4 md:grid-cols-3">
                <div class="space-y-2">
                  <Label for="room-name">Name *</Label>
                  <Input
                    id="room-name"
                    name="name"
                    placeholder="Main Hall"
                    required
                    value={editingRoom?.name || ''}
                  />
                </div>
                <div class="space-y-2">
                  <Label for="room-capacity">Capacity</Label>
                  <Input
                    id="room-capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="200"
                    value={editingRoom?.capacity?.toString() || ''}
                  />
                </div>
                <div class="space-y-2">
                  <Label for="room-floor">Floor</Label>
                  <Input
                    id="room-floor"
                    name="floor"
                    placeholder="Ground floor"
                    value={editingRoom?.floor || ''}
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label>Equipment</Label>
                <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {#each equipmentOptions as option}
                    <label class="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="equipment"
                        value={option.value}
                        checked={selectedEquipment.includes(option.value)}
                        onchange={() => toggleEquipment(option.value)}
                        class="h-4 w-4 rounded border-gray-300"
                      />
                      {option.label}
                    </label>
                  {/each}
                </div>
              </div>

              <div class="space-y-2">
                <Label for="room-notes">Equipment Notes</Label>
                <Textarea
                  id="room-notes"
                  name="equipmentNotes"
                  placeholder="Additional equipment details..."
                  value={editingRoom?.equipmentNotes || ''}
                />
              </div>

              <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" onclick={cancelRoomForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  {/if}
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card.Root>
      {/if}

      {#if data.rooms.length === 0 && !showRoomForm}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No rooms yet</h3>
            <p class="text-sm text-muted-foreground">Add your first room to get started.</p>
          </Card.Content>
        </Card.Root>
      {:else if data.rooms.length > 0}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each data.rooms as room}
            <Card.Root>
              <Card.Header>
                <div class="flex items-start justify-between">
                  <div>
                    <Card.Title>{room.name}</Card.Title>
                    {#if room.floor}
                      <Card.Description>Floor: {room.floor}</Card.Description>
                    {/if}
                  </div>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" onclick={() => startEditRoom(room)}>
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <form method="POST" action="?/deleteRoom" use:enhance>
                      <input type="hidden" name="id" value={room.id} />
                      <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive">
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                {#if room.capacity}
                  <p class="text-sm text-muted-foreground">Capacity: {room.capacity}</p>
                {/if}
                {#if room.equipment.length > 0}
                  <div class="mt-2 flex flex-wrap gap-1">
                    {#each room.equipment as eq}
                      <span class="rounded bg-muted px-2 py-0.5 text-xs">
                        {equipmentOptions.find((o) => o.value === eq)?.label || eq}
                      </span>
                    {/each}
                  </div>
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
        {#if !showTrackForm}
          <Button onclick={() => { showTrackForm = true; editingTrack = null }}>
            <Plus class="mr-2 h-4 w-4" />
            Add Track
          </Button>
        {/if}
      </div>

      <!-- Track Form -->
      {#if showTrackForm}
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>{editingTrack ? 'Edit Track' : 'Add Track'}</Card.Title>
              <Button variant="ghost" size="icon" onclick={cancelTrackForm}>
                <X class="h-4 w-4" />
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            {#if form?.error && (form?.action === 'createTrack' || form?.action === 'updateTrack')}
              <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {form.error}
              </div>
            {/if}
            <form
              method="POST"
              action={editingTrack ? '?/updateTrack' : '?/createTrack'}
              use:enhance={() => {
                isSubmitting = true
                return async ({ update }) => {
                  isSubmitting = false
                  await update()
                }
              }}
              class="space-y-4"
            >
              <input type="hidden" name="editionId" value={data.edition.id} />
              {#if editingTrack}
                <input type="hidden" name="id" value={editingTrack.id} />
              {/if}

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="track-name">Name *</Label>
                  <Input
                    id="track-name"
                    name="name"
                    placeholder="Web Development"
                    required
                    value={editingTrack?.name || ''}
                  />
                </div>
                <div class="space-y-2">
                  <Label for="track-color">Color</Label>
                  <div class="flex gap-2">
                    <Input
                      id="track-color"
                      name="color"
                      type="color"
                      value={editingTrack?.color || '#6b7280'}
                      class="h-10 w-16 p-1"
                    />
                  </div>
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" onclick={cancelTrackForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  {/if}
                  {editingTrack ? 'Update Track' : 'Create Track'}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card.Root>
      {/if}

      {#if data.tracks.length === 0 && !showTrackForm}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <Layers class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No tracks yet</h3>
            <p class="text-sm text-muted-foreground">
              Create tracks to organize your sessions by topic.
            </p>
          </Card.Content>
        </Card.Root>
      {:else if data.tracks.length > 0}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each data.tracks as track}
            <Card.Root>
              <Card.Header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="h-4 w-4 rounded-full" style="background-color: {track.color}"></div>
                    <Card.Title>{track.name}</Card.Title>
                  </div>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" onclick={() => startEditTrack(track)}>
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <form method="POST" action="?/deleteTrack" use:enhance>
                      <input type="hidden" name="id" value={track.id} />
                      <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive">
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
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
        {#if !showSlotForm}
          <Button onclick={() => { showSlotForm = true; editingSlot = null; selectedRoomId = '' }} disabled={data.rooms.length === 0}>
            <Plus class="mr-2 h-4 w-4" />
            Add Slot
          </Button>
        {/if}
      </div>

      <!-- Slot Form -->
      {#if showSlotForm}
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>{editingSlot ? 'Edit Slot' : 'Add Slot'}</Card.Title>
              <Button variant="ghost" size="icon" onclick={cancelSlotForm}>
                <X class="h-4 w-4" />
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            {#if form?.error && (form?.action === 'createSlot' || form?.action === 'updateSlot')}
              <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {form.error}
              </div>
            {/if}
            <form
              method="POST"
              action={editingSlot ? '?/updateSlot' : '?/createSlot'}
              use:enhance={() => {
                isSubmitting = true
                return async ({ update }) => {
                  isSubmitting = false
                  await update()
                }
              }}
              class="space-y-4"
            >
              <input type="hidden" name="editionId" value={data.edition.id} />
              {#if editingSlot}
                <input type="hidden" name="id" value={editingSlot.id} />
              {/if}

              <div class="grid gap-4 md:grid-cols-4">
                <div class="space-y-2">
                  <Label for="slot-room">Room *</Label>
                  <select
                    id="slot-room"
                    name="roomId"
                    required
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    bind:value={selectedRoomId}
                  >
                    <option value="">Select a room</option>
                    {#each data.rooms as room}
                      <option value={room.id}>{room.name}</option>
                    {/each}
                  </select>
                </div>
                <div class="space-y-2">
                  <Label for="slot-date">Date *</Label>
                  <Input
                    id="slot-date"
                    name="date"
                    type="date"
                    required
                    value={editingSlot ? formatDateInput(editingSlot.date) : formatDateInput(data.edition.startDate)}
                  />
                </div>
                <div class="space-y-2">
                  <Label for="slot-start">Start Time *</Label>
                  <Input
                    id="slot-start"
                    name="startTime"
                    type="time"
                    required
                    value={editingSlot?.startTime || ''}
                  />
                </div>
                <div class="space-y-2">
                  <Label for="slot-end">End Time *</Label>
                  <Input
                    id="slot-end"
                    name="endTime"
                    type="time"
                    required
                    value={editingSlot?.endTime || ''}
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" onclick={cancelSlotForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  {/if}
                  {editingSlot ? 'Update Slot' : 'Create Slot'}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card.Root>
      {/if}

      {#if data.rooms.length === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">Add rooms first</h3>
            <p class="text-sm text-muted-foreground">
              You need to create rooms before adding time slots.
            </p>
          </Card.Content>
        </Card.Root>
      {:else if data.slots.length === 0 && !showSlotForm}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <Clock class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No time slots yet</h3>
            <p class="text-sm text-muted-foreground">
              Create time slots to define when sessions can occur.
            </p>
          </Card.Content>
        </Card.Root>
      {:else if data.slots.length > 0}
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
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon" onclick={() => startEditSlot(slot)}>
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <form method="POST" action="?/deleteSlot" use:enhance>
                    <input type="hidden" name="id" value={slot.id} />
                    <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if form?.error && form?.action?.startsWith('delete')}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}
