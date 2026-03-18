<script lang="ts">
import { enhance } from '$app/forms'
import { formatDate as sharedFormatDate } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Clock, DoorOpen, GripVertical, Layers, Loader2, Plus } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let scheduleView = $state<'by-room' | 'by-track'>('by-room')
let isSubmitting = $state(false)

// Session form states
let showSessionForm = $state(false)
let editingSession = $state<(typeof data.sessions)[0] | null>(null)
let selectedSlotId = $state<string>('')
let sessionType = $state<string>('talk')
let sessionTitle = $state<string>('')
let selectedTalkId = $state<string>('')
let selectedTrackId = $state<string>('')

// Session type options
const getSessionTypeOptions = () => [
  { value: 'talk', label: m.planning_session_type_talk() },
  { value: 'workshop', label: m.planning_session_type_workshop() },
  { value: 'keynote', label: m.planning_session_type_keynote() },
  { value: 'panel', label: m.planning_session_type_panel() },
  { value: 'break', label: m.planning_session_type_break() },
  { value: 'lunch', label: m.planning_session_type_lunch() },
  { value: 'networking', label: m.planning_session_type_networking() },
  { value: 'registration', label: m.planning_session_type_registration() },
  { value: 'other', label: m.planning_session_type_other() }
]

const talkRequiredTypes = ['talk', 'workshop', 'keynote', 'panel']

const availableTalks = $derived(() => {
  const scheduledTalkIds = new Set(data.sessions.filter((s) => s.talkId).map((s) => s.talkId))
  if (editingSession?.talkId) {
    scheduledTalkIds.delete(editingSession.talkId)
  }
  return data.acceptedTalks.filter((t) => !scheduledTalkIds.has(t.id))
})

const formatDate = (date: Date) =>
  sharedFormatDate(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

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

  grouped['no-track'] = {}
  for (const dateStr of uniqueDates()) {
    grouped['no-track'][dateStr] = []
  }

  for (const track of data.tracks) {
    grouped[track.id] = {}
    for (const dateStr of uniqueDates()) {
      grouped[track.id][dateStr] = []
    }
  }

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

function getSessionTypeLabel(type: string): string {
  return getSessionTypeOptions().find((o) => o.value === type)?.label || type
}

function getSlotInfo(slotId: string) {
  const slot = data.slots.find((s) => s.id === slotId)
  if (!slot) return null
  const room = data.rooms.find((r) => r.id === slot.roomId)
  return {
    ...slot,
    roomName: room?.name || 'Unknown room'
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

function handleTalkSelection(talkId: string) {
  selectedTalkId = talkId
  if (talkId) {
    const talk = data.acceptedTalks.find((t) => t.id === talkId)
    if (talk) {
      sessionTitle = talk.title
    }
  }
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
  }
})

// Drag and drop states
let draggedSessionId = $state<string | null>(null)
let draggedFromSlotId = $state<string | null>(null)
let dragOverSlotId = $state<string | null>(null)
let isDragging = $state(false)

function handleDragStart(event: DragEvent, sessionId: string, slotId: string) {
  if (!event.dataTransfer) return
  draggedSessionId = sessionId
  draggedFromSlotId = slotId
  isDragging = true
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', sessionId)
}

function handleDragEnd() {
  draggedSessionId = null
  draggedFromSlotId = null
  dragOverSlotId = null
  isDragging = false
}

function handleDragOver(event: DragEvent, slotId: string) {
  event.preventDefault()
  if (!event.dataTransfer) return
  if (slotId === draggedFromSlotId) {
    event.dataTransfer.dropEffect = 'none'
    return
  }
  event.dataTransfer.dropEffect = 'move'
  dragOverSlotId = slotId
}

function handleDragLeave() {
  dragOverSlotId = null
}

function handleDrop(event: DragEvent, targetSlotId: string) {
  event.preventDefault()
  if (!draggedSessionId || targetSlotId === draggedFromSlotId) {
    handleDragEnd()
    return
  }

  const targetSession = getSessionForSlot(targetSlotId)
  const formEl = targetSession ? swapFormRef : moveFormRef

  if (formEl) {
    const sessionInput = formEl.querySelector('input[name="sessionId"]') as HTMLInputElement
    const slotInput = formEl.querySelector('input[name="targetSlotId"]') as HTMLInputElement
    if (sessionInput && slotInput) {
      sessionInput.value = draggedSessionId
      slotInput.value = targetSlotId
      formEl.requestSubmit()
    }
  }

  handleDragEnd()
}

let moveFormRef = $state<HTMLFormElement | null>(null)
let swapFormRef = $state<HTMLFormElement | null>(null)
</script>

<!-- Schedule Tab -->
{#if data.rooms.length === 0}
  <Card.Root>
    <Card.Content class="flex flex-col items-center justify-center py-12">
      <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 class="text-lg font-semibold">{m.planning_schedule_no_rooms()}</h3>
      <p class="text-sm text-muted-foreground">
        {m.planning_schedule_no_rooms_hint()}
      </p>
    </Card.Content>
  </Card.Root>
{:else if data.slots.length === 0}
  <Card.Root>
    <Card.Content class="flex flex-col items-center justify-center py-12">
      <Clock class="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 class="text-lg font-semibold">{m.planning_schedule_no_slots()}</h3>
      <p class="text-sm text-muted-foreground">
        {m.planning_schedule_no_slots_hint()}
      </p>
    </Card.Content>
  </Card.Root>
{:else}
  <!-- View Switcher -->
  <div class="mb-4 flex items-center gap-2">
    <span class="text-sm text-muted-foreground">{m.planning_schedule_view()}</span>
    <div class="flex rounded-md border">
      <button
        type="button"
        class="px-3 py-1.5 text-sm transition-colors {scheduleView === 'by-room' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
        onclick={() => (scheduleView = 'by-room')}
      >
        <DoorOpen class="mr-1 inline h-4 w-4" />
        {m.planning_schedule_by_room()}
      </button>
      <button
        type="button"
        class="px-3 py-1.5 text-sm transition-colors {scheduleView === 'by-track' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
        onclick={() => (scheduleView = 'by-track')}
      >
        <Layers class="mr-1 inline h-4 w-4" />
        {m.planning_schedule_by_track()}
      </button>
    </div>
  </div>

  <!-- By Room View -->
  {#if scheduleView === 'by-room'}
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="border bg-muted p-2 text-left font-medium">{m.planning_schedule_room_column()}</th>
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
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      class="relative w-full cursor-pointer rounded p-1 text-left text-xs transition-all {dragOverSlotId === slot.id && draggedFromSlotId !== slot.id ? 'ring-2 ring-primary ring-offset-1' : ''} {isDragging && draggedFromSlotId !== slot.id ? 'hover:ring-2 hover:ring-dashed hover:ring-primary/50' : 'hover:ring-2 hover:ring-primary hover:ring-offset-1'}"
                      style="background-color: {session
                        ? getTrackColor(session.trackId)
                        : '#f3f4f6'}20; border-left: 3px solid {session
                        ? getTrackColor(session.trackId)
                        : '#d1d5db'}; {isDragging && draggedSessionId === session?.id ? 'opacity: 0.5;' : ''}"
                      role="button"
                      tabindex="0"
                      draggable={session ? 'true' : 'false'}
                      ondragstart={(e) => session && handleDragStart(e, session.id, slot.id)}
                      ondragend={handleDragEnd}
                      ondragover={(e) => handleDragOver(e, slot.id)}
                      ondragleave={handleDragLeave}
                      ondrop={(e) => handleDrop(e, slot.id)}
                      onclick={() => !isDragging && openSessionFormForSlot(slot.id)}
                      onkeydown={(e) => e.key === 'Enter' && !isDragging && openSessionFormForSlot(slot.id)}
                    >
                      <div class="flex items-center justify-between font-medium">
                        <span>{slot.startTime} - {slot.endTime}</span>
                        {#if session}
                          <GripVertical class="h-3 w-3 cursor-grab text-muted-foreground" />
                        {/if}
                      </div>
                      {#if session}
                        <div class="truncate">{session.title}</div>
                        <div class="text-muted-foreground">{getSessionTypeLabel(session.type)}</div>
                        {#if isDragging && dragOverSlotId === slot.id && draggedFromSlotId !== slot.id}
                          <div class="absolute inset-0 flex items-center justify-center rounded bg-primary/10">
                            <span class="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                              {m.planning_schedule_swap()}
                            </span>
                          </div>
                        {/if}
                      {:else}
                        {#if isDragging && dragOverSlotId === slot.id && draggedFromSlotId !== slot.id}
                          <div class="flex items-center gap-1 text-primary">
                            <Plus class="h-3 w-3" />
                            {m.planning_schedule_drop_here()}
                          </div>
                        {:else}
                          <div class="flex items-center gap-1 italic text-muted-foreground">
                            <Plus class="h-3 w-3" />
                            {isDragging ? m.planning_schedule_drop_here() : m.planning_schedule_click_to_add()}
                          </div>
                        {/if}
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
                    <p class="text-sm text-muted-foreground italic">{m.planning_schedule_no_sessions()}</p>
                  {:else}
                    <div class="space-y-2">
                      {#each trackSessions as { session, slot, room }}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                          class="w-full cursor-grab rounded-md border p-2 text-left transition-colors hover:bg-muted {isDragging && draggedSessionId === session.id ? 'opacity-50' : ''}"
                          role="button"
                          tabindex="0"
                          draggable="true"
                          ondragstart={(e) => handleDragStart(e, session.id, slot.id)}
                          ondragend={handleDragEnd}
                          onclick={() => !isDragging && openSessionFormForSlot(slot.id)}
                          onkeydown={(e) => e.key === 'Enter' && !isDragging && openSessionFormForSlot(slot.id)}
                        >
                          <div class="flex items-center justify-between">
                            <span class="font-mono text-xs text-muted-foreground">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span class="text-xs text-muted-foreground">
                              {room?.name || m.planning_schedule_unknown_room()}
                            </span>
                          </div>
                          <div class="mt-1 font-medium">{session.title}</div>
                          <div class="text-xs text-muted-foreground">
                            {getSessionTypeLabel(session.type)}
                          </div>
                        </div>
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
                    <Card.Title class="text-base">{m.planning_schedule_no_track()}</Card.Title>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div class="space-y-2">
                    {#each noTrackSessions as { session, slot, room }}
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <div
                        class="w-full cursor-grab rounded-md border p-2 text-left transition-colors hover:bg-muted {isDragging && draggedSessionId === session.id ? 'opacity-50' : ''}"
                        role="button"
                        tabindex="0"
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, session.id, slot.id)}
                        ondragend={handleDragEnd}
                        onclick={() => !isDragging && openSessionFormForSlot(slot.id)}
                        onkeydown={(e) => e.key === 'Enter' && !isDragging && openSessionFormForSlot(slot.id)}
                      >
                        <div class="flex items-center justify-between">
                          <span class="font-mono text-xs text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span class="text-xs text-muted-foreground">
                            {room?.name || m.planning_schedule_unknown_room()}
                          </span>
                        </div>
                        <div class="mt-1 font-medium">{session.title}</div>
                        <div class="text-xs text-muted-foreground">
                          {getSessionTypeLabel(session.type)}
                        </div>
                      </div>
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

<!-- Session Form Dialog -->
{#if showSessionForm}
  <Dialog.Content class="max-w-lg" onClose={cancelSessionForm}>
    <Dialog.Header>
      <Dialog.Title>{editingSession ? m.planning_sessions_form_edit() : m.planning_sessions_form_create()}</Dialog.Title>
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
        <Label for="session-type">{m.planning_sessions_form_type()} *</Label>
        <select
          id="session-type"
          name="type"
          required
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          bind:value={sessionType}
        >
          {#each getSessionTypeOptions() as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="space-y-2">
        <Label for="session-track">{m.planning_sessions_form_track()}</Label>
        <select
          id="session-track"
          name="trackId"
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          bind:value={selectedTrackId}
        >
          <option value="">{m.planning_sessions_form_track_none()}</option>
          {#each data.tracks as track}
            <option value={track.id}>{track.name}</option>
          {/each}
        </select>
      </div>

      {#if talkRequiredTypes.includes(sessionType)}
        <div class="space-y-2">
          <Label for="session-talk">{m.planning_sessions_form_talk()}</Label>
          <select
            id="session-talk"
            name="talkId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={selectedTalkId}
            onchange={(e) => handleTalkSelection(e.currentTarget.value)}
          >
            <option value="">{m.planning_sessions_form_talk_placeholder()}</option>
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
                  {currentTalk.title} {m.planning_sessions_form_talk_current()}
                </option>
              {/if}
            {/if}
          </select>
          <p class="text-xs text-muted-foreground">
            {m.planning_sessions_form_talks_available({ count: availableTalks().length })}
          </p>
        </div>
      {/if}

      <div class="space-y-2">
        <Label for="session-title">{m.planning_sessions_form_session_title()} *</Label>
        <Input
          id="session-title"
          name="title"
          required
          placeholder={talkRequiredTypes.includes(sessionType) ? m.planning_sessions_form_title_placeholder_talk() : m.planning_sessions_form_title_placeholder()}
          bind:value={sessionTitle}
        />
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={cancelSessionForm}>
          {m.action_cancel()}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          {editingSession ? m.planning_sessions_form_update_button() : m.planning_sessions_form_create_button()}
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

{#if form?.error && (form?.action === 'moveSession' || form?.action === 'swapSessions')}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}

<!-- Hidden forms for drag and drop -->
<form
  bind:this={moveFormRef}
  method="POST"
  action="?/moveSession"
  use:enhance
  class="hidden"
>
  <input type="hidden" name="sessionId" value="" />
  <input type="hidden" name="targetSlotId" value="" />
</form>

<form
  bind:this={swapFormRef}
  method="POST"
  action="?/swapSessions"
  use:enhance
  class="hidden"
>
  <input type="hidden" name="sessionId" value="" />
  <input type="hidden" name="targetSlotId" value="" />
</form>
