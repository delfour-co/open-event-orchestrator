<script lang="ts">
import { enhance } from '$app/forms'
import { formatDate as sharedFormatDate } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Clock, DoorOpen, Loader2, Pencil, Plus, Trash2, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showSlotForm = $state(false)
let isSubmitting = $state(false)
let editingSlot = $state<(typeof data.slots)[0] | null>(null)
let selectedRoomId = $state('')

const formatDate = (date: Date) =>
  sharedFormatDate(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

const formatDateInput = (date: Date) => {
  return date.toISOString().split('T')[0]
}

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (form.action === 'createSlot' || form.action === 'updateSlot') {
      showSlotForm = false
      editingSlot = null
    }
  }
})

function startEditSlot(slot: (typeof data.slots)[0]) {
  editingSlot = slot
  selectedRoomId = slot.roomId
  showSlotForm = true
}

function cancelSlotForm() {
  showSlotForm = false
  editingSlot = null
}
</script>

<div class="space-y-4">
  <div class="flex justify-end">
    {#if !showSlotForm}
      <Button onclick={() => { showSlotForm = true; editingSlot = null; selectedRoomId = '' }} disabled={data.rooms.length === 0}>
        <Plus class="mr-2 h-4 w-4" />
        {m.planning_slots_add()}
      </Button>
    {/if}
  </div>

  <!-- Slot Form -->
  {#if showSlotForm}
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title>{editingSlot ? m.planning_slots_edit() : m.planning_slots_add()}</Card.Title>
          <Button variant="ghost" size="icon" onclick={cancelSlotForm} title={m.action_close()}>
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
              <Label for="slot-room">{m.planning_slots_room()} *</Label>
              <select
                id="slot-room"
                name="roomId"
                required
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                bind:value={selectedRoomId}
              >
                <option value="">{m.planning_slots_room_placeholder()}</option>
                {#each data.rooms as room}
                  <option value={room.id}>{room.name}</option>
                {/each}
              </select>
            </div>
            <div class="space-y-2">
              <Label for="slot-date">{m.planning_slots_date()} *</Label>
              <Input
                id="slot-date"
                name="date"
                type="date"
                required
                value={editingSlot ? formatDateInput(editingSlot.date) : formatDateInput(data.edition.startDate)}
              />
            </div>
            <div class="space-y-2">
              <Label for="slot-start">{m.planning_slots_start_time()} *</Label>
              <Input
                id="slot-start"
                name="startTime"
                type="time"
                required
                value={editingSlot?.startTime || ''}
              />
            </div>
            <div class="space-y-2">
              <Label for="slot-end">{m.planning_slots_end_time()} *</Label>
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
              {m.action_cancel()}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {#if isSubmitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {/if}
              {editingSlot ? m.planning_slots_update() : m.planning_slots_create()}
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
        <h3 class="text-lg font-semibold">{m.planning_slots_add_rooms_first()}</h3>
        <p class="text-sm text-muted-foreground">
          {m.planning_slots_add_rooms_first_hint()}
        </p>
      </Card.Content>
    </Card.Root>
  {:else if data.slots.length === 0 && !showSlotForm}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Clock class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.planning_slots_no_slots()}</h3>
        <p class="text-sm text-muted-foreground">
          {m.planning_slots_no_slots_hint()}
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
                {room?.name || m.planning_slots_unknown_room()}
              </div>
            </div>
            <div class="flex gap-1">
              <Button variant="ghost" size="icon" onclick={() => startEditSlot(slot)} title={m.action_edit()}>
                <Pencil class="h-4 w-4" />
              </Button>
              <form method="POST" action="?/deleteSlot" use:enhance={({ cancel }) => {
                if (!confirm('Are you sure you want to delete this slot?')) {
                  cancel()
                  return
                }
              }}>
                <input type="hidden" name="id" value={slot.id} />
                <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive" title={m.action_delete()}>
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

{#if form?.error && form?.action === 'deleteSlot'}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}
