<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  DoorOpen,
  ExternalLink,
  Layers,
  Loader2,
  Mic,
  Pencil,
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let activeTab = $state<'schedule' | 'sessions' | 'rooms' | 'tracks' | 'slots' | 'staff'>('schedule')
let scheduleView = $state<'by-room' | 'by-track'>('by-room')
let copiedUrl = $state(false)
let showRoomForm = $state(false)
let showTrackForm = $state(false)
let showSlotForm = $state(false)
let isSubmitting = $state(false)
let selectedRoomId = $state('')

// Edit states
let editingRoom = $state<(typeof data.rooms)[0] | null>(null)
let editingTrack = $state<(typeof data.tracks)[0] | null>(null)
let editingSlot = $state<(typeof data.slots)[0] | null>(null)

// Room assignment form states
let showAssignmentForm = $state(false)
let editingAssignment = $state<(typeof data.roomAssignments)[0] | null>(null)
let assignmentRoomId = $state<string>('')
let assignmentMemberId = $state<string>('')
let assignmentDate = $state<string>('')
let assignmentStartTime = $state<string>('')
let assignmentEndTime = $state<string>('')
let assignmentNotes = $state<string>('')

// Session form states
let showSessionForm = $state(false)
let editingSession = $state<(typeof data.sessions)[0] | null>(null)
let selectedSlotId = $state<string>('')
let sessionType = $state<string>('talk')
let sessionTitle = $state<string>('')
let selectedTalkId = $state<string>('')
let selectedTrackId = $state<string>('')

// Session type options
const sessionTypeOptions = [
  { value: 'talk', label: 'Talk' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'panel', label: 'Panel' },
  { value: 'break', label: 'Break' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'networking', label: 'Networking' },
  { value: 'registration', label: 'Registration' },
  { value: 'other', label: 'Other' }
]

// Types that require a talk
const talkRequiredTypes = ['talk', 'workshop', 'keynote', 'panel']

// Computed: available talks (accepted/confirmed but not yet scheduled)
const availableTalks = $derived(() => {
  const scheduledTalkIds = new Set(data.sessions.filter((s) => s.talkId).map((s) => s.talkId))
  // When editing, include the currently assigned talk as available
  if (editingSession?.talkId) {
    scheduledTalkIds.delete(editingSession.talkId)
  }
  return data.acceptedTalks.filter((t) => !scheduledTalkIds.has(t.id))
})

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

// Group sessions by track and date for track view
const sessionsByTrackAndDate = $derived(() => {
  const grouped: Record<
    string,
    Record<
      string,
      Array<{
        session: (typeof data.sessions)[0]
        slot: (typeof data.slots)[0]
        room: (typeof data.rooms)[0] | undefined
      }>
    >
  > = {}

  // Initialize with "No Track" group
  grouped['no-track'] = {}
  for (const dateStr of uniqueDates()) {
    grouped['no-track'][dateStr] = []
  }

  // Initialize track groups
  for (const track of data.tracks) {
    grouped[track.id] = {}
    for (const dateStr of uniqueDates()) {
      grouped[track.id][dateStr] = []
    }
  }

  // Populate with sessions
  for (const session of data.sessions) {
    const slot = data.slots.find((s) => s.id === session.slotId)
    if (!slot) continue

    const dateStr = slot.date.toISOString().split('T')[0]
    const room = data.rooms.find((r) => r.id === slot.roomId)
    const trackId = session.trackId || 'no-track'

    if (grouped[trackId]?.[dateStr]) {
      grouped[trackId][dateStr].push({ session, slot, room })
    }
  }

  // Sort each day's sessions by start time
  for (const trackId of Object.keys(grouped)) {
    for (const dateStr of Object.keys(grouped[trackId])) {
      grouped[trackId][dateStr].sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
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

// Get public schedule URL
const publicScheduleUrl = $derived(
  `${typeof window !== 'undefined' ? window.location.origin : ''}/schedule/${data.edition.slug}`
)

async function copyScheduleUrl() {
  try {
    await navigator.clipboard.writeText(publicScheduleUrl)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input')
    input.value = publicScheduleUrl
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  }
}

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

// Session form functions
function openSessionFormForSlot(slotId: string) {
  const existingSession = getSessionForSlot(slotId)
  if (existingSession) {
    startEditSession(existingSession)
  } else {
    selectedSlotId = slotId
    editingSession = null
    sessionType = 'talk'
    sessionTitle = ''
    selectedTalkId = ''
    selectedTrackId = ''
    showSessionForm = true
  }
}

function startEditSession(session: (typeof data.sessions)[0]) {
  editingSession = session
  selectedSlotId = session.slotId
  sessionType = session.type
  sessionTitle = session.title
  selectedTalkId = session.talkId || ''
  selectedTrackId = session.trackId || ''
  showSessionForm = true
}

function cancelSessionForm() {
  showSessionForm = false
  editingSession = null
  selectedSlotId = ''
  sessionType = 'talk'
  sessionTitle = ''
  selectedTalkId = ''
  selectedTrackId = ''
}

// Auto-fill title when selecting a talk
function handleTalkSelection(talkId: string) {
  selectedTalkId = talkId
  if (talkId) {
    const talk = data.acceptedTalks.find((t) => t.id === talkId)
    if (talk) {
      sessionTitle = talk.title
    }
  }
}

// Get slot info for display
function getSlotInfo(slotId: string) {
  const slot = data.slots.find((s) => s.id === slotId)
  if (!slot) return null
  const room = data.rooms.find((r) => r.id === slot.roomId)
  return {
    ...slot,
    roomName: room?.name || 'Unknown room'
  }
}

// Get session type label
function getSessionTypeLabel(type: string): string {
  return sessionTypeOptions.find((o) => o.value === type)?.label || type
}

// Close session form on successful submission
$effect(() => {
  if (form?.success) {
    if (
      form.action === 'createSession' ||
      form.action === 'updateSession' ||
      form.action === 'deleteSession'
    ) {
      cancelSessionForm()
    }
    if (
      form.action === 'createRoomAssignment' ||
      form.action === 'updateRoomAssignment' ||
      form.action === 'deleteRoomAssignment'
    ) {
      cancelAssignmentForm()
    }
  }
})

// Room assignment functions
function startEditAssignment(assignment: (typeof data.roomAssignments)[0]) {
  editingAssignment = assignment
  assignmentRoomId = assignment.roomId
  assignmentMemberId = assignment.memberId
  assignmentDate = assignment.date ? assignment.date.toISOString().split('T')[0] : ''
  assignmentStartTime = assignment.startTime || ''
  assignmentEndTime = assignment.endTime || ''
  assignmentNotes = assignment.notes || ''
  showAssignmentForm = true
}

function cancelAssignmentForm() {
  showAssignmentForm = false
  editingAssignment = null
  assignmentRoomId = ''
  assignmentMemberId = ''
  assignmentDate = ''
  assignmentStartTime = ''
  assignmentEndTime = ''
  assignmentNotes = ''
}

function openAssignmentFormForRoom(roomId: string) {
  cancelAssignmentForm()
  assignmentRoomId = roomId
  showAssignmentForm = true
}

// Get assignments for a room
function getAssignmentsForRoom(roomId: string) {
  return data.roomAssignments.filter((a) => a.roomId === roomId)
}

// Computed: rooms without assignments
const roomsWithoutAssignments = $derived(() => {
  const roomsWithAssignments = new Set(data.roomAssignments.map((a) => a.roomId))
  return data.rooms.filter((r) => !roomsWithAssignments.has(r.id))
})
</script>

<svelte:head>
  <title>Planning - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
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
    <!-- Public Schedule URL -->
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
        <span class="text-sm text-muted-foreground">Public URL:</span>
        <code class="text-sm">/schedule/{data.edition.slug}</code>
      </div>
      <Button variant="outline" size="sm" onclick={copyScheduleUrl} class="gap-2">
        {#if copiedUrl}
          <Check class="h-4 w-4 text-green-500" />
          Copied
        {:else}
          <Copy class="h-4 w-4" />
          Copy
        {/if}
      </Button>
      <a href="/schedule/{data.edition.slug}" target="_blank">
        <Button variant="outline" size="sm" class="gap-2">
          <ExternalLink class="h-4 w-4" />
          Open
        </Button>
      </a>
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
      variant={activeTab === 'sessions' ? 'default' : 'ghost'}
      onclick={() => (activeTab = 'sessions')}
      class="flex items-center gap-2"
    >
      <Mic class="h-4 w-4" />
      Sessions ({data.sessions.length})
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
    <Button
      variant={activeTab === 'staff' ? 'default' : 'ghost'}
      onclick={() => (activeTab = 'staff')}
      class="flex items-center gap-2"
    >
      <Users class="h-4 w-4" />
      Staff ({data.roomAssignments.length})
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
      <!-- View Switcher -->
      <div class="mb-4 flex items-center gap-2">
        <span class="text-sm text-muted-foreground">View:</span>
        <div class="flex rounded-md border">
          <button
            type="button"
            class="px-3 py-1.5 text-sm transition-colors {scheduleView === 'by-room' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
            onclick={() => (scheduleView = 'by-room')}
          >
            <DoorOpen class="mr-1 inline h-4 w-4" />
            By Room
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm transition-colors {scheduleView === 'by-track' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
            onclick={() => (scheduleView = 'by-track')}
          >
            <Layers class="mr-1 inline h-4 w-4" />
            By Track
          </button>
        </div>
      </div>

      <!-- By Room View -->
      {#if scheduleView === 'by-room'}
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
                        <button
                          type="button"
                          onclick={() => openSessionFormForSlot(slot.id)}
                          class="w-full cursor-pointer rounded p-1 text-left text-xs transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1"
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
                            <div class="text-muted-foreground">{getSessionTypeLabel(session.type)}</div>
                          {:else}
                            <div class="flex items-center gap-1 italic text-muted-foreground">
                              <Plus class="h-3 w-3" />
                              Click to add session
                            </div>
                          {/if}
                        </button>
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

      <!-- By Track View -->
      {#if scheduleView === 'by-track'}
        <div class="space-y-6">
          {#each uniqueDates() as dateStr}
            <div>
              <h3 class="mb-3 text-lg font-semibold">{formatDate(new Date(dateStr))}</h3>
              <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each data.tracks as track}
                  {@const trackSessions = sessionsByTrackAndDate()[track.id]?.[dateStr] || []}
                  <Card.Root>
                    <Card.Header class="pb-2">
                      <div class="flex items-center gap-2">
                        <div
                          class="h-3 w-3 rounded-full"
                          style="background-color: {track.color}"
                        ></div>
                        <Card.Title class="text-base">{track.name}</Card.Title>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      {#if trackSessions.length === 0}
                        <p class="text-sm text-muted-foreground italic">No sessions</p>
                      {:else}
                        <div class="space-y-2">
                          {#each trackSessions as { session, slot, room }}
                            <button
                              type="button"
                              class="w-full rounded-md border p-2 text-left transition-colors hover:bg-muted"
                              onclick={() => openSessionFormForSlot(slot.id)}
                            >
                              <div class="flex items-center justify-between">
                                <span class="font-mono text-xs text-muted-foreground">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <span class="text-xs text-muted-foreground">
                                  {room?.name || 'Unknown'}
                                </span>
                              </div>
                              <div class="mt-1 font-medium">{session.title}</div>
                              <div class="text-xs text-muted-foreground">
                                {getSessionTypeLabel(session.type)}
                              </div>
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </Card.Content>
                  </Card.Root>
                {/each}

                <!-- No Track sessions -->
                {#if (sessionsByTrackAndDate()['no-track']?.[dateStr] || []).length > 0}
                  {@const noTrackSessions = sessionsByTrackAndDate()['no-track'][dateStr]}
                  <Card.Root>
                    <Card.Header class="pb-2">
                      <div class="flex items-center gap-2">
                        <div class="h-3 w-3 rounded-full bg-gray-400"></div>
                        <Card.Title class="text-base">No Track</Card.Title>
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div class="space-y-2">
                        {#each noTrackSessions as { session, slot, room }}
                          <button
                            type="button"
                            class="w-full rounded-md border p-2 text-left transition-colors hover:bg-muted"
                            onclick={() => openSessionFormForSlot(slot.id)}
                          >
                            <div class="flex items-center justify-between">
                              <span class="font-mono text-xs text-muted-foreground">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <span class="text-xs text-muted-foreground">
                                {room?.name || 'Unknown'}
                              </span>
                            </div>
                            <div class="mt-1 font-medium">{session.title}</div>
                            <div class="text-xs text-muted-foreground">
                              {getSessionTypeLabel(session.type)}
                            </div>
                          </button>
                        {/each}
                      </div>
                    </Card.Content>
                  </Card.Root>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  {/if}

  <!-- Sessions Tab -->
  {#if activeTab === 'sessions'}
    <div class="space-y-6">
      <!-- Available Talks Section -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Mic class="h-5 w-5" />
            Available Talks ({availableTalks().length})
          </Card.Title>
          <Card.Description>
            Accepted talks that have not yet been scheduled
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if availableTalks().length === 0}
            <div class="py-8 text-center text-muted-foreground">
              {#if data.acceptedTalks.length === 0}
                <p>No accepted talks yet. Accept talks from the CFP to schedule them.</p>
              {:else}
                <div class="flex items-center justify-center gap-2">
                  <Check class="h-5 w-5 text-green-500" />
                  <p>All accepted talks have been scheduled.</p>
                </div>
              {/if}
            </div>
          {:else}
            <div class="space-y-2">
              {#each availableTalks() as talk}
                <div class="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div class="font-medium">{talk.title}</div>
                    {#if talk.speakers && talk.speakers.length > 0}
                      <div class="text-sm text-muted-foreground">
                        {talk.speakers.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                      </div>
                    {/if}
                    {#if talk.duration}
                      <div class="text-xs text-muted-foreground">{talk.duration} min</div>
                    {/if}
                  </div>
                  <span class="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                    {talk.status}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Scheduled Sessions Section -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            Scheduled Sessions ({data.sessions.length})
          </Card.Title>
          <Card.Description>
            All sessions currently in the schedule
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if data.sessions.length === 0}
            <div class="py-8 text-center text-muted-foreground">
              <p>No sessions scheduled yet. Click on empty slots in the Schedule tab to add sessions.</p>
            </div>
          {:else}
            <div class="space-y-2">
              {#each data.sessions as session}
                {@const slotInfo = getSlotInfo(session.slotId)}
                {@const track = session.trackId ? data.tracks.find((t) => t.id === session.trackId) : null}
                <div class="flex items-center justify-between rounded-lg border p-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <div class="font-medium">{session.title}</div>
                      <span class="rounded bg-muted px-2 py-0.5 text-xs">
                        {getSessionTypeLabel(session.type)}
                      </span>
                    </div>
                    {#if slotInfo}
                      <div class="text-sm text-muted-foreground">
                        {slotInfo.roomName} - {formatDate(slotInfo.date)} - {slotInfo.startTime} to {slotInfo.endTime}
                      </div>
                    {/if}
                    {#if track}
                      <div class="mt-1 flex items-center gap-1">
                        <div class="h-3 w-3 rounded-full" style="background-color: {track.color}"></div>
                        <span class="text-xs text-muted-foreground">{track.name}</span>
                      </div>
                    {/if}
                  </div>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" onclick={() => { startEditSession(session); activeTab = 'schedule' }}>
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <form method="POST" action="?/deleteSession" use:enhance>
                      <input type="hidden" name="id" value={session.id} />
                      <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive">
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
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

  <!-- Staff Tab -->
  {#if activeTab === 'staff'}
    <div class="space-y-4">
      <div class="flex justify-end">
        {#if !showAssignmentForm}
          <Button onclick={() => (showAssignmentForm = true)}>
            <Plus class="mr-2 h-4 w-4" />
            Add Assignment
          </Button>
        {/if}
      </div>

      <!-- Assignment Form -->
      {#if showAssignmentForm}
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>{editingAssignment ? 'Edit Assignment' : 'Add Staff Assignment'}</Card.Title>
              <Button variant="ghost" size="icon" onclick={cancelAssignmentForm}>
                <X class="h-4 w-4" />
              </Button>
            </div>
            <Card.Description>
              Assign organization members to rooms for this edition.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {#if form?.error && (form?.action === 'createRoomAssignment' || form?.action === 'updateRoomAssignment')}
              <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {form.error}
              </div>
            {/if}
            <form
              method="POST"
              action={editingAssignment ? '?/updateRoomAssignment' : '?/createRoomAssignment'}
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
              {#if editingAssignment}
                <input type="hidden" name="id" value={editingAssignment.id} />
              {/if}

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="assignment-room">Room *</Label>
                  <select
                    id="assignment-room"
                    name="roomId"
                    required
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    bind:value={assignmentRoomId}
                  >
                    <option value="">Select a room</option>
                    {#each data.rooms as room}
                      <option value={room.id}>{room.name}</option>
                    {/each}
                  </select>
                </div>

                <div class="space-y-2">
                  <Label for="assignment-member">Team Member *</Label>
                  <select
                    id="assignment-member"
                    name="memberId"
                    required
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    bind:value={assignmentMemberId}
                  >
                    <option value="">Select a team member</option>
                    {#each data.organizationMembers as member}
                      <option value={member.id}>{member.userName} ({member.role})</option>
                    {/each}
                  </select>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <div class="space-y-2">
                  <Label for="assignment-date">Date (optional)</Label>
                  <Input
                    id="assignment-date"
                    name="date"
                    type="date"
                    bind:value={assignmentDate}
                  />
                  <p class="text-xs text-muted-foreground">Leave empty for all edition days</p>
                </div>
                <div class="space-y-2">
                  <Label for="assignment-start">Start Time (optional)</Label>
                  <Input
                    id="assignment-start"
                    name="startTime"
                    type="time"
                    bind:value={assignmentStartTime}
                  />
                </div>
                <div class="space-y-2">
                  <Label for="assignment-end">End Time (optional)</Label>
                  <Input
                    id="assignment-end"
                    name="endTime"
                    type="time"
                    bind:value={assignmentEndTime}
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="assignment-notes">Notes</Label>
                <Textarea
                  id="assignment-notes"
                  name="notes"
                  placeholder="Any special instructions or notes..."
                  bind:value={assignmentNotes}
                />
              </div>

              <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" onclick={cancelAssignmentForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  {/if}
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card.Root>
      {/if}

      {#if data.organizationMembers.length === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <Users class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No team members</h3>
            <p class="text-sm text-muted-foreground">
              Add members to your organization first in organization settings.
            </p>
          </Card.Content>
        </Card.Root>
      {:else if data.rooms.length === 0}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">Add rooms first</h3>
            <p class="text-sm text-muted-foreground">
              You need to create rooms before assigning staff.
            </p>
          </Card.Content>
        </Card.Root>
      {:else if data.roomAssignments.length === 0 && !showAssignmentForm}
        <Card.Root>
          <Card.Content class="flex flex-col items-center justify-center py-12">
            <Users class="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-semibold">No staff assignments yet</h3>
            <p class="text-sm text-muted-foreground">
              Assign team members to rooms to manage who is responsible for each space.
            </p>
          </Card.Content>
        </Card.Root>
      {:else}
        <!-- Group assignments by room -->
        <div class="space-y-4">
          {#each data.rooms as room}
            {@const assignments = getAssignmentsForRoom(room.id)}
            {#if assignments.length > 0}
              <Card.Root>
                <Card.Header class="pb-3">
                  <div class="flex items-center justify-between">
                    <Card.Title class="text-lg">{room.name}</Card.Title>
                    <Button variant="outline" size="sm" onclick={() => openAssignmentFormForRoom(room.id)}>
                      <Plus class="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>
                  {#if room.floor}
                    <Card.Description>{room.floor}</Card.Description>
                  {/if}
                </Card.Header>
                <Card.Content class="pt-0">
                  <div class="space-y-2">
                    {#each assignments as assignment}
                      <div class="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div class="font-medium">{assignment.memberName}</div>
                          <div class="text-sm text-muted-foreground">
                            {#if assignment.date}
                              {formatDate(assignment.date)}
                              {#if assignment.startTime && assignment.endTime}
                                • {assignment.startTime} - {assignment.endTime}
                              {/if}
                            {:else}
                              All edition days
                            {/if}
                          </div>
                          {#if assignment.notes}
                            <div class="mt-1 text-sm text-muted-foreground italic">
                              {assignment.notes}
                            </div>
                          {/if}
                        </div>
                        <div class="flex gap-1">
                          <Button variant="ghost" size="icon" onclick={() => startEditAssignment(assignment)}>
                            <Pencil class="h-4 w-4" />
                          </Button>
                          <form method="POST" action="?/deleteRoomAssignment" use:enhance>
                            <input type="hidden" name="id" value={assignment.id} />
                            <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive">
                              <Trash2 class="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    {/each}
                  </div>
                </Card.Content>
              </Card.Root>
            {/if}
          {/each}

          <!-- Rooms without assignments -->
          {#if roomsWithoutAssignments().length > 0}
            <Card.Root>
              <Card.Header>
                <Card.Title class="text-lg">Unassigned Rooms</Card.Title>
                <Card.Description>These rooms have no staff assigned yet.</Card.Description>
              </Card.Header>
              <Card.Content>
                <div class="flex flex-wrap gap-2">
                  {#each roomsWithoutAssignments() as room}
                    <Button variant="outline" size="sm" onclick={() => openAssignmentFormForRoom(room.id)}>
                      <Plus class="mr-1 h-3 w-3" />
                      {room.name}
                    </Button>
                  {/each}
                </div>
              </Card.Content>
            </Card.Root>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Session Form Dialog -->
{#if showSessionForm}
  <Dialog.Content class="max-w-lg" onClose={cancelSessionForm}>
    <Dialog.Header>
      <Dialog.Title>{editingSession ? 'Edit Session' : 'Create Session'}</Dialog.Title>
      {#if selectedSlotId}
        {@const slotInfo = getSlotInfo(selectedSlotId)}
        {#if slotInfo}
          <Dialog.Description>
            {slotInfo.roomName} • {formatDate(slotInfo.date)} • {slotInfo.startTime} - {slotInfo.endTime}
          </Dialog.Description>
        {/if}
      {/if}
    </Dialog.Header>

    {#if form?.error && (form?.action === 'createSession' || form?.action === 'updateSession')}
      <div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
        {form.error}
      </div>
    {/if}

    <form
      method="POST"
      action={editingSession ? '?/updateSession' : '?/createSession'}
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
      <input type="hidden" name="slotId" value={selectedSlotId} />
      {#if editingSession}
        <input type="hidden" name="id" value={editingSession.id} />
      {/if}

      <div class="space-y-2">
        <Label for="session-type">Session Type *</Label>
        <select
          id="session-type"
          name="type"
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          bind:value={sessionType}
        >
          {#each sessionTypeOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="space-y-2">
        <Label for="session-track">Track</Label>
        <select
          id="session-track"
          name="trackId"
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          bind:value={selectedTrackId}
        >
          <option value="">No track</option>
          {#each data.tracks as track}
            <option value={track.id}>{track.name}</option>
          {/each}
        </select>
      </div>

      {#if talkRequiredTypes.includes(sessionType)}
        <div class="space-y-2">
          <Label for="session-talk">Talk</Label>
          <select
            id="session-talk"
            name="talkId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={selectedTalkId}
            onchange={(e) => handleTalkSelection(e.currentTarget.value)}
          >
            <option value="">Select a talk (optional)</option>
            {#each availableTalks() as talk}
              <option value={talk.id}>
                {talk.title}
                {#if talk.speakers && talk.speakers.length > 0}
                  - {talk.speakers.map((s) => s.firstName).join(', ')}
                {/if}
              </option>
            {/each}
            {#if editingSession?.talkId}
              {@const currentTalk = data.acceptedTalks.find((t) => t.id === editingSession?.talkId)}
              {#if currentTalk && !availableTalks().find((t) => t.id === currentTalk.id)}
                <option value={currentTalk.id}>
                  {currentTalk.title} (current)
                </option>
              {/if}
            {/if}
          </select>
          <p class="text-xs text-muted-foreground">
            {availableTalks().length} accepted talk{availableTalks().length !== 1 ? 's' : ''} available
          </p>
        </div>
      {/if}

      <div class="space-y-2">
        <Label for="session-title">Title *</Label>
        <Input
          id="session-title"
          name="title"
          required
          placeholder={talkRequiredTypes.includes(sessionType) ? 'Auto-filled from talk or enter custom title' : 'Enter session title'}
          bind:value={sessionTitle}
        />
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={cancelSessionForm}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          {editingSession ? 'Update Session' : 'Create Session'}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

{#if form?.error && form?.action?.startsWith('delete')}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}
